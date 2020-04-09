const { version } = require('../package');
const config = require('../config');

module.exports = {
  ...config,
  version,
  port: process.env.FRONTEND_BOOKING_PORT || 3015,
  pwa: {
    ...config.pwa,
    defaultRoute: '/book',
  },
};
