output "lake_bucket" {
    description = "Name of the S3 lake bucket. Export as LAKE_BUCKET for dbt."
    value       = aws_s3_bucket.lake.bucket
}

output "lake_bucket_arn" {
    description = "ARN of the S3 lake bucket."
    value       = aws_s3_bucket.lake.arn
}

output "web_bucket" {
    description = "Name of the S3 SPA hosting bucket. Sync your build output here."
    value       = aws_s3_bucket.web.bucket
}

output "web_bucket_arn" {
    description = "ARN of the S3 SPA hosting bucket."
    value       = aws_s3_bucket.web.arn
}

output "glue_database" {
    description = "Glue catalog database name. Export as GLUE_DATABASE for dbt."
    value       = aws_glue_catalog_database.linernotes_lake.name
}

output "athena_workgroup" {
    description = "Athena workgroup name. Export as ATHENA_WORKGROUP for dbt."
    value       = aws_athena_workgroup.linernotes_odi.name
}

output "cloudfront_distribution_id" {
    description = "CloudFront distribution ID. Use this when running 'aws cloudfront create-invalidation'."
    value       = aws_cloudfront_distribution.spa.id
}

output "cloudfront_domain_name" {
    description = "Auto-assigned CloudFront domain (*.cloudfront.net). Always set, regardless of whether a custom domain is configured."
    value       = aws_cloudfront_distribution.spa.domain_name
}

output "site_url" {
    description = "Public URL for the SPA. Returns the custom domain (https://<var.domain_name>) when one is configured, otherwise the CloudFront domain."
    value = (
        var.domain_name != ""
        ? "https://${var.domain_name}"
        : "https://${aws_cloudfront_distribution.spa.domain_name}"
    )
}

output "fivetran_role_arn" {
    description = "Paste this into Fivetran's destination setup (AWS IAM Role ARN field)."
    value       = aws_iam_role.fivetran.arn
}

output "dbt_role_arn" {
    description = "Role ARN for the dbt runner to assume. Configure in ~/.aws/config or profiles.yml."
    value       = aws_iam_role.dbt.arn
}

output "athena_reader_role_arn" {
    description = "Role ARN for the SPA's read-only Athena access. Scope the trust policy before going to production."
    value       = aws_iam_role.athena_reader.arn
}

output "aws_region" {
    description = "Region everything lives in. Export as AWS_REGION for dbt."
    value       = var.aws_region
}
