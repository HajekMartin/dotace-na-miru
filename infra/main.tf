terraform {
  required_version = ">= 1.6.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

locals {
  vercel_targets = ["production", "preview"]
}

resource "vercel_project" "marketing_microsite" {
  name      = var.vercel_project_name
  framework = "nextjs"

  git_repository = {
    type = var.git_provider
    repo = var.git_repository
  }
}

resource "vercel_project_environment_variable" "buffer_access_token" {
  project_id = vercel_project.marketing_microsite.id
  key        = "BUFFER_ACCESS_TOKEN"
  value      = var.buffer_access_token
  target     = local.vercel_targets
  sensitive  = true
}

resource "vercel_project_environment_variable" "buffer_organization_id" {
  project_id = vercel_project.marketing_microsite.id
  key        = "BUFFER_ORGANIZATION_ID"
  value      = var.buffer_organization_id
  target     = local.vercel_targets
  sensitive  = true
}

resource "vercel_project_environment_variable" "buffer_channel_id" {
  project_id = vercel_project.marketing_microsite.id
  key        = "BUFFER_CHANNEL_ID"
  value      = var.buffer_channel_id
  target     = local.vercel_targets
  sensitive  = true
}

resource "vercel_project_environment_variable" "make_post_webhook_url" {
  project_id = vercel_project.marketing_microsite.id
  key        = "MAKE_POST_WEBHOOK_URL"
  value      = var.make_post_webhook_url
  target     = local.vercel_targets
  sensitive  = true
}

resource "vercel_project_environment_variable" "make_metrics_webhook_url" {
  project_id = vercel_project.marketing_microsite.id
  key        = "MAKE_METRICS_WEBHOOK_URL"
  value      = var.make_metrics_webhook_url
  target     = local.vercel_targets
  sensitive  = true
}
