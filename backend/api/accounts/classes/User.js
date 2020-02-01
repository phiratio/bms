const HOSTNAME = process.env.FRONTEND_HOSTNAME;

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
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  get url() {
    return `${HOSTNAME}/accounts/${this.id}`
  }

  get profile() {
    return this.user;
  }

  get notifications() {
    return {
      email: ({ ...args }, { ...config } = {}) => {
        if (this.email) {
          return strapi
            .services
            .mq
            .get('services.email')
            .add({ ...args }, { attempts: 7, backoff: Math.random() * 10000 + 9000, ...config });
        }
        return false
      },
      slack: () => ({
        sendMessage: (text, blocks, options={}) => {
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

}

module.exports = User;
