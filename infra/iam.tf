# ============================================
# IAM — Fivetran writer, dbt-athena runner, Athena reader
# ============================================
#
# Three roles:
#
# 1. linernotes-odi-fivetran  — trusted by Fivetran's AWS account.
#    Writes to the raw/ prefix and manages Iceberg table metadata in Glue.
#
# 2. linernotes-odi-dbt  — trusted by a manually-created IAM user
#    (var.dbt_iam_user_arn). Reads raw/, reads/writes transformed prefixes,
#    runs Athena queries, full CRUD on the Glue catalog.
#
# 3. linernotes-odi-athena-reader  — hardcoded trust for the SPA's direct
#    Athena access. Using a hardcoded trust (IAM user or role ARN) rather than
#    Cognito because this is a demo; Cognito would add meaningful complexity
#    (user pool, identity pool, role mapping) for no additional demo value.
#    # TODO: Replace with Cognito Identity Pool trust if this goes to
#    # customer-facing production. See:
#    # https://docs.aws.amazon.com/cognito/latest/developerguide/role-based-access-control.html
# ============================================

data "aws_caller_identity" "current" {}

# ============================================
# 1. Fivetran writer role
# ============================================
data "aws_iam_policy_document" "fivetran_trust" {
    statement {
        effect  = "Allow"
        actions = ["sts:AssumeRole"]

        principals {
            type        = "AWS"
            identifiers = ["arn:aws:iam::${var.fivetran_aws_account_id}:root"]
        }

        condition {
            test     = "StringEquals"
            variable = "sts:ExternalId"
            values   = [var.fivetran_external_id]
        }
    }
}

resource "aws_iam_role" "fivetran" {
    name               = "linernotes-odi-fivetran"
    description        = "Fivetran assume-role for landing data into the raw/bronze layer of the Liner Notes ODI demo lake."
    assume_role_policy = data.aws_iam_policy_document.fivetran_trust.json

    tags = var.tags
}

