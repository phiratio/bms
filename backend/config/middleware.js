module.exports = ({ env }) => ({
  load: {
    before: ["timer", "responseTime", "logger", "cors", "responses", "gzip"],
    order: [
      "Define the middlewares' load order by putting their name in this array is the right order",
    ],
    after: ["parser", "router"],
  },
  settings: {
    public: {
      path: "./public",
      maxAge: 60000,
    },
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN.split(", "),
      expose: ["WWW-Authenticate", "Server-Authorization"],
      maxAge: 31536000,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      headers: ["Content-Type", "Authorization", "X-Frame-Options", "Origin"],
    },
    security: {
      csrf: {
        enabled: false,
        key: "_csrf",
        secret: "_csrfSecret",
      },
      csp: {
        enabled: false,
        policy: {
          "default-src": "'self'",
        },
      },
      p3p: {
        enabled: false,
        value: "",
      },
      hsts: {
        enabled: false,
        maxAge: 31536000,
        includeSubDomains: true,
      },
      xframe: {
        enabled: false,
        value: "SAMEORIGIN",
      },
      xss: {
        enabled: false,
        mode: "block",
      },
      ip: {
        enabled: false,
        whiteList: [],
        blackList: [],
      },
    },
  },
});
