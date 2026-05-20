# ============================================
# Liner Notes ODI Demo — AWS infrastructure
# Iceberg-on-S3 lake + Glue + Athena, plus S3+CloudFront SPA
# ============================================

provider "aws" {
    region = var.aws_region

    default_tags {
        tags = var.tags
    }
}

# ACM certificates for CloudFront must always be in us-east-1, regardless of
# where the rest of the stack lives. A second aliased provider covers that.
provider "aws" {
    alias  = "us_east_1"
    region = "us-east-1"

    default_tags {
        tags = var.tags
    }
}

# ---- suffix for globally-unique names ----
resource "random_id" "suffix" {
    byte_length = 4
}

locals {
    suffix      = var.suffix != "" ? var.suffix : random_id.suffix.hex
    lake_bucket = "linernotes-odi-lake-${local.suffix}"
    web_bucket  = "linernotes-odi-web-${local.suffix}"
}

# ============================================
# S3 — the lake
# ============================================
resource "aws_s3_bucket" "lake" {
    bucket = local.lake_bucket

    tags = merge(var.tags, {
        Name = local.lake_bucket
        Role = "data-lake"
    })
}

resource "aws_s3_bucket_versioning" "lake" {
    bucket = aws_s3_bucket.lake.id

    versioning_configuration {
        status = "Enabled"
    }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lake" {
    bucket = aws_s3_bucket.lake.id

    rule {
        apply_server_side_encryption_by_default {
            sse_algorithm = "AES256"
        }
    }
}

resource "aws_s3_bucket_public_access_block" "lake" {
    bucket = aws_s3_bucket.lake.id

    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "lake" {
    bucket = aws_s3_bucket.lake.id

    rule {
        id     = "transition-to-ia"
        status = "Enabled"

        filter {}

        transition {
            days          = 60
            storage_class = "STANDARD_IA"
        }
    }
}

resource "aws_s3_bucket_cors_configuration" "lake" {
    bucket = aws_s3_bucket.lake.id

    cors_rule {
        allowed_methods = ["GET"]
        allowed_origins = var.allowed_origins
        allowed_headers = ["*"]
        expose_headers  = ["ETag"]
        max_age_seconds = 3000
    }
}

# Note: raw/, bronze/, silver/, gold/, athena-results/, dbt/ are S3 prefixes —
# no resource needed. They materialize the first time Fivetran/dbt/Athena writes
# under them.

# ============================================
# Glue Data Catalog — lake database
# ============================================
resource "aws_glue_catalog_database" "linernotes_lake" {
    name        = "linernotes_lake"
    description = "Top-level Glue database for the Liner Notes ODI demo. Iceberg tables written by Fivetran land here; dbt reads and writes within this catalog."

    tags = var.tags
}

# ============================================
# Athena workgroup
# ============================================
resource "aws_athena_workgroup" "linernotes_odi" {
    name = "linernotes-odi"

    configuration {
        enforce_workgroup_configuration    = true
        publish_cloudwatch_metrics_enabled = true

        engine_version {
            selected_engine_version = "Athena engine version 3"
        }

        result_configuration {
            output_location = "s3://${aws_s3_bucket.lake.bucket}/athena-results/"

            encryption_configuration {
                encryption_option = "SSE_S3"
            }
        }
    }

    tags = var.tags
}

# ============================================
# Lake Formation — intentionally skipped for the demo.
# If/when fine-grained (column/row-level) access control is needed:
#   - aws_lakeformation_resource on the lake bucket
#   - aws_lakeformation_permissions granting the fivetran/dbt roles
#     SELECT/ALTER on the linernotes_lake DB
# For the demo, IAM + Glue resource policies are enough.
# ============================================
