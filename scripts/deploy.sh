#!/usr/bin/env bash
# Liner Notes ODI Demo — one-shot deploy to AWS S3 + CloudFront
#
# Prereqs:
#   1. AWS SSO logged in:  aws sso login --profile pokemon-app
#   2. Terraform stack applied:  (cd infra && terraform apply)
#   3. Node + npm installed
#
# Usage:
#   ./scripts/deploy.sh                # builds app, syncs to S3, invalidates CloudFront

set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-pokemon-app}"
APP_DIR="${APP_DIR:-liner-notes-app}"
INFRA_DIR="${INFRA_DIR:-infra}"

echo "==> Reading Terraform outputs from ${INFRA_DIR}/"
WEB_BUCKET=$(cd "${INFRA_DIR}" && terraform output -raw web_bucket)
DISTRIBUTION_ID=$(cd "${INFRA_DIR}" && terraform output -raw cloudfront_distribution_id)
SITE_URL=$(cd "${INFRA_DIR}" && terraform output -raw site_url)

echo "    web_bucket:        ${WEB_BUCKET}"
echo "    distribution_id:   ${DISTRIBUTION_ID}"
echo "    site_url:          ${SITE_URL}"

echo "==> Building app (${APP_DIR})"
(cd "${APP_DIR}" && npm ci --silent && npm run build)

echo "==> Syncing out/ to s3://${WEB_BUCKET}/"
aws --profile "${AWS_PROFILE}" s3 sync "${APP_DIR}/out/" "s3://${WEB_BUCKET}/" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.txt" \
    --exclude "*.xml" \
    --exclude "*.json"

# HTML, txt, json get a short cache so updates land fast
aws --profile "${AWS_PROFILE}" s3 sync "${APP_DIR}/out/" "s3://${WEB_BUCKET}/" \
    --cache-control "public, max-age=60, must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --include "*.txt" \
    --include "*.xml" \
    --include "*.json"

echo "==> Invalidating CloudFront ${DISTRIBUTION_ID}"
INVALIDATION_ID=$(aws --profile "${AWS_PROFILE}" cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "    invalidation:      ${INVALIDATION_ID}"

echo ""
echo "Live at: ${SITE_URL}"
