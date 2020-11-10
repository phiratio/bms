module.exports = ({env}) => ({
  "defaultConnection": "default",
  "connections": {
    "default": {
      "connector": "mongoose",
      "settings": {
        "database": env('MONGODB_NAME', 'strapi'),
        "host": env('MONGODB_HOST', 'localhost'),
        "srv": env.bool('MONGODB_SRV', false),
        "port": env.int('MONGODB_PORT', 27017),
        "username": env('MONGODB_USERNAME'),
        "password": env('MONGODB_PASSWORD'),
        "ssl": env.bool('MONGODB_SSL', false)
      },
      "options": {
        "ssl": env.bool('MONGODB_SSL', false),
        "authenticationDatabase": env('MONGODB_AUTHENTICATION_DATABASE'),
      }
    }
  }
});
