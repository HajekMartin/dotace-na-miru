output "vercel_project_id" {
  description = "ID of the Vercel project managed by Terraform."
  value       = vercel_project.marketing_microsite.id
}

output "vercel_project_name" {
  description = "Name of the Vercel project managed by Terraform."
  value       = vercel_project.marketing_microsite.name
}
