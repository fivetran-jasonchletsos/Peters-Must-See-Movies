# LinerNotes-ODI-Demo — AWS infra

Terraform for the Liner Notes Open Data Initiative demo. Provisions an Iceberg-on-S3 lake with Glue Catalog and Athena, plus an S3 + CloudFront stack for the static SPA.

## What this creates

| Resource | Name |
|---|---|
| S3 bucket (lake) | `linernotes-odi-lake-<suffix>` |
| S3 bucket (SPA) | `linernotes-odi-web-<suffix>` |
| Glue database | `linernotes_lake` |
| Athena workgroup | `linernotes-odi` (engine v3, SSE_S3) |
| CloudFront distribution | auto-assigned `*.cloudfront.net` domain |
| CloudFront OAC | `linernotes-odi-web-oac-<suffix>` |
| ACM certificate | created only if `var.domain_name` is set (us-east-1) |
| Route53 alias record | created only if `var.hosted_zone_id` is set |
| IAM role (Fivetran) | `linernotes-odi-fivetran` |
| IAM role (dbt) | `linernotes-odi-dbt` |
| IAM role (Athena reader) | `linernotes-odi-athena-reader` |

The lake bucket has versioning, AES256 encryption, public access fully blocked, and a 60-day STANDARD_IA lifecycle transition. The web bucket has the same encryption and access settings; it is reached exclusively through CloudFront via Origin Access Control.

Lake Formation is intentionally not provisioned. See the comment at the bottom of `main.tf` for where to hook it in.

## Init, plan, apply

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — fill in fivetran_external_id and dbt_iam_user_arn at minimum.

terraform init
terraform plan
terraform apply
```

State is local. That is fine for a demo — do not promote this to anything customer-facing without remote state and locking.

## Variables you must set

- `fivetran_external_id` — paste from the Fivetran destination setup screen
- `dbt_iam_user_arn` — ARN of the IAM user you created manually for the dbt runner

Optional:

- `aws_region` (default `us-east-1`)
- `suffix` (default = random 8-char hex)
- `fivetran_aws_account_id` (default `834469178297` — Fivetran's account)
- `domain_name` — custom domain for the SPA (e.g. `linernotes.example.com`); triggers ACM cert creation
- `hosted_zone_id` — Route53 hosted zone for DNS validation and alias record; required when `domain_name` is set
- `allowed_origins` — CORS origins for the lake bucket (default `["*"]`)

## Wiring outputs into Fivetran

```bash
terraform output fivetran_role_arn
```

Paste that into Fivetran, Destinations, Add destination, AWS S3 / Iceberg, IAM Role ARN. Use `linernotes_lake` as the target Glue database. The bucket name comes from `terraform output lake_bucket`.

## Wiring outputs into dbt

dbt-athena reads these from the environment:

```bash
export AWS_REGION=$(terraform output -raw aws_region)
export LAKE_BUCKET=$(terraform output -raw lake_bucket)
export ATHENA_WORKGROUP=$(terraform output -raw athena_workgroup)
export DBT_ROLE_ARN=$(terraform output -raw dbt_role_arn)
```

Then have the dbt runner's IAM user assume `DBT_ROLE_ARN` via `~/.aws/config` (a named profile with `role_arn = ...` and `source_profile = ...`).

## Deploying the SPA

After `terraform apply`, the SPA build pipeline is:

1. Build the SPA locally (or in CI):

   ```bash
   npm run build   # or yarn build / vite build — adjust to your framework
   ```

2. Sync the build output to the web bucket:

   ```bash
   WEB_BUCKET=$(terraform output -raw web_bucket)
   aws s3 sync ./dist "s3://${WEB_BUCKET}/" --delete
   ```

3. Invalidate the CloudFront cache so the new assets are served immediately:

   ```bash
   CF_ID=$(terraform output -raw cloudfront_distribution_id)
   aws cloudfront create-invalidation --distribution-id "${CF_ID}" --paths "/*"
   ```

4. Check the live URL:

   ```bash
   terraform output site_url
   ```

   If `var.domain_name` is set, this returns `https://<domain>`. Otherwise it returns the CloudFront domain.

## Expected cost

Demo-scale (low query volume, small lake, low SPA traffic):

| Service | Estimated cost |
|---|---|
| S3 storage + requests | ~$2-5/mo |
| Athena scans | ~$1-5/mo |
| CloudFront | free tier (1 TB / 10M requests/mo) then pay-as-you-go |
| Glue catalog | free under 1M objects/month |
| ACM certificate | free |
| Route53 (if used) | ~$0.50/mo per hosted zone |

Total roughly $5-15/mo. Athena scan volume is the biggest variable — partition and Z-order your dbt models to keep it low.

## Out of scope

- VPC/networking (Glue and Athena are regional endpoints; no VPC needed)
- Lake Formation fine-grained access (noted in `main.tf` for future)
- Remote state backend (local state is fine for the demo)
- Cognito for the SPA reader role (noted in `iam.tf` as a TODO for production)
