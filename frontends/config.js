if (process.env.BROWSER) {
  throw new Error(
    'Do not import `config.js` from inside the client-side code.',
  );
}

const config = {
  // env: process.env.NODE_ENV || 'development',
  // default locale is the first one
  locales: [
    /* @intl-code-template '${lang}-${COUNTRY}', */
    'en-US',
    'ru-RU',
    /* @intl-code-template-end */
  ],

  // https://expressjs.com/en/guide/behind-proxies.html
  trustProxy: process.env.TRUST_PROXY || 'loopback',

  // API Gateway
  api: {
    // API URL to be used in the client-side code
    clientUrl: process.env.CLIENT_API_URL || 'http://localhost:1337',
    // API URL to be used in the server-side code
    // serverUrl:
    //   process.env.API_SERVER_URL ||
    //   `http://localhost:${process.env.PORT || 3000}`,
  },
  pwa: {
    startUrl: '/',
    themeColor: '#ffffff',
    backgroundColor: '#ffffff',
    title: 'Elegant G Barbershop',
    display: 'standalone', // can be 'standalone' or 'fullscreen'
    shortTitle: 'Elegant G',
  },
  // Authentication
  auth: {
    tokenId: 'id_token',
    maxAge: 3000, // days
    jwt: {
      secret: process.env.JWT_SECRET || 'fe6f51f8-8c09-4fc4-a65e-f319997c078c',
      // expiresIn: 60 * 60 * 24 * 1000,
      // authenticateAfterVerify: false, // automatically authenticate after user verified email
    },
  },
  dateFormat: 'MMM Do YYYY, h:mm a',
  timezone: process.env.TZ || 'UTC',
};

module.exports = config;
