##############################
# Docker resources
##############################

## Registry images
data "docker_registry_image" "bms_frontend_admin" {
  name = "${local.registry.address}/${local.image_path}/admin"
}

data "docker_registry_image" "bms_frontend_booking" {
  name = "${local.registry.address}/${local.image_path}/booking"
}

data "docker_registry_image" "bms_backend" {
  name = "${local.registry.address}/${local.image_path}/backend"
}

## Docker image resources
resource "docker_image" "bms_frontend_admin" {
  name          = data.docker_registry_image.bms_frontend_admin.name
  pull_triggers = [data.docker_registry_image.bms_frontend_admin.sha256_digest]
}

resource "docker_image" "bms_frontend_booking" {
  name          = data.docker_registry_image.bms_frontend_booking.name
  pull_triggers = [data.docker_registry_image.bms_frontend_booking.sha256_digest]
}

resource "docker_image" "bms_backend" {
  name          = data.docker_registry_image.bms_backend.name
  pull_triggers = [data.docker_registry_image.bms_backend.sha256_digest]
}

resource "docker_image" "mongo" {
  name = "mongo:latest"
}

resource "docker_image" "redis" {
  name = "redis:latest"
}

resource "docker_image" "traefik" {
  name = "traefik:latest"
}

## Docker network
resource "docker_network" "bms_network" {
  name = "bms_network"
}

## Docker volumes
resource "docker_volume" "mongo_volume" {
  name = "mongo_volume"
}

resource "docker_volume" "redis_volume" {
  name = "redis_volume"
}

resource "docker_volume" "backend_volume" {
  name = "backend_volume"
}

resource "docker_volume" "traefik_volume" {
  name = "traefik_volume"
}
