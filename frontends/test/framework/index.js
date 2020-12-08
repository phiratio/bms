const { getElementById } = require('./helpers');
const {
  getInputValueByName,
  setInputValueByName,
  getElementByName,
  getElementsById,
} = require('./helpers');
const { until, By, Builder, Key } = require('selenium-webdriver');

/**
 * Set up the environment
 * @returns {Promise<*>}
 */
const setup = async (server = '', browser = 'chrome', capabilities) => {
  let sessionId = null;
  let driver = new Builder().forBrowser(browser).build();
  jest.setTimeout(30000);

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
 * @param driver Selenium driver instance
 * @returns {Promise<void>}
 */
const teardown = async (driver) => {
  await driver.manage().deleteAllCookies();
  await driver.quit();
};

/**
 * Logs in using username and password
 * @param driver Selenium driver instance
 * @param location Frontend URL
 * @param login Login to be used for login flow
 * @param password Password that will be used for login flow
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
 * @param driver Selenium driver instance
 * @param location Frontend URL
 * @returns {Promise<{title: *}>}
 */
const loginPage = async (driver, location) => {
  await driver.get(location);
  const title = await driver.getTitle();

  return {
    title,
  };
};

const profilePage = async (driver) => {
  const profileContainer = await getElementsById(driver, 'profileContainer');
  const profileForm = await getElementsById(driver, 'profileForm');
  const changePasswordForm = await getElementsById(
    driver,
    'changePasswordForm',
  );
  const avatar = await profileContainer[0].findElements(
    By.className('sb-avatar'),
  );

  return {
    title: await driver.getTitle(),
    profileContainer: {
      present: profileContainer.length === 1,
    },
    profileForm: {
      present: profileForm.length === 1,
      setFirstName: async (newValue) =>
        setInputValueByName(driver, 'firstName', newValue),
      getFirstName: async () => getInputValueByName(driver, 'firstName'),
      setLastName: async (newValue) =>
        setInputValueByName(driver, 'lastName', newValue),
      getLastName: async () => getInputValueByName(driver, 'lastName'),
      setUsername: async (newValue) =>
        setInputValueByName(driver, 'username', newValue),
      getUsername: async () => getInputValueByName(driver, 'username'),
      save: async () => {
        const saveButton = await getElementById(driver, 'profileFormSave');
        await saveButton.click();
        await driver.manage().setTimeouts({ implicit: 3000 });
      },
    },
    changePasswordForm: {
      present: changePasswordForm.length === 1,
    },
    avatar: {
      present: avatar.length === 1,
    },
  };
};

/**
 * Returns main layout structure
 * @param driver Selenium driver instance
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
 * @param driver Selenium driver instance
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
 * Returns document cookies
 * @returns {array}
 */
const getCookies = () => {
  return document.cookie;
};

/**
 *
 * @param driver Selenium driver instance
 * @param path Location where page will be redirected
 */
const goTo = (driver, path) => {
  driver.get(path);
};

module.exports = {
  setup,
  teardown,
  goTo,
  getAlerts,
  getCookies,
  mainLayout,
  login,
  loginPage,
  profilePage,
};
