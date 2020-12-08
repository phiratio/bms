const {
  setup,
  teardown,
  loginPage,
  login,
  getAlerts,
  getCookies,
  mainLayout,
} = require('./framework');
const { until } = require('selenium-webdriver');
const adminuser = require('./mocks/adminUser');

const location = process.env.FRONTEND_ADMIN_URL;

describe('Testing login flow', () => {
  let driver;

  beforeAll(async () => {
    driver = await setup();
  }, 30000);

  afterAll(async () => {
    await teardown(driver);
  }, 40000);

  it('should open login page', async () => {
    const page = await loginPage(driver, location);
    expect(page.title).toEqual('Login');
  });

  it('should fail to login', async () => {
    await login(driver, location, 'wrong_login', 'wrong_password');
    const alerts = await getAlerts(driver, 'danger');
    expect(alerts.length).toBe(1);
  });

  it('should successfully login as admin using login and password', async () => {
    await login(driver, location, adminuser.login, adminuser.password);
    await driver.wait(until.urlContains('profile'));
    const appLayout = await mainLayout(driver);
    expect(appLayout.sidebar.present).toBe(true);
    expect(appLayout.appBody.present).toBe(true);
    expect(appLayout.title).toEqual('Profile');
    expect(getCookies().indexOf('token_id')).toBeTruthy();
  });
});

// const image = driver.takeScreenshot()
// fs.writeFileSync('out.png', image, 'base64');
// driver.manage().window().maximize()
// driver.executeScript('return document.body.innerHTML');
