const { Key } = require('selenium-webdriver');
const { getElementByName } = require('./index');

const login = async (driver, location, login, password) => {
  await driver.get(`${location}/login`);
  const loginElement = await getElementByName(driver, 'identifier');
  const passwordElement = await getElementByName(driver, 'password');
  await loginElement.sendKeys(login);
  await passwordElement.sendKeys(password, Key.RETURN);
};

module.exports = {
  login,
};
