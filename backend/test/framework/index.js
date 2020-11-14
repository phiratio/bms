const SetupStrapi = require("strapi");
const request = require("supertest");
const http = require("http");

let strapiInstance;

const setup = async () => {
  if (!strapiInstance) {
    /** the following code in copied from `./node_modules/strapi/lib/Strapi.js` */
    await SetupStrapi().load();
    strapiInstance = strapi; // strapi is global now
    await strapiInstance.app
      .use(strapiInstance.router.routes()) // populate KOA routes
      .use(strapiInstance.router.allowedMethods()); // populate KOA methods

    strapiInstance.server = http.createServer(strapiInstance.app.callback());
    const io = await require("socket.io")(strapiInstance.server);
    process.env["DISABLE_SOCKET_IO_SERVER"] = "1";
    strapi.io = io; // Make socket.io server accessible globally
  }

  return strapiInstance;
};

const getRootPath = async () => {
  const req = await request(strapi.server).get("/");

  return {
    statusCode: req.statusCode,
    body: req.body,
  };
};

const teardown = () => {};

module.exports = {
  setup,
  teardown,
  getRootPath,
  user: require("./user"),
  auth: require("./auth"),
};
