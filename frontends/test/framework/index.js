const { getElementByName, getElementById } = require('./helpers');
const { until, By, Builder, Key } = require('selenium-webdriver');

/**
 * Set up the environment
 * @returns {Promise<*>}
 */
const setup = async (server = '', browser = 'chrome', capabilities) => {
  let sessionId = null;
  let driver = new Builder().forBrowser(browser).build();

  if (capabilities) {
    driver = driver.withCapabilities(capabilities);
  }

  if (server !== '') {
    driver = driver.usingServer(server);
  }

  await driver.getSession().then((session) => {
    sessionId = session.id_;
  });
  await driver.manage().deleteAllCookies();

  return driver;
};

/**
 * Destroys environment
 * @param driver
 * @returns {Promise<void>}
 */
const teardown = async (driver) => {
  await driver.manage().deleteAllCookies();
  await driver.quit();
};

/**
 * Logs in using username and password
 * @param driver
 * @param location
 * @param login
 * @param password
 * @returns {Promise<void>}
 */
const login = async (driver, location, login, password) => {
  await driver.get(`${location}/login`);
  const loginElement = await getElementByName(driver, 'identifier');
  const passwordElement = await getElementByName(driver, 'password');
  await loginElement.sendKeys(login);
  await passwordElement.sendKeys(password, Key.RETURN);
};

/**
 * Returns login page
 * @param driver
 * @param location
 * @returns {Promise<{title: *}>}
 */
const loginPage = async (driver, location) => {
  await driver.get(`${location}`);
  await getElementById(driver, 'loginForm');
  const title = await driver.getTitle();

  return {
    title,
  };
};

/**
 * Returns main layout structure
 * @param driver
 * @returns {Promise<{sidebar: {present: boolean}, appBody: {present: boolean}, title: *}>}
 */
const mainLayout = async (driver) => {
  const sidebarElement = await driver.wait(
    until.elementLocated(By.className('sidebar')),
    2000,
  );
  await driver.wait(until.elementIsVisible(sidebarElement), 2000);

  const sidebar = await driver.findElements(By.className('sidebar'));
  const appBody = await driver.findElements(By.className('app-body'));

  return {
    title: await driver.getTitle(),
    sidebar: {
      present: sidebar.length === 1,
    },
    appBody: {
      present: appBody.length === 1,
    },
  };
};

/**
 * Returns current page alerts
 * @param driver
 * @param type Type of alert: danger, warning, success
 * @returns {Promise<{length: *}>}
 */
const getAlerts = async (driver, type) => {
  const alertElement = await driver.wait(
    until.elementLocated(By.className(`alert-${type}`)),
    2000,
  );
  await driver.wait(until.elementIsVisible(alertElement), 2000);
  const alerts = await driver.findElements(By.className(`alert-${type}`));
  return {
    length: alerts.length,
  };
};

/**
 * Returns cookies
 * @returns {array}
 */
const getCookies = () => {
  return document.cookie;
};

module.exports = {
  getAlerts,
  getCookies,
  mainLayout,
  login,
  loginPage,
  setup,
  teardown,
};