data "aws_iam_policy_document" "fivetran_lake_access" {
    statement {
        sid    = "BucketLevel"
        effect = "Allow"
        actions = [
            "s3:ListBucket",
            "s3:GetBucketLocation",
            "s3:GetBucketVersioning",
        ]
        resources = [aws_s3_bucket.lake.arn]
    }

    statement {
        sid    = "ObjectLevel"
        effect = "Allow"
        actions = [
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:AbortMultipartUpload",
        ]
        resources = [
            "${aws_s3_bucket.lake.arn}/raw/*",
            "${aws_s3_bucket.lake.arn}/athena-results/*",
        ]
    }

    # Register/update Iceberg tables in the Glue catalog.
    statement {
        sid    = "GlueCatalogWrite"
        effect = "Allow"
        actions = [
            "glue:GetDatabase",
            "glue:GetDatabases",
            "glue:CreateTable",
            "glue:UpdateTable",
            "glue:DeleteTable",
            "glue:GetTable",
            "glue:GetTables",
            "glue:GetPartition",
            "glue:GetPartitions",
            "glue:BatchCreatePartition",
            "glue:BatchDeletePartition",
            "glue:BatchUpdatePartition",
            "glue:CreatePartition",
            "glue:UpdatePartition",
            "glue:DeletePartition",
        ]
        resources = [
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
            aws_glue_catalog_database.linernotes_lake.arn,
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_glue_catalog_database.linernotes_lake.name}/*",
        ]
    }
}

resource "aws_iam_role_policy" "fivetran_lake_access" {
    name   = "linernotes-odi-fivetran-lake-access"
    role   = aws_iam_role.fivetran.id
    policy = data.aws_iam_policy_document.fivetran_lake_access.json
}

# ============================================
# 2. dbt-athena runner role
# ============================================
data "aws_iam_policy_document" "dbt_trust" {
    statement {
        effect  = "Allow"
        actions = ["sts:AssumeRole"]

        principals {
            type        = "AWS"
            identifiers = [var.dbt_iam_user_arn]
        }
    }
}

resource "aws_iam_role" "dbt" {
    name               = "linernotes-odi-dbt"
    description        = "dbt runner role — reads raw layer, reads/writes transformed prefixes, runs Athena queries, full Glue CRUD."
    assume_role_policy = data.aws_iam_policy_document.dbt_trust.json

    tags = var.tags
}

data "aws_iam_policy_document" "dbt_lake_access" {
    statement {
        sid    = "BucketLevel"
        effect = "Allow"
        actions = [
            "s3:ListBucket",
            "s3:GetBucketLocation",
        ]
        resources = [aws_s3_bucket.lake.arn]
    }

    # Read-only on raw input.
    statement {
        sid    = "RawRead"
        effect = "Allow"
        actions = [
            "s3:GetObject",
            "s3:GetObjectVersion",
        ]
        resources = ["${aws_s3_bucket.lake.arn}/raw/*"]
    }

    # Read/write on transformed prefixes, dbt artifacts, and Athena results.
    statement {
        sid    = "TransformedWrite"
        effect = "Allow"
        actions = [
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:AbortMultipartUpload",
        ]
        resources = [
            "${aws_s3_bucket.lake.arn}/silver/*",
            "${aws_s3_bucket.lake.arn}/gold/*",
            "${aws_s3_bucket.lake.arn}/dbt/*",
            "${aws_s3_bucket.lake.arn}/athena-results/*",
        ]
    }

    # Athena workgroup execution.
    statement {
        sid    = "AthenaWorkgroup"
        effect = "Allow"
        actions = [
            "athena:StartQueryExecution",
            "athena:StopQueryExecution",
            "athena:GetQueryExecution",
            "athena:GetQueryResults",
            "athena:GetQueryResultsStream",
            "athena:GetWorkGroup",
            "athena:ListQueryExecutions",
            "athena:BatchGetQueryExecution",
        ]
        resources = [aws_athena_workgroup.linernotes_odi.arn]
    }

    # Glue catalog — read everywhere, full CRUD on the lake database.
    statement {
        sid    = "GlueRead"
        effect = "Allow"
        actions = [
            "glue:GetDatabase",
            "glue:GetDatabases",
            "glue:GetTable",
            "glue:GetTables",
            "glue:GetPartition",
            "glue:GetPartitions",
        ]
        resources = [
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
            aws_glue_catalog_database.linernotes_lake.arn,
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_glue_catalog_database.linernotes_lake.name}/*",
        ]
    }

    statement {
        sid    = "GlueWrite"
        effect = "Allow"
        actions = [
            "glue:CreateTable",
            "glue:UpdateTable",
            "glue:DeleteTable",
            "glue:BatchCreatePartition",
            "glue:BatchDeletePartition",
            "glue:BatchUpdatePartition",
            "glue:CreatePartition",
            "glue:UpdatePartition",
            "glue:DeletePartition",
        ]
        resources = [
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
            aws_glue_catalog_database.linernotes_lake.arn,
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_glue_catalog_database.linernotes_lake.name}/*",
        ]
    }
}

resource "aws_iam_role_policy" "dbt_lake_access" {
    name   = "linernotes-odi-dbt-lake-access"
    role   = aws_iam_role.dbt.id
    policy = data.aws_iam_policy_document.dbt_lake_access.json
}

# ============================================
# 3. Athena reader role (SPA read-only access)
#
# Hardcoded trust (IAM principal rather than Cognito) because this is a demo.
# The SPA or a lightweight API gateway authenticates as a dedicated IAM user
# and assumes this role for read-only Athena queries.
#
# # TODO: Replace with Cognito Identity Pool trust for customer-facing
# # production. Example trust principal:
# #   "arn:aws:iam::ACCOUNT:federated/cognito-identity.amazonaws.com"
# # with sts:AssumeRoleWithWebIdentity action.
# ============================================
data "aws_iam_policy_document" "athena_reader_trust" {
    statement {
        effect  = "Allow"
        actions = ["sts:AssumeRole"]

        # Allow any principal in this account to assume this role.
        # In practice, scope this down to the IAM user or role the SPA backend
        # authenticates as. # TODO: narrow to a specific ARN before production.
        principals {
            type        = "AWS"
            identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
    }
}

resource "aws_iam_role" "athena_reader" {
    name               = "linernotes-odi-athena-reader"
    description        = "Read-only Athena role for the Liner Notes SPA. Assumed by the SPA backend or a dedicated IAM user; hardcoded trust for demo simplicity."
    assume_role_policy = data.aws_iam_policy_document.athena_reader_trust.json

    tags = var.tags
}

data "aws_iam_policy_document" "athena_reader_access" {
    statement {
        sid    = "BucketLevel"
        effect = "Allow"
        actions = [
            "s3:ListBucket",
            "s3:GetBucketLocation",
        ]
        resources = [aws_s3_bucket.lake.arn]
    }

    # Read access on the transformed layers that the SPA queries.
    statement {
        sid    = "LakeRead"
        effect = "Allow"
        actions = [
            "s3:GetObject",
            "s3:GetObjectVersion",
        ]
        resources = [
            "${aws_s3_bucket.lake.arn}/silver/*",
            "${aws_s3_bucket.lake.arn}/gold/*",
            "${aws_s3_bucket.lake.arn}/athena-results/*",
        ]
    }

    # PutObject on athena-results only — Athena must be able to write its
    # result set even for a "reader" workload.
    statement {
        sid    = "AthenaResultsWrite"
        effect = "Allow"
        actions = [
            "s3:PutObject",
            "s3:AbortMultipartUpload",
        ]
        resources = ["${aws_s3_bucket.lake.arn}/athena-results/*"]
    }

    # Athena — read-only query execution against the workgroup.
    statement {
        sid    = "AthenaQuery"
        effect = "Allow"
        actions = [
            "athena:StartQueryExecution",
            "athena:StopQueryExecution",
            "athena:GetQueryExecution",
            "athena:GetQueryResults",
            "athena:GetQueryResultsStream",
            "athena:GetWorkGroup",
            "athena:ListQueryExecutions",
            "athena:BatchGetQueryExecution",
        ]
        resources = [aws_athena_workgroup.linernotes_odi.arn]
    }

    # Glue catalog — read-only.
    statement {
        sid    = "GlueRead"
        effect = "Allow"
        actions = [
            "glue:GetDatabase",
            "glue:GetDatabases",
            "glue:GetTable",
            "glue:GetTables",
            "glue:GetPartition",
            "glue:GetPartitions",
        ]
        resources = [
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
            aws_glue_catalog_database.linernotes_lake.arn,
            "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_glue_catalog_database.linernotes_lake.name}/*",
        ]
    }
}

resource "aws_iam_role_policy" "athena_reader_access" {
    name   = "linernotes-odi-athena-reader-access"
    role   = aws_iam_role.athena_reader.id
    policy = data.aws_iam_policy_document.athena_reader_access.json
}
