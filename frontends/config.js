if (process.env.BROWSER) {
  throw new Error(
    'Do not import `config.js` from inside the client-side code.',
  );
}

const config = {
  // default locale is the first one
  locales: [
    /* @intl-code-template '${lang}-${COUNTRY}', */
    'en-US',
    'ru-RU',
    /* @intl-code-template-end */
  ],

  staticFilesUrl: process.env.STATIC_FILES_URL,

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
    title: process.env.TITLE,
    display: 'standalone', // can be 'standalone' or 'fullscreen'
    shortTitle: process.env.TITLE_SHORT,
  },
  // Authentication
  auth: {
    tokenId: 'id_token',
    maxAge: 3000, // days
    jwt: {
      secret: process.env.JWT_SECRET,
      // expiresIn: 60 * 60 * 24 * 1000,
      // authenticateAfterVerify: false, // automatically authenticate after user verified email
    },
  },
  dateFormat: 'MMM Do YYYY, h:mm a',
  timezone: process.env.TZ || 'UTC',
};

module.exports = config;
