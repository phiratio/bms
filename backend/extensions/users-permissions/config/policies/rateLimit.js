const lazyRateLimit = {
  get RateLimit() {
    return require('koa2-ratelimit').RateLimit;
  },
};

module.exports = async (ctx, next) => {
  const message = {
    errors: {
      form:  'Too many attempts, please try again in a minute'
    }
  };

  return lazyRateLimit.RateLimit.middleware(
    Object.assign(
      {},
      {
        interval: 1 * 60 * 1000,
        max: 4,
        prefixKey: `${ctx.request.url}:${ctx.request.ip}`,
        message,
      },
      strapi.plugins['users-permissions'].config.ratelimit
    )
  )(ctx, next);
};
