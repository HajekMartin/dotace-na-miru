resource "vercel_deployment" "production" {
  project_id = vercel_project.marketing_microsite.id
  ref        = var.production_git_ref
  production = true

  depends_on = [
    vercel_project_environment_variable.buffer_access_token,
    vercel_project_environment_variable.buffer_organization_id,
    vercel_project_environment_variable.buffer_channel_id,
    vercel_project_environment_variable.make_post_webhook_url,
    vercel_project_environment_variable.make_metrics_webhook_url,
  ]
}
