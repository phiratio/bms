variable "title" {
  type = string
}

variable "title_short" {
  type = string
}

variable "jwt_secret" {
  type = string
}

variable "tz" {
  type = string
  default = "America/New_York"
}

variable "frontend_booking_url" {
  type = string
}

variable "frontend_admin_url" {
  type = string
}

variable "client_api_url" {
  type = string
}

variable "static_files_url" {
  type = string
}

variable "cloudflare_email" {
  type = string
}

variable "cloudflare_api_key" {
  type = string
}

variable "youtube_api_key" {
  type = string
}

variable "slack_api_key" {
  type = string
}

variable "firebase_api_key" {
  type = string
}

variable "firebase_public_api_key" {
  type = string
}

variable "mongodb_name" {
  type = string
}

variable "redis_database" {
  type = number
}

variable "docker_ssh_host" {
  type = string
}

variable "docker_ssh_username" {
  type = string
}

variable "docker_ssh_port" {
  type = number
}

variable "registry_name" {
  type = string
}

variable "registry_username" {
  type = string
}

variable "registry_password" {
  type = string
}
