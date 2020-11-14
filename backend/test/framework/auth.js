const request = require("supertest");

/**
 * Authenticates
 * @param identifier
 * @param password
 * @returns {*}
 */
const authLocal = async (identifier, password) => {
  const req = await request(strapi.server).post("/auth/local").send({
    identifier,
    password,
  });

  return {
    statusCode: req.statusCode,
    body: req.body,
  };
};

const getCurrentUserCredentials = async (jwt) => {
  const res = await request(strapi.server)
    .get("/users/me")
    .set("Authorization", `Bearer ${jwt}`);

  return {
    id: res.body.id,
    username: res.body.username,
    email: res.body.email,
  };
};

/**
 * Returns signed JWT from authentication request based on provided login and password
 * @param identifier
 * @param password
 * @returns {Promise<*>}
 */
const getJwt = async (identifier, password) => {
  const authLocal = await authLocal(identifier, password);
  return authLocal.jwt;
};

/**
 * Issues JWT
 * @param id User id
 * @returns {*}
 */
const issueJwt = (id) =>
  strapi.plugins["users-permissions"].services.jwt.issue({
    id,
  });

module.exports = {
  authLocal,
  getJwt,
  getCurrentUserCredentials,
  issueJwt,
};
