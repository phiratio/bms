const { setup, teardown, getRootPath } = require("./framework");

jest.setTimeout(30000);

describe("server initialization", () => {
  /** this code is called once before any test is called */
  beforeAll(async (done) => {
    await setup();
    done();
  });

  /** this code is called once before all the tested are finished */
  afterAll(async (done) => {
    teardown();
    done();
  });

  it("strapi is defined", () => {
    expect(strapi).toBeDefined();
  });

  it("should return 200 for API root path", async () => {
    const rootRequest = await getRootPath();
    expect(rootRequest.statusCode).toBe(200);
    expect(rootRequest.body).toEqual({});
  });
});

require("./user");
