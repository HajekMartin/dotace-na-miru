variable "vercel_api_token" {
  description = "Vercel API token used by Terraform."
  type        = string
  sensitive   = true
}

variable "vercel_project_name" {
  description = "Name of the Vercel project."
  type        = string
  default     = "dotace-na-miru"
}

variable "git_provider" {
  description = "Git provider connected to Vercel."
  type        = string
  default     = "github"
}

variable "git_repository" {
  description = "Repository in owner/repo format."
  type        = string
}

variable "buffer_access_token" {
  description = "Buffer API access token."
  type        = string
  sensitive   = true
}

variable "buffer_organization_id" {
  description = "Buffer organization ID."
  type        = string
  sensitive   = true
}

variable "buffer_channel_id" {
  description = "Buffer channel ID."
  type        = string
  sensitive   = true
}

variable "make_post_webhook_url" {
  description = "Make.com webhook URL for creating Buffer posts."
  type        = string
  sensitive   = true
}

variable "make_metrics_webhook_url" {
  description = "Make.com webhook URL for fetching Buffer metrics."
  type        = string
  sensitive   = true
}
