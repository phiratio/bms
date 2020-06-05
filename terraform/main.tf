locals {  
  hosts = {
    frontend_booking_host_name  = split("//", var.frontend_booking_url)[1],
    frontend_admin_host_name    = split("//", var.frontend_admin_url)[1],
    backend_host_name           = split("//", var.client_api_url)[1],
  }

  title             = var.title
  title_short       = var.title_short
  jwt_secret        = var.jwt_secret
  static_files_url  = var.static_files_url
  tz                = var.tz
  # Docker host ssh credentials
  ssh = {
    username  = var.docker_ssh_username
    host      = var.docker_ssh_host
    port      = var.docker_ssh_port
  }

  # Docker host registry credentials
  registry = {
    address   = var.registry_name
    username  = var.registry_username
    password  = var.registry_password
  }

  # DNS Provider configuration (Used for ACME DNS challenges)
  cloudflare = {
    email     = var.cloudflare_email
    api_key   = var.cloudflare_api_key
  }

  # Data store variables
  data_store_cfg = {
    
    mongodb_host      = "bms_mongo"
    mongodb_port      = 27017
    mongodb_name      = var.mongodb_name
    mongodb_username  = ""
    mongodb_password  = ""
    mongodb_ssl       = "false"
    mongodb_srv       = "false"
    mongodb_authentication_database = ""

    redis_host      = "bms_redis"
    redis_port      = 6379
    redis_database  = var.redis_database
  }

  # Frontend related configuration
  frontend_cfg = {
    admin_port      = 3000 #FRONTEND_PORT
    booking_port    = 3005 # FRONTEND_BOOKING_PORT
    client_api_url  = var.client_api_url # CLIENT_API_URL
    admin_url       = var.frontend_admin_url # FRONTEND_ADMIN_URL
    booking_url     = var.frontend_booking_url  # FRONTEND_BOOKING_URL
  }

  # Backend related configuraton
  backend_cfg = {
    cors_origin   = join(", ", [
      "http://localhost:${local.frontend_cfg.admin_port}",
      "http://localhost:${local.frontend_cfg.booking_port}",
      "http://localhost:3010",

      var.frontend_booking_url,
      var.frontend_admin_url,
      var.client_api_url,
    ]) # CORS_ORIGIN
    port          = 3010 # BACKEND_PORT
    host          = "localhost" # BACKEND_HOST
    production    = true # BACKEND_PRODUCTION
    proxy_enabled = true # BACKEND_PROXY_ENABLED
    proxy_host    = local.hosts.backend_host_name # BACKEND_PROXY_HOST
    proxy_port    = 443 # BACKEND_PROXY_PORT
    admin_panel_path = "/admin" # BACKEND_ADMIN_PANEL_PATH
  }

  # Traefik related configuration
  proxy_cfg = {

    default_labels = [
      "org.opencontainers.image.description=A modern reverse-proxy", # <- added by traefik
      "org.opencontainers.image.documentation=https://docs.traefik.io",
      "org.opencontainers.image.title=Traefik",  
      "org.opencontainers.image.url=https://traefik.io",
      "org.opencontainers.image.vendor=Containous",
      "org.opencontainers.image.version=v2.2.1",
      "traefik.enable=true",
      # Global http to https redirect
      "traefik.http.middlewares.https-redirect.redirectScheme.scheme=https",
      "traefik.http.routers.redirect.entryPoints=http",
      "traefik.http.routers.redirect.rule=hostregexp(`{host:.+}`)",
      "traefik.http.routers.redirect.middlewares=https-redirect",
      "traefik.http.routers.redirect.service=noop@internal",
      "traefik.http.routers.redirect.priority=1",
    ]

    default_command = [
      "--log.level=ERROR",
      "--global.sendAnonymousUsage=false",
      "--serversTransport.insecureSkipVerify=true",
      "--accessLog.bufferingSize=100",
      # Enable traefik dashboard
      # "--api.dashboard=true",

      # Enable prometheus metrics
      "--metrics=true",
      "--metrics.prometheus.buckets=0.1,0.3,1.2,5.0",
      "--metrics.prometheus.addEntryPointsLabels=true",
      "--metrics.prometheus.addServicesLabels=true",
      "--metrics.prometheus.manualRouting=true",
    ]
    
    default_env = [
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", # <- added by traefik
    ]

    ports = [
      "80:80",
      "443:443"
    ]

    # Labels that will be applied to traefik container
    labels = []

    env = [
      "CLOUDFLARE_EMAIL=${local.cloudflare.email}",
      "CLOUDFLARE_API_KEY=${local.cloudflare.api_key}",
    ]

    command = [
      "--entryPoints.http.address=:80",
      "--entryPoints.https.address=:443",

      "--providers.docker=true",
      "--providers.docker.exposedbydefault=false",

      "--certificatesResolvers.cloudflare.acme.email=${local.cloudflare.email}",
      "--certificatesResolvers.cloudflare.acme.storage=/letsencrypt/acme.json",
      "--certificatesResolvers.cloudflare.acme.dnsChallenge.provider=cloudflare",
      "--certificatesResolvers.cloudflare.acme.dnsChallenge.delayBeforeCheck=30",
      "--certificatesResolvers.cloudflare.acme.dnsChallenge.resolvers=1.1.1.1:53,1.0.0.1:53",
    ]

  }

  youtube_api_key     = var.youtube_api_key
  slack_api_key       = var.slack_api_key

  firebase_api_key    = var.firebase_api_key
  firebase_public_api_key = var.firebase_public_api_key
}

terraform {
  backend "s3" {
    region = "main"

    skip_requesting_account_id = true
    skip_credentials_validation = true
    skip_get_ec2_platforms = true
    skip_metadata_api_check = true
    skip_region_validation = true
    force_path_style = true
  }
}