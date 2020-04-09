const _ = require('lodash');
const banner = require('../../email/templates/layout/banner.js');
const contacts = require('../../email/templates/layout/contacts.js');
const footer = require('../../email/templates/layout/footer.js');
const layout = require('../../email/templates/layout/layout');
const inviteTemplate = require('../../email/templates/appointments/invite.js');

/**
 * User object
 */
class User {
  constructor(user) {
    this.user = user;
  }

  get id() {
    return this.user.id || this.user_id;
  }

  get firstName() {
    return this.user.firstName;
  }

  get lastName() {
    return this.user.lastName;
  }

  get email() {
    return this.user.email;
  }

  get avatar() {
    return this.user.avatar;
  }

  get username() {
    return this.user.username;
  }

  get fullName() {
    return `${_.get(this, 'user.firstName', '')} ${_.get(this, 'user.lastName', '')}`;
  }

  get url() {
    return `${process.env.FRONTEND_ADMIN_URL}/accounts/${this.id}`
  }

  get profile() {
    return this.user;
  }

  get isClient() {
    return _.get(this.profile, 'role.name') === 'Client';
  }

  get notifications() {
    return {
      email: ({...args}, {...config} = {}) => {
        if (this.email) {
          return strapi
            .services
            .mq
            .get('services.email')
            .add({...args}, {attempts: 7, backoff: Math.random() * 10000 + 9000, ...config});
        }
        return false
      },
      slack: () => ({
        sendMessage: (text, blocks, options = {}) => {
          if (!this.profile.slackId) return null;
          return strapi.services.slack.postMessage(
            {
              channel: this.profile.slackId,
              text: text,
              blocks: blocks,
              as_user: true
            },
            options
          );
        }
      }),
    }
  }

  get templates() {
    return {
      email: {
        invite: async () => {
          const location = await strapi.services.business.info();
          const html = new strapi.classes.emailTemplate({
            layout,
            body: [
              banner({url: `/uploads/templates/email/header.png`}),
              inviteTemplate({
                user: this,
                location,
                url: `${this.isClient ? process.env.FRONTEND_BOOKING_URL : process.env.FRONTEND_ADMIN_URL}/auth/token/${this.issueJWT()}`,
              }),
              contacts({
                location,
              }),
            ],
            footer: footer({
              footerText: 'You are receiving this email because you agreed to receive emails from us regarding events and special offers. Sent from an automated mailbox. If replying to this email, you will not receive a response.',
              location
            }),
          }).html;

          return {
            to: this.email,
            html,
            subject: `Your Invitation`,
          }
        },
      }
    }
  }

  issueJWT() {
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: this.id,
    });
    return  jwt;
  }

}

module.exports = User;
