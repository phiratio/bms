const { getElementByClassName } = require('./helpers');
const { login } = require('./helpers/login');
const { getElementById } = require('./helpers');
const { until, By, Builder } = require('selenium-webdriver');

const capabilities = {
  browserName: 'chrome',
  version: '86.0',
  platform: 'WIN10',
  video: true,
  network: true,
  console: true,
  visual: true,
};

let sessionId = null;

const testLogin = 'admin@demo.org';
const testPassword = 'demodemo';

const location = process.env.FRONTEND_ADMIN_URL;

describe('Testing login flow', () => {
  let driver;

  beforeAll(async () => {
    driver = new Builder()
      // .usingServer('https://someserver')
      // .withCapabilities(capabilities)
      .forBrowser('chrome')
      .build();

    await driver.getSession().then((session) => {
      sessionId = session.id_;
    });
    await driver.manage().deleteAllCookies();
  }, 30000);

  afterAll(async () => {
    await driver.manage().deleteAllCookies();
    await driver.quit();
  }, 40000);

  it('should open main page', async () => {
    await driver.get(`${location}`);
    await getElementById(driver, 'loginForm');

    const title = await driver.getTitle();
    expect(title).toEqual('Login');
  });

  it('should fail to login', async () => {
    await login(driver, location, 'wrong_login', 'wrong_password');
    const alert = await getElementByClassName(driver, 'alert');
    expect(await alert.getText()).toBe('Identifier or password invalid');
  });

  it('should successfully login as admin using login and password', async () => {
    await login(driver, location, testLogin, testPassword);

    const el = await driver.wait(
      until.elementLocated(By.className('sidebar')),
      2000,
    );
    await driver.wait(until.elementIsVisible(el), 2000);

    const sidebar = await driver.findElements(By.className('sidebar'));
    const appBody = await driver.findElements(By.className('app-body'));

    expect(sidebar.length).toBe(1);
    expect(appBody.length).toBe(1);

    const title = await driver.getTitle();
    expect(title).toEqual('Profile');
    expect(document.cookie.indexOf('token_id')).toBeTruthy();
  });
});

// const image = driver.takeScreenshot()
// fs.writeFileSync('out.png', image, 'base64');
