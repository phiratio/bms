'use strict';

const moment = require('moment');
const _ = require('lodash');

class Business {

  async general() {
    return strapi.services.config.get('general').key('storeInfo');
  }

  async address() {
    return strapi.services.config.get('general').key('address');
  }

  async socials() {
    return strapi.services.config.get('general').key('socials');
  }

  async terms() {
    return strapi.services.config.get('general').key('terms');
  }

  async stringifyHours() {
      const workingHours = await this.hours();
      return Object.keys(workingHours).filter(el => workingHours[el].length > 0).map(el => {
        const from = _.get(workingHours[el], '[0][0]');
        const to = _.get(workingHours[el], '[0][1]');
        return `${_.startCase(el)} ${ moment().startOf('day').add(from, 'seconds').format('LT')} - ${moment().startOf('day').add(to, 'seconds').format('LT')}`
      });
  }

  async hours() {
    return strapi.services.config.get('general').key('workingHours');
  }

  async info() {
    return {
      ...await this.general(),
      address: await this.address(),
      storeHours: await this.stringifyHours(),
      socials: await this.socials(),
    }

  }

}

module.exports = new Business;
