const { until, By } = require('selenium-webdriver');

const getElementsById = async (driver, id, timeout = 2000) => {
  const elem = await driver.wait(until.elementLocated(By.id(id)), timeout);
  await driver.wait(until.elementIsVisible(elem), timeout);
  return driver.findElements(By.id(id));
};

const getElementById = async (driver, id, timeout = 2000) => {
  const elem = await driver.wait(until.elementLocated(By.id(id)), timeout);
  await driver.wait(until.elementIsVisible(elem), timeout);
  return driver.findElement(By.id(id));
};

const getElementByName = async (driver, name, timeout = 2000) => {
  const el = await driver.wait(until.elementLocated(By.name(name)), timeout);
  return driver.wait(until.elementIsVisible(el), timeout);
};

const getElementByXpath = async (driver, xpath, timeout = 2000) => {
  const el = await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
  return driver.wait(until.elementIsVisible(el), timeout);
};

const getElementsByClassName = async (driver, className, timeout = 2000) => {
  const elem = await driver.wait(
    until.elementLocated(By.className(className)),
    timeout,
  );
  await driver.wait(until.elementIsVisible(elem), timeout);
  return driver.findElements(By.className(className));
};

const getElementByClassName = async (driver, className, timeout = 2000) => {
  const elem = await driver.wait(
    until.elementLocated(By.className(className)),
    timeout,
  );
  await driver.wait(until.elementIsVisible(elem), timeout);
  return driver.findElement(By.className(className));
};

const setInputValueByName = async (driver, elementName, newValue) => {
  const el = await getElementByName(driver, elementName);
  await el.clear();
  await el.sendKeys(newValue);
};

const getInputValueByName = async (driver, elementName) => {
  const el = await getElementByName(driver, elementName);
  return el.getAttribute('value');
};

module.exports = {
  getElementByClassName,
  getElementsByClassName,
  getElementByXpath,
  getElementByName,
  getElementsById,
  getElementById,
  setInputValueByName,
  getInputValueByName,
};
