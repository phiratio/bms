/**
 * Creates a user based on params
 * @param mockUserData
 * @returns {Promise<*>}
 */
const createUser = async (mockUserData) => {
  const data = { ...mockUserData };
  const user = await strapi.plugins["users-permissions"].services.user.add(
    data
  );

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
};

/**
 * Deletes user based on provided params
 * @param userData
 * @returns {Promise<*>}
 */
const deleteUser = async (userData) => {
  try {
    return strapi.plugins["users-permissions"].services.user.remove(userData);
  } catch (e) {}
};

/**
 * Returns default role
 * @returns {*}
 */
const getDefaultRole = async () => {
  const role = await strapi.query("role", "users-permissions").findOne({}, []);

  return {
    id: role.id,
  };
};

module.exports = {
  createUser,
  deleteUser,
  getDefaultRole,
};
