'use strict';
const API_KEY = process.env.SLACK_API_KEY;

const { WebClient } = require('@slack/web-api');
const _ = require('lodash');

const web = new WebClient(API_KEY);

class SlackService {
  /**
   * Returns configuration related to Slack service
   * @returns {*}
   */
  config() {
    return strapi.services.config.get('slack').key('config');
  }

  /**
   * Returns an object containing a list registered channels
   * @returns {{default: (function(): any), appointments: (function(): any)}}
   */
  get channels() {
    return {
      default: async () => {
        return _.get(await this.config(), 'defaultChannel');
      },
      appointments: async () => {
        return  _.get(await this.config(), 'appointmentsChannel');
      }
    }
  }

  /**
   *  Returns workspace name
   * @returns {Promise<any>}
   */
  async workSpaceName() {
    return _.get(await this.config(), 'workspace');
  }

  /**
   * Returns an object with methods related to channels
   * @returns {{postMessage: postMessage}}
   */
  channel(channelName) {
    return {
      /**
       * Posts a message to  channel
       * @returns {Promise<boolean|WebAPICallResult>}
       * @param options
       */
      postMessage: async options => {
        if (!this.channels[channelName]) return false;
        const channel = await this.channels[channelName]();
        if (channel) return this.postMessage({ ...options, ...{channel} });
        return false;
      }
    }
  }

  /**
   * Post a message to message queue
   * @param msgObject
   * @param options
   */
  postMessage(msgObject, options = {}) {
    if (!this.isEnabled()) return;
    return strapi
      .services
      .mq
      .get('services.slack')
      .add(msgObject, { attempts: 7, backoff: Math.random() * 10000 + 9000, ...options });
  }

  /**
   * Posts a message to Slack channel
   * Private method used by message queue to
   * @param options
   * @returns {Promise<WebAPICallResult>}
   * @private
   */
  async post(options) {
    return web.chat.postMessage(options)
  }

  isEnabled() {
    if (!API_KEY) {
      strapi.log.warn('Slack API key was not found in your environment');
      return false;
    }
    return true;
  }

  /**
   * Returns a list of users in workspace
   * @returns {Promise<WebAPICallResult>}
   */
  async listOfUsers() {
    if (this.isEnabled()) {
      const result = await web.users.list() || {};
      if (result.members) return result.members;
    }
    return undefined;
  }

  /**
   * Returns a list of user profiles in workspace
   * @returns {Promise<undefined|*>}
   */
  async listOfProfiles() {
    const members = await this.listOfUsers();
    if (members) return members.map(el => el.profile);
    return undefined
  }

  /**
   * Authorization testing method
   * @returns {Promise<WebAPICallResult>}
   */
  test() {
    return web.auth.test();
  }

  /**
   * Get all users from Slack and assign slackIds to Accounts that has match by email
   * @returns {Promise<{}>}
   */
  async assignSlackIdsToAccounts() {
    try {
      const listOfSlackUsers = await this.listOfUsers();

      if (!Array.isArray(listOfSlackUsers)) {
        strapi.log.error('services.slack.assignSlackIdsToAccounts', 'Unable to get list of slack users');
        return;
      }

      for (const el of listOfSlackUsers) {
        const email = _.get(el, 'profile.email');
        if (email) {
           const account = await strapi.services.accounts.fetch({ email });
           if (account) {
             await strapi.services.accounts.update({ _id: account._id }, { slackId: el.id })
               .then(() => strapi.log.info('services.slack.assignSlackIdsToAccounts', `Slack id was assigned to ${email}`));
           }
        }
      }
      return {};
    } catch (e) {
      strapi.log.error('services.slack.assignSlackIdsToAccounts', e.message);
      strapi.log.fatal(e);
    }
  }

  /**
   * Assigns Slack id to Account
   * @param email
   * @param id
   * @returns {Promise<{}>}
   */
  async assignSlackIdToAccount(email, id) {
    try {
      const account = await strapi.services.accounts.fetch({ email });
      if (account) {
        await strapi.services.accounts.update({ _id: account._id }, { slackId: id })
          .then(() => strapi.log.info('services.slack.assignSlackIdToAccount', `Slack id was assigned to ${email}`));
      }
      return {};
    } catch (e) {
      strapi.log.error('services.slack.assignSlackIdToAccount', e.message);
      strapi.log.fatal(e);
    }
  }

}

module.exports = new SlackService();
