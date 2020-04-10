const { version } = require('../../package');
const config = require('../../config');

module.exports = {
  ...config,
  version,
  port: process.env.FRONTEND_PORT || 3000,
  pwa: {
    ...config.pwa,
    defaultRoute: '/waitingList',
  },
  // Socket.io Gateway
  io: {
    clientHost:
      process.env.CLIENT_API_URL ||
      process.env.CLIENT_IO_HOST ||
      'localhost:1337',
    pingInterval: 3000,
    pingTimeout: 2000,
  },
  notifications: {
    sound: 'enabledIfBrowserAllows', // enabled, disabled, enabledIfBrowserAllows
  },
};
