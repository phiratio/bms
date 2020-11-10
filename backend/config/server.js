module.exports = ({env}) => ({
  "host": env('BACKEND_HOST', '0.0.0.0'),
  "port": env.int('BACKEND_PORT', 1337),
});
