const strapi = require('strapi');
const request = require('supertest');
const { cli } = require('jest');
const app = strapi();

const {
  TEST_ACCOUNT_LOGIN,
  TEST_ACCOUNT_EMAIL,
  TEST_ACCOUNT_PASSWORD,
} = process.env;

describe('API', () => {
  let auth_token;

  beforeAll(async done => {
    await app.start();
    done();
  });

  const auth = (identifier, password) => request(app.server)
      .post('/auth/local')
      .send({
        identifier,
        password,
      });

  it('succeeds with correct credentials: email/password', async () => {
    const res = await auth(TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      {
        jwt: expect.any(String),
        user: expect.any(Object),
      }
    );
    auth_token = res.body.jwt;
  });

  it('succeeds with correct credentials: login/password', async () => {
    const res = await auth(TEST_ACCOUNT_LOGIN, TEST_ACCOUNT_PASSWORD);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      {
        jwt: expect.any(String),
        user: expect.any(Object),
      }
    )
  });

  it('fails with wrong credentials', async () => {
    const res = await auth('wrong_identifier', 'wrong_password');

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');

  });

  it('successfully decodes JWT token', async () => {
    const token = await app.plugins['users-permissions'].services.jwt.verify(auth_token);
    expect(token).not.toBeInstanceOf(Error);
  });

});



