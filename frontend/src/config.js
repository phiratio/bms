if (process.env.BROWSER) {
  throw new Error(
    'Do not import `config.js` from inside the client-side code.',
  );
}

const { version } = require('../package');

const config = {
  version,
  // env: process.env.NODE_ENV || 'development',
  // default locale is the first one
  locales: [
    /* @intl-code-template '${lang}-${COUNTRY}', */
    'en-US',
    'ru-RU',
    /* @intl-code-template-end */
  ],

  // Node.js app
  port: process.env.FRONTEND_PORT || 3000,

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
  // Socket.io Gateway
  io: {
    clientHost:
      process.env.CLIENT_API_URL ||
      process.env.CLIENT_IO_HOST ||
      'localhost:1337',
    pingInterval: 3000,
    pingTimeout: 2000,
  },
  // // Cache
  // cache: {
  //   redis: {
  //     host: 'localhost',
  //     port: 6379,
  //   },
  //   store: 'redis://localhost:6379', // mongodb://user@password@localhost:27017/rsk // use only redis in production
  // },
  // // Database
  // databaseUrl: process.env.DATABASE_URL || 'sqlite:database.sqlite',
  //
  // // Web analytics
  // analytics: {
  //   // https://analytics.google.com/
  //   googleTrackingId: process.env.GOOGLE_TRACKING_ID, // UA-XXXXX-X
  // },
  pwa: {
    defaultRoute: '/waitingList',
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
    // resetPasswordExpires: 60 * 60 * 24, // 1 hour
    // verifyTokenExpires: 60 * 60 * 24, // 1 hour
    // // https://developers.facebook.com/
    // facebook: {
    //   id: process.env.FACEBOOK_APP_ID || '186244551745631',
    //   secret:
    //     process.env.FACEBOOK_APP_SECRET || 'a970ae3240ab4b9b8aae0f9f0661c6fc',
    // },
    //
    // // https://cloud.google.com/console/project
    // google: {
    //   id:
    //     process.env.GOOGLE_CLIENT_ID ||
    //     '251410730550-ahcg0ou5mgfhl8hlui1urru7jn5s12km.apps.googleusercontent.com',
    //   secret: process.env.GOOGLE_CLIENT_SECRET || 'Y8yR9yZAhm9jQ8FKAL8QIEcd',
    // },
    //
    // // https://apps.twitter.com/
    // twitter: {
    //   key: process.env.TWITTER_CONSUMER_KEY || 'Ie20AZvLJI2lQD5Dsgxgjauns',
    //   secret:
    //     process.env.TWITTER_CONSUMER_SECRET ||
    //     'KTZ6cxoKnEakQCeSpZlaUCJWGAlTEBJj0y2EMkUBujA7zWSvaQ',
    // },
  },
  // // Users module
  // users: {
  //   disableUsersOnSelfDelete: false, // Rather then delete records from database - disable them
  //   pageSize: 15, // How many users should be shown per page
  //   paginationLinks: 3, // How many pagination links should be generated
  // },
  // db: {
  //   mongodb: {
  //     uri: process.env.DATABASE_MONGODB_URL || 'mongodb://localhost:27017/rsk',
  //   },
  // },
  notifications: {
    sound: 'enabledIfBrowserAllows', // enabled, disabled, enabledIfBrowserAllows
  },
  // smtp: {
  //   enabled: true,
  //   host: 'smtp.ethereal.email',
  //   port: 587,
  //   secure: false,
  //   auth: {
  //     user: 'gbtbnbb44l2bobgw@ethereal.email',
  //     pass: '5kkSPB5TvNdBhSx62t',
  //   },
  //   // sender info
  //   sender: {
  //     from: 'Patrick Ethereal',
  //     // headers: {},
  //   },
  // },
  // queeue: {
  //   onButtonClickEnableAndMoveToEnd: true, // if Flic button was clicked and employee is in disabled group and was not initialized, employee will be moved to the list of enabled employees and status will be changed to busy
  //   changeStatusOnClick: true, // automatically changes status to busy if employee was clicked once
  //   smartSort: true, // if true user`s position in queue will be sorted depending on other employees initialization status
  // },
  // waitingList: {
  //   pageSize: 8,
  //   paginationLinks: 5,
  //   soundNotificationName: 'shopkeeper',
  // },
  // birdEye: {
  //   bussinessId: 151758247001592,
  //   apiKey: '4dfV68WjPFfafaacqHkaPb4fErWocXxj',
  //   developerEmailId: 'elegantgbarbershop@gmail.com',
  // },
  dateFormat: 'MMMM Do YYYY, h:mm:ss a',
};

module.exports = config;
