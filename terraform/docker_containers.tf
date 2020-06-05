##############################
# Docker containers
##############################
## Admin panel container
resource "docker_container" "bms_frontend_admin" {
  name  = "bms_frontend_admin"
  image = docker_image.bms_frontend_admin.latest
  restart = "always"
  env = [
    "TZ=${local.tz}",
    "TITLE=${local.title}",
    "TITLE_SHORT=${local.title_short}",
    "JWT_SECRET=${local.jwt_secret}",
    "STATIC_FILES_URL=${local.static_files_url}",
    "CLIENT_API_URL=${local.frontend_cfg.client_api_url}",
    "FIREBASE_PUBLIC_API_KEY=${local.firebase_public_api_key}",
    # Default env
    "NODE_VERSION=11.10.0",
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    "YARN_VERSION=1.13.0",
  ]

  user              = "node"
  working_dir       = "/usr/src/app"
  
  dynamic "labels" {
    for_each = [
      "org.label-schema.build-date=-",
      "org.label-schema.schema-version=-",
      "org.label-schema.vcs-ref=-",
      "org.label-schema.vcs-url=-",
      # Traefik labels
      "traefik.enable=true",
      "traefik.http.routers.bms_admin.entryPoints=https",
      "traefik.http.routers.bms_admin.rule=Host(`${local.hosts.frontend_admin_host_name}`)",
      "traefik.http.routers.bms_admin.tls.certResolver=cloudflare",
      "traefik.http.routers.bms_admin.service=bms_admin",
      "traefik.http.services.bms_admin.loadbalancer.server.port=${local.frontend_cfg.admin_port}",
    ]
    content {
      label = element(split("=", labels.value), 0)
      value = element(split("=", labels.value), 1)
    }
  }

  networks_advanced {
    name = docker_network.bms_network.name
  }

}

## Booking container
resource "docker_container" "bms_frontend_booking" {
  name  = "bms_frontend_booking"
  image = docker_image.bms_frontend_booking.latest
  restart = "always"
  env = [
    "TZ=${local.tz}",
    "TITLE=${local.title}",
    "TITLE_SHORT=${local.title_short}",
    "JWT_SECRET=${local.jwt_secret}",
    "STATIC_FILES_URL=${local.static_files_url}",
    "FRONTEND_BOOKING_PORT=${local.frontend_cfg.booking_port}",
    "CLIENT_API_URL=${local.frontend_cfg.client_api_url}",
    "FIREBASE_PUBLIC_API_KEY=${local.firebase_public_api_key}",
    # Default env
    "NODE_VERSION=11.10.0",
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    "YARN_VERSION=1.13.0",
  ]
  
  user              = "node"
  working_dir       = "/usr/src/app"

  dynamic "labels" {
    for_each = [
      "org.label-schema.build-date=-",
      "org.label-schema.schema-version=-",
      "org.label-schema.vcs-ref=-",
      "org.label-schema.vcs-url=-",
      # Traefik labels
      "traefik.enable=true",
      "traefik.http.routers.bms_booking.entryPoints=https",
      "traefik.http.routers.bms_booking.rule=Host(`${local.hosts.frontend_booking_host_name}`)",
      "traefik.http.routers.bms_booking.tls.certResolver=cloudflare",
      "traefik.http.routers.bms_booking.service=bms_booking",
      "traefik.http.services.bms_booking.loadbalancer.server.port=${local.frontend_cfg.booking_port}",
    ]
    content {
      label = element(split("=", labels.value), 0)
      value = element(split("=", labels.value), 1)
    }
  }

  networks_advanced {
    name = docker_network.bms_network.name
  }


}

