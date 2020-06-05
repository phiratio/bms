provider "docker" {
  host = "ssh://${local.ssh.username}@${local.ssh.host}:${local.ssh.port}"

  # Login to registry,
  # can have multiple `registry_auth` blocks
  registry_auth {
    address   = local.registry.address
    username  = local.registry.username
    password  = local.registry.password
  }
}