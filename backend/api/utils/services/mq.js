const Redis = require('ioredis');
const Queue = require('bull');

const redisOpts = {
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
};

const client = new Redis(redisOpts);
const subscriber = new Redis(redisOpts);

const defaultOpts = {
  createClient: type => {
    switch (type) {
      case 'client':
        return client;
      case 'subscriber':
        return subscriber;
      default:
        return new Redis(redisOpts);
    }
  },
};


/**
 * We keep track of all message queues in `this.mqs` so we can access them
 * throughout the project using `strapi.services.mqs.get(nameOfTheQueue)`
 * Default queues initialized in `bootstrap.js` file and event subscription happens
 * in `subscriptions.js`
 */
class MQ {

  constructor() {
    this.mqs = {};
  }

  /**
   * Returns a queue
   * @param name
   * @returns {*}
   */
  get(name) {
    return this.mqs[name];
  }

  async retry(name) {
    const failedJobs = await this.mqs[name].getFailed();
    if (failedJobs.length > 0) {
      strapi.log.warn(name, 'Retrying failed jobs');
      return failedJobs.forEach(job => job.retry());
    }
  }


  async retryFailed(name) {
    if (name) {
      return this.retry(name);
    }
    return Object.keys(this.mqs).forEach(name => this.retry(name));
  }

  /**
   * Returns a new Message Broker Queue
   * @param name
   * @param opts
   * @returns {Queue}
   */
  new(name, opts) {
    const queue = new Queue(name, { ...defaultOpts, ...opts });
    this.mqs[name] = queue;
    return queue;
  }

}

module.exports = new MQ();