## Backend container
resource "docker_container" "bms_backend" {
  name  = "bms_backend"
  image = docker_image.bms_backend.latest
  
  networks_advanced {
    name = docker_network.bms_network.name
  }

  env = [
    "TZ=${local.tz}",
    "NODE_ENV=production",
    "JWT_SECRET=${local.jwt_secret}",
    "FRONTEND_ADMIN_URL=${local.frontend_cfg.admin_url}",
    "FRONTEND_BOOKING_URL=${local.frontend_cfg.booking_url}",
    "STATIC_FILES_URL=${local.static_files_url}",
    "CORS_ORIGIN=${local.backend_cfg.cors_origin}",
    "BACKEND_PORT=${local.backend_cfg.port}",
    "BACKEND_HOST=${local.backend_cfg.host}",
    "CLIENT_API_URL=${local.frontend_cfg.client_api_url}",
    "YOUTUBE_API_KEY=${local.youtube_api_key}",
    "SLACK_API_KEY=${local.slack_api_key}",
    "FIREBASE_API_KEY=${local.firebase_api_key}",
    "FIREBASE_PUBLIC_API_KEY=${local.firebase_public_api_key}",
    # Datastore configuration
    "MONGODB_HOST=${local.data_store_cfg.mongodb_host}",
    "MONGODB_PORT=${local.data_store_cfg.mongodb_port}",
    "MONGODB_NAME=${local.data_store_cfg.mongodb_name}",
    "MONGODB_USERNAME=${local.data_store_cfg.mongodb_username}",
    "MONGODB_PASSWORD=${local.data_store_cfg.mongodb_password}",
    "MONGODB_SSL=${local.data_store_cfg.mongodb_ssl}",
    "MONGODB_SRV=${local.data_store_cfg.mongodb_srv}",
    "MONGODB_AUTHENTICATION_DATABASE=${local.data_store_cfg.mongodb_authentication_database}",
    "REDIS_HOST=${local.data_store_cfg.redis_host}",
    "REDIS_PORT=${local.data_store_cfg.redis_port}",
    "REDIS_DATABASE=${local.data_store_cfg.redis_database}", 
    # Default env
    "NODE_VERSION=12.13.0",
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    "YARN_VERSION=1.19.1",
  ]

  working_dir       = "/src/app"

  volumes {
    volume_name     = docker_volume.backend_volume.name
    container_path  = "/src/app/public/uploads"
    read_only       = false
  }
  restart = "always"
  # Depends on data stores
  depends_on = [
    docker_container.mongo,
    docker_container.redis,
  ]

  dynamic "labels" {
    for_each = [
      "org.label-schema.build-date=-",
      "org.label-schema.schema-version=-",
      "org.label-schema.vcs-ref=-",
      "org.label-schema.vcs-url=-",
      # Traefik labels
      "traefik.enable=true",
      "traefik.http.routers.bms_backend.entryPoints=https",
      "traefik.http.routers.bms_backend.rule=Host(`${local.hosts.backend_host_name}`)",
      "traefik.http.routers.bms_backend.tls.certResolver=cloudflare",
      "traefik.http.routers.bms_backend.service=bms_backend",
      "traefik.http.services.bms_backend.loadbalancer.server.port=${local.backend_cfg.port}",
    ]
    content {
      label = element(split("=", labels.value), 0)
      value = element(split("=", labels.value), 1)
    }
  }  
  
}

## Mongodb container
resource "docker_container" "mongo" {
  name = "bms_mongo"
  image = docker_image.mongo.latest
  restart = "always"
  networks_advanced {
    name = docker_network.bms_network.name
  }

  env = [
    "MONGO_INITDB_DATABASE=${local.data_store_cfg.mongodb_name}",
    # Default env
    "GOSU_VERSION=1.11",
    "GPG_KEYS=E162F504A20CDF15827F718D4B7C549A058F8B6B",
    "JSYAML_VERSION=3.13.0",
    "MONGO_MAJOR=4.2",
    "MONGO_PACKAGE=mongodb-org",
    "MONGO_REPO=repo.mongodb.org",
    "MONGO_VERSION=4.2.3",
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
  ]
  
  volumes {
    volume_name     = docker_volume.mongo_volume.name
    container_path  = "/data/db"
    read_only       = false
  }

}

## Redis container
resource "docker_container" "redis" {
  name        = "bms_redis"
  image       = docker_image.redis.latest
  working_dir = "/data"
  restart     = "always"

  command     = ["redis-server", "--appendonly", "yes"]
  
  volumes {
    volume_name     = docker_volume.redis_volume.name
    container_path  = "/data"
    read_only       = false
  }
  networks_advanced {
    name = docker_network.bms_network.name
  }
  
}

## Traefik container
resource "docker_container" "traefik" {
  name    = "bms_traefik"
  image   = docker_image.traefik.latest

  volumes {
    volume_name     = docker_volume.traefik_volume.name
    container_path  = "/letsencrypt/"
    read_only       = false
  }

  volumes {
    host_path       = "/var/run/docker.sock"
    container_path  = "/var/run/docker.sock"
    read_only       = true
  }

  command = concat(["traefik"], distinct(concat(local.proxy_cfg.command, local.proxy_cfg.default_command)))

  env = distinct(concat(local.proxy_cfg.env, local.proxy_cfg.default_env))

  dynamic "ports" {
    for_each = local.proxy_cfg.ports
    content {
      internal = element(split(":", ports.value), 0)
      external = element(split(":", ports.value), 1)
    }
  }

  dynamic "labels" {
    for_each = distinct(concat(local.proxy_cfg.labels, local.proxy_cfg.default_labels))
    content {
      label = element(split("=", labels.value), 0)
      value = element(split("=", labels.value), 1)
    }
  }

  networks_advanced {
    name = docker_network.bms_network.name
  }

}