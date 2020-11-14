const { until, By } = require('selenium-webdriver');

const getElementById = async (driver, id, timeout = 2000) => {
  const el = await driver.wait(until.elementLocated(By.id(id)), timeout);
  return driver.wait(until.elementIsVisible(el), timeout);
};

const getElementByName = async (driver, name, timeout = 2000) => {
  const el = await driver.wait(until.elementLocated(By.name(name)), timeout);
  return driver.wait(until.elementIsVisible(el), timeout);
};

const getElementByXpath = async (driver, xpath, timeout = 2000) => {
  const el = await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
  return driver.wait(until.elementIsVisible(el), timeout);
};

const getElementByClassName = async (driver, className, timeout = 2000) => {
  const el = await driver.wait(
    until.elementLocated(By.className(className)),
    timeout,
  );
  return driver.wait(until.elementIsVisible(el), timeout);
};

module.exports = {
  getElementByClassName,
  getElementByXpath,
  getElementByName,
  getElementById,
};
