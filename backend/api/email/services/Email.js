'use strict';

const fetch = require('node-fetch');
const psl = require('psl');
const EmailValidator = require('email-deep-validator');

const REPO_LINK = 'https://raw.githubusercontent.com/ivolo/disposable-email-domains/master';
const DISPOSABLE_DOMAINS_LIST = 'disposableDomainsList';

const DISPOSABLE_CONFIG_NAMESPACE = 'config:email:disposableDomainsList';

module.exports = {

  /**
   * Sends an email using built-in email plugin
   * @param to
   * @param subject
   * @param html
   * @param text
   * @returns {Promise<*>}
   */
  send: async ({ to, subject, html, text }) => {
    return strapi.plugins['email'].services.email.send({
      to,
      subject,
      text,
      html,
    });
  },

  /**
   * Section contains methods related to disposable emails
   */
  disposable: {
    /**
     * Pull updated lists of disposable emails
     * @returns {Promise<void>}
     */
    refreshList: async () => {
      const disposableDomainsList = await strapi.services.email.disposable.fetch(`${REPO_LINK}/index.json`);
      const disposableDomainsListWildcard = await strapi.services.email.disposable.fetch(`${REPO_LINK}/wildcard.json`);
      if (disposableDomainsList && disposableDomainsListWildcard) await strapi.services.email.disposable.set(DISPOSABLE_DOMAINS_LIST, [...disposableDomainsList, ...disposableDomainsListWildcard].sort());
    },
    /**
     * Helper function downloads and parses as JSON
     * @param link
     * @returns {null|Bluebird<any> | * | Q.Promise<any> | Promise<never> | Promise<void> | PromiseLike<any>}
     */
    fetch: link => {
      const namespace = 'services.email.getDisposableDomainsList';
      if (!link) {
        return null;
      }
      try {
        return fetch(link)
          .then(res => res.json())
          .then(async data => {
            if (!Array.isArray(data)) {
              strapi.log.error(namespace, 'Unable to get list from repository');
              return;
            }
            return data;
          });
      } catch(e) {
        strapi.log.error(namespace, e.message);
        strapi.log.fatal(e);
      }
    },

    /**
     * Sets array of domains into db
     * @param name
     * @param data
     * @returns {Promise<void>}
     */
    set: async (name, data) => {
      await strapi.connections.redis.set(DISPOSABLE_CONFIG_NAMESPACE, JSON.stringify(data));
      strapi.log.info('services.email.setDisposableDomainList', `Successfully refreshed ${name}`);
    },

    /**
     * Gets array of domains from DB
     * @returns {Promise<*>}
     */
    get: async () => {
      return await strapi.connections.redis.get(DISPOSABLE_CONFIG_NAMESPACE) || [];
    }

  },

  /**
   * Validates if provided emails domain part exist in the array of disposable domains
   * @param email
   * @returns {Promise<boolean>}
   */
  isDisposable: async email => {
    let domain = String(email.split('@')[1]).toLowerCase().trim();
    const parsed = psl.parse(domain);
    const disposableDomains = await strapi.services.email.disposable.get();

    // TODO: Refactor: Implement better search method
    if (disposableDomains.includes(parsed.domain)) {
      return true;
    }

    return false;
  },

  /**
   * Verifies an email address, checking MX records and SMTP connection
   * Return example { wellFormed: true, validDomain: true, validMailbox: true }
   * @param email
   * @returns {Promise<{validDomain, validMailbox, wellFormed}>}
   */
  verify: async email => {
    const emailValidator = new EmailValidator({ verifyMailbox: false });
    return emailValidator.verify(email);
  },

};
