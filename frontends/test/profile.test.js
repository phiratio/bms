const { until } = require('selenium-webdriver');
const { setup, teardown, login, goTo, profilePage } = require('./framework');
const adminuser = require('./mocks/adminUser');

const location = process.env.FRONTEND_ADMIN_URL;

describe('Testing user profile', () => {
  let driver;

  beforeAll(async () => {
    driver = await setup();
    await login(driver, location, adminuser.login, adminuser.password);
    await driver.wait(until.urlContains('profile'));
    await goTo(driver, `${location}/profile`);
  }, 30000);

  afterAll(async () => {
    await teardown(driver);
  }, 40000);

  it('should verify that desired elements exist on the page', async () => {
    const page = await profilePage(driver);
    expect(page.profileContainer.present).toBe(true);
    expect(page.profileForm.present).toBe(true);
    expect(page.changePasswordForm.present).toBe(true);
    expect(page.avatar.present).toBe(true);
  });

  it('should update user profile', async () => {
    const updatedFirstName = 'DemoFirst';
    const updatedLastName = 'DemoLast';
    const updatedUsername = 'Username';

    const page = await profilePage(driver);
    await page.profileForm.setFirstName(updatedFirstName);
    await page.profileForm.setLastName(updatedLastName);
    await page.profileForm.setUsername(updatedUsername);

    expect(await page.profileForm.getLastName()).toBe(updatedLastName);
    expect(await page.profileForm.getFirstName()).toBe(updatedFirstName);
    expect(await page.profileForm.getUsername()).toBe(updatedUsername);

    await page.profileForm.save();
    await driver.navigate().refresh();
    // check form after update
    expect(await page.profileForm.getFirstName()).toBe(updatedFirstName);
    expect(await page.profileForm.getLastName()).toBe(updatedLastName);
    expect(await page.profileForm.getUsername()).toBe(updatedUsername);
  });
});
