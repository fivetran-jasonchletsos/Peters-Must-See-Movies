# ============================================
# Web hosting — S3 + CloudFront SPA
# ============================================
#
# Design decisions:
#
# OAC vs OAI: Origin Access Control (OAC) is used, not the legacy Origin
# Access Identity (OAI). OAC is the current AWS recommendation as of 2023;
# it supports SSE-S3, SSE-KMS, and signing SigV4A, and AWS has signalled OAI
# is on a deprecation path.
#
# Cache policy: the managed "CachingOptimized" policy
# (658327ea-f89d-4fab-a63d-7e88639e58f6) is used for the default behavior.
# It caches on the CloudFront edge, honours Cache-Control headers from S3,
# and requires no custom policy. For a single-page app serving static assets
# this is the simplest correct choice.
#
# ACM certificate: conditionally created only when var.domain_name is set.
# It must use the aws.us_east_1 provider alias because CloudFront requires
# certificates in us-east-1, regardless of where the rest of the stack lives.
#
# Route53 record: conditionally created only when var.hosted_zone_id is set
# (which implies var.domain_name is also set).
# ============================================

# ---- S3 — the SPA bucket ----
resource "aws_s3_bucket" "web" {
    bucket = local.web_bucket

    tags = merge(var.tags, {
        Name = local.web_bucket
        Role = "spa-hosting"
    })
}

resource "aws_s3_bucket_versioning" "web" {
    bucket = aws_s3_bucket.web.id

    versioning_configuration {
        # Versioning is useful for rolling back a bad SPA deploy without
        # re-running the full build + sync pipeline.
        status = "Enabled"
    }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
    bucket = aws_s3_bucket.web.id

    rule {
        apply_server_side_encryption_by_default {
            sse_algorithm = "AES256"
        }
    }
}

# Public access is fully blocked. CloudFront reaches the bucket via OAC.
resource "aws_s3_bucket_public_access_block" "web" {
    bucket = aws_s3_bucket.web.id

    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
}

# Bucket policy: allow CloudFront OAC to GetObject.
# The OAC signs requests with SigV4 on behalf of the distribution; we match
# on the distribution ARN via the aws:SourceArn condition.
resource "aws_s3_bucket_policy" "web" {
    bucket = aws_s3_bucket.web.id
    policy = data.aws_iam_policy_document.web_bucket_policy.json

    # The bucket policy references the distribution ARN, so the distribution
    # must exist first.
    depends_on = [aws_cloudfront_distribution.spa]
}

data "aws_iam_policy_document" "web_bucket_policy" {
    statement {
        sid    = "AllowCloudFrontOAC"
        effect = "Allow"

        principals {
            type        = "Service"
            identifiers = ["cloudfront.amazonaws.com"]
        }

        actions   = ["s3:GetObject"]
        resources = ["${aws_s3_bucket.web.arn}/*"]

        condition {
            test     = "StringEquals"
            variable = "aws:SourceArn"
            values   = [aws_cloudfront_distribution.spa.arn]
        }
    }
}

# ---- CloudFront Origin Access Control ----
resource "aws_cloudfront_origin_access_control" "web" {
    name                              = "linernotes-odi-web-oac-${local.suffix}"
    description                       = "OAC for Liner Notes SPA bucket (${local.web_bucket})"
    origin_access_control_origin_type = "s3"
    signing_behavior                  = "always"
    signing_protocol                  = "sigv4"
}

# ---- ACM certificate (conditional, us-east-1 only) ----
# Created only when var.domain_name is non-empty.
resource "aws_acm_certificate" "spa" {
    count    = var.domain_name != "" ? 1 : 0
    provider = aws.us_east_1

    domain_name       = var.domain_name
    validation_method = "DNS"

    lifecycle {
        create_before_destroy = true
    }

    tags = merge(var.tags, {
        Name = var.domain_name
        Role = "spa-tls"
    })
}

# DNS validation records — written to the same hosted zone as the alias record.
# Only created when both domain_name and hosted_zone_id are set.
resource "aws_route53_record" "cert_validation" {
    for_each = (
        var.domain_name != "" && var.hosted_zone_id != ""
        ? {
            for dvo in aws_acm_certificate.spa[0].domain_validation_options :
            dvo.domain_name => {
                name   = dvo.resource_record_name
                type   = dvo.resource_record_type
                record = dvo.resource_record_value
            }
        }
        : {}
    )

    zone_id         = var.hosted_zone_id
    name            = each.value.name
    type            = each.value.type
    records         = [each.value.record]
    ttl             = 60
    allow_overwrite = true
}

resource "aws_acm_certificate_validation" "spa" {
    count    = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0
    provider = aws.us_east_1

    certificate_arn         = aws_acm_certificate.spa[0].arn
    validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ---- CloudFront distribution ----
locals {
    # Viewer cert block differs based on whether we have a custom domain.
    # We cannot use dynamic blocks inside viewer_certificate, so we compute
    # the relevant values here and reference them in the resource.
    cf_aliases = var.domain_name != "" ? [var.domain_name] : []
}

resource "aws_cloudfront_distribution" "spa" {
    enabled             = true
    is_ipv6_enabled     = true
    default_root_object = "index.html"
    aliases             = local.cf_aliases
    comment             = "Liner Notes ODI Demo SPA — ${local.suffix}"

    origin {
        domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
        origin_id                = "s3-linernotes-web"
        origin_access_control_id = aws_cloudfront_origin_access_control.web.id
    }

    default_cache_behavior {
        allowed_methods        = ["GET", "HEAD", "OPTIONS"]
        cached_methods         = ["GET", "HEAD"]
        target_origin_id       = "s3-linernotes-web"
        viewer_protocol_policy = "redirect-to-https"

        # Managed CachingOptimized policy — honours Cache-Control from S3,
        # no custom TTL configuration needed for a static SPA.
        cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    }

    # SPA fallback: 403 and 404 from S3 both route back to index.html so the
    # React/Vue router handles the path on the client side.
    custom_error_response {
        error_code            = 403
        response_code         = 200
        response_page_path    = "/index.html"
        error_caching_min_ttl = 0
    }

    custom_error_response {
        error_code            = 404
        response_code         = 200
        response_page_path    = "/index.html"
        error_caching_min_ttl = 0
    }

    restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    viewer_certificate {
        # When a custom domain is set, use the ACM cert. Otherwise fall back to
        # the default CloudFront certificate (*.cloudfront.net).
        cloudfront_default_certificate = var.domain_name == "" ? true : false
        acm_certificate_arn            = var.domain_name != "" ? aws_acm_certificate.spa[0].arn : null
        ssl_support_method             = var.domain_name != "" ? "sni-only" : null
        minimum_protocol_version       = var.domain_name != "" ? "TLSv1.2_2021" : null
    }

    tags = merge(var.tags, {
        Name = "linernotes-odi-cf-${local.suffix}"
        Role = "spa-cdn"
    })
}

# ---- Route53 alias record (conditional) ----
# Created only when both var.domain_name and var.hosted_zone_id are set.
resource "aws_route53_record" "spa_alias" {
    count = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0

    zone_id = var.hosted_zone_id
    name    = var.domain_name
    type    = "A"

    alias {
        name                   = aws_cloudfront_distribution.spa.domain_name
        zone_id                = aws_cloudfront_distribution.spa.hosted_zone_id
        evaluate_target_health = false
    }
}
