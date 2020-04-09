const moment = require('moment');
const _ = require('lodash');
const User = require('../../accounts/classes/User');
const SlackTemplate = require('../../slack/classes/SlackTemplate');
const {
  WAITING_LIST_TYPE_APPOINTMENT,
  WAITING_LIST_TYPE_WALK_IN,
  WAITING_LIST_STATUS_CANCELED,
  WAITING_LIST_STATUS_CONFIRMED,
  WAITING_LIST_STATUS_NOT_CONFIRMED
} = require('../../constants');

const banner = require('../../email/templates/layout/banner.js');
const contacts = require('../../email/templates/layout/contacts.js');
const footer = require('../../email/templates/layout/footer.js');
const layout = require('../../email/templates/layout/layout');
const newAppointmentTemplate = require('../../email/templates/appointments/new.js');
const updateAppointmentTemplate = require('../../email/templates/appointments/update.js');
const cancelAppointmentTemplate = require('../../email/templates/appointments/cancel.js');
const reminderAppointmentTemplate = require('../../email/templates/appointments/reminder.js');

const humanizeDuration = require('humanize-duration');

const BOOKING_URL = process.env.FRONTEND_BOOKING_URL;
const ADMIN_URL = process.env.FRONTEND_ADMIN_URL;

class WaitingListRecord {

  /**
   * @param waitingListRecord an object containing waitingList record data
   * @param requestValues
   * @param originalRecord an object containing original data (before update)
   */
  constructor(waitingListRecord, requestValues, originalRecord) {
    this.waitinglistRecord = waitingListRecord;
    if (originalRecord) {
      this.originalRecord = new strapi.classes.waitingListRecord(originalRecord);
    }

    this.requestValues = requestValues;

  }

  /**
   * Returns object containing settings related to WaitingLists
   * @returns {{showOnTvOnlyTodayRecords: (function(): *), soundNotifications: (function(): *), showOnTv: (function(): *), isPublicSlackNotificationsEnabled: (function(): *)}}
   */
  get config() {
    return ({
      /**
       * Should we show records on TV screens
       * @returns {*}
       */
      showOnTv: () => strapi.services.config.get('waitinglist').key('showOnTv'),
      /**
       * Sound notification settings
       * @returns {*}
       */
      soundNotifications: () => strapi.services.config.get('waitinglist').key('soundNotifications'),
      /**
       * Should appointments appear on TV screens: only today's appointments or every appointment
       * @returns {*}
       */
      showOnTvOnlyTodayRecords: () => strapi.services.config.get('appointments').key('showOnTvOnlyTodayRecords'),
      /**
       * Is Public Slack messaging enabled. If enabled newly created and updated appointments will be published to public channel in Slack
       * @returns {*}
       */
      isPublicSlackNotificationsEnabled: () => strapi.services.config.get('appointments').key('notificationSlackPublic'),
    });
  }

  /**
   * Returns WaitingListRecords id
   * @returns {*}
   */
  get id() {
    return this.waitinglistRecord.id;
  }

  /**
   * Return Note attached to WaitingList
   * @returns {*|Howl|SlackTemplate.note}
   */
  get note() {
    return this.waitinglistRecord.note;
  }

  get notifyClientNote() {
    return _.get(this.requestValues, 'notifyClientNote', false);
  }

  /**
   * Current waitingListRecords URL
   * @returns {string}
   */
  get url() {
    return `${BOOKING_URL}/appointments/${this.id}`
  }

  get urlWithJWT() {
    const token = strapi.plugins['users-permissions'].services.jwt.issue({
      id: this.client.id,
    });
    return `${BOOKING_URL}/auth/token/${token}?redirect=/appointments/${this.id}`
  }

  /**
   * Clients user profile
   * @returns {User}
   */
  get client() {
    return new User(this.waitinglistRecord.user);
  }

  /**
   * List of selected employees
   * @returns {*}
   */
  get employees() {
    const users = this.waitinglistRecord.employees.map(user => new User(user));
    /**
     * Helper function loops through users and sends notification
     */
    users.notify = () => ({
      slack: ({ text, extraText }, options={} ) => ({
        new: async () => {
          let textTemplate = this.templates.slack.new.text.private();
          let blocksTemplate = this.templates.slack.new.blocks.private({ text, extraText });
          return users.forEach(user => {
            return user.notifications.slack().sendMessage(textTemplate, blocksTemplate, options);
          })
        },
        update: async () => {
          let textTemplate = this.templates.slack.update.text.private();
          let blocksTemplate = this.templates.slack.update.blocks.private({ text, extraText });
          return users.forEach(user => {
            return user.notifications.slack().sendMessage(textTemplate, blocksTemplate, options);
          })
        },
        cancel: async () => {
          let textTemplate = this.templates.slack.cancel.text.private();
          let blocksTemplate = this.templates.slack.cancel.blocks.private({ text, extraText });
          return users.forEach(user => {
            return user.notifications.slack().sendMessage(textTemplate, blocksTemplate, options);
          })
        },
      }),
    });
    /**
     * Returns a comma separated string of users
     * @returns {*}
     */
    users.toString = () => {
      return users.reduce((acc, el) => {
        acc.push(el.username);
        return acc;
      }, []).join(', ');
    };
    return users;
  }

  /**
   * Appointments usually with one employee, returns first employee
   * @returns {User}
   */
  get employee() {
    return new User(this.waitinglistRecord.employees[0]);
  }

  /**
   * Return type of WaitingList record: e.g. Appointment, Walk-In or Reserved
   * @returns {*}
   */
  get type() {
    return this.waitinglistRecord.type;
  }

  /**
   * Returns of WaitingList record's check status. Weather record was marked as done or not.
   * @returns {*}
   */
  get check() {
    return this.waitinglistRecord.check;
  }

  /**
   * Current status: Confirmed, Not Confirmed or Canceled
   * @returns {*}
   */
  get status() {
    return this.waitinglistRecord.status;
  }

  get statusText() {
    switch (this.status) {
      case WAITING_LIST_STATUS_CONFIRMED:
        return 'Confirmed';
      case WAITING_LIST_STATUS_CANCELED:
        return 'Canceled';
      case WAITING_LIST_STATUS_NOT_CONFIRMED:
        return 'Not Confirmed';
      default:
        return 'Unknown Status';
    }
  }



  /**
   * Returns and array of Items
   * @returns {*}
   */
  get services() {
    const services = this.waitinglistRecord.services;
    /**
     * Helper function returns a comma separate string of services
     * @returns {*}
     */
    services.toString = () => {
      return services.reduce((acc, el) => {
        acc.push(el.name);
        return acc;
      }, []).join(', ');
    };
    return services;
  }

  /**
   * Returns dollar price for services
   */
  get price() {
    const services = this.services;
    /**
     * Different types types of waitingLists have different prices,
     * We use different properties to store prices in service object
     */
    let property = 'price';

    if (this.type === WAITING_LIST_TYPE_APPOINTMENT) {
      property = 'priceAppt';
    }

    return services.reduce((acc, el) =>  acc + el[property] , 0);
  }

  get formattedPrice() {
    return `$${ Math.floor(this.price / 100)}`;
  }

  get duration() {
    return (this.endTime.unix() - this.startTime.unix());
  }

  get formattedDuration() {
    return humanizeDuration( this.duration * 1000, { units: ['m'] } )
  }

  /**
   * Current waitingListRecord's start time
   * @returns {moment.Moment|boolean}
   */
  get startTime() {
    if (!this.waitinglistRecord.apptStartTime) return false;
    return moment(this.waitinglistRecord.apptStartTime);
  }

  /**
   * Current waitingListRecord's end time
   * @returns {moment.Moment|boolean}
   */
  get endTime() {
    if (!this.waitinglistRecord.apptEndTime) return false;
    return moment(this.waitinglistRecord.apptEndTime);
  }

  /**
   * Does current WaitingList record start today ?
   * @returns {boolean}
   */
  get isSameDay() {
    return this.startTime.isSame(moment(), 'day');
  }

  /**
   * Checks if time range was changed during update
   * @returns {boolean}
   */
  get isOriginalTimeSameAsCurrent() {
    const sameStartTme = this.startTime.isSame( this.originalRecord.startTime );
    const sameEndTime = this.endTime.isSame( this.originalRecord.endTime );
    return !(!sameStartTme || !sameEndTime);
  }

  /**
   * Checks if original record is same as updated
   * @returns {boolean}
   */
  get changed() {

    // Qualify record as changed if a client note exist in passed values
    if (this.notifyClientNote) return true;

    if (this.type === WAITING_LIST_TYPE_APPOINTMENT) {
      if (!this.isOriginalTimeSameAsCurrent) {
        return true;
      }
    }

    if (this.originalRecord.employees.toString() !== this.employees.toString()) {
      return true;
    }

    if (this.originalRecord.services.toString()  !== this.services.toString()) {
      return true;
    }

    if (this.originalRecord.status !== this.status) {
      return true;
    }

    return false;
  }

  /**
   * Returns current waitingListRecords Date and Time
   * @returns {string}
   */
  get dateTime() {
    if (!this.startTime) return '';
    let date = `Today (${this.startTime.format('MMM Do')})`;
    if (!this.isSameDay) {
       date = this.startTime.format('MMM Do');
    }

    return `${ date } ${this.startTime.format('LT')} - ${ this.endTime.format('LT') }`;
  }

  /**
   * Returns templates for various services
   * @returns {{slack: {text: {private: (function(): string), public: (function(): string)}, message: {private: (function(): *), public: (function(): *)}}}}
   */
  get templates() {
    return {
      email: {
         new: async () => {
           const location = await strapi.services.business.info();
           const html = new strapi.classes.emailTemplate({
             layout,
             body: [
               banner({ url: `/uploads/templates/email/header.png`}),
               newAppointmentTemplate({
                 user: this.client,
                 date: this.startTime.format('dddd, MMMM Do YYYY'),
                 time: this.startTime.format('LT'),
                 services: this.services.toString(),
                 duration: this.formattedDuration,
                 staff: this.employees.toString(),
                 price: this.formattedPrice,
                 url: this.urlWithJWT,
                 location,
                 extraText: this.notifyClientNote,
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
             to: this.client.email,
             html,
             subject: `Your Appointment on ${this.startTime.format('dddd, MMMM Do YYYY')} at ${this.startTime.format('LT')} with ${this.employees.toString()}`,
           }
          },

        update: async () => {
          const location = await strapi.services.business.info();
          const html = new strapi.classes.emailTemplate({
            layout,
            body: [
              banner({ url: `/uploads/templates/email/header.png`}),
              updateAppointmentTemplate({
                user: this.client,
                date: this.startTime.format('dddd, MMMM Do YYYY'),
                time: this.startTime.format('LT'),
                services: this.services.toString(),
                duration: this.formattedDuration,
                staff: this.employees.toString(),
                price: this.formattedPrice,
                url: this.urlWithJWT,
                location,
                extraText: this.notifyClientNote,
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
            to: this.client.email,
            html,
            subject: `Your Updated Appointment on ${this.startTime.format('dddd, MMMM Do YYYY')} at ${this.startTime.format('LT')} with ${this.employees.toString()}`,
          }
        },

        cancel: async () => {
          const location = await strapi.services.business.info();
          const html = new strapi.classes.emailTemplate({
            layout,
            body: [
              banner({ url: `/uploads/templates/email/header.png`}),
              cancelAppointmentTemplate({
                user: this.client,
                date: this.startTime.format('dddd, MMMM Do YYYY'),
                time: this.startTime.format('LT'),
                services: this.services.toString(),
                duration: this.formattedDuration,
                staff: this.employees.toString(),
                price: this.formattedPrice,
                url: this.urlWithJWT,
                location,
                extraText: this.notifyClientNote,
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
            to: this.client.email,
            html,
            subject: `Appointment was canceled`,
          }
        },

        reminder: async () => {
          const location = await strapi.services.business.info();
          const html = new strapi.classes.emailTemplate({
            layout,
            body: [
              banner({ url: `/uploads/templates/email/header.png`}),
              reminderAppointmentTemplate({
                user: this.client,
                date: this.startTime.format('dddd, MMMM Do YYYY'),
                time: this.startTime.format('LT'),
                services: this.services.toString(),
                duration: this.formattedDuration,
                staff: this.employees.toString(),
                price: this.formattedPrice,
                url: this.urlWithJWT,
                location,
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
            to: this.client.email,
            html,
            subject: `Appointment reminder from ${location.name}`,
          }
        },

      },
      /**
       * Returns Slack templates
       */
      slack: {
        /**
         * Returns slack template form newly created WaitingListRecords
         */
        new: {
          /**
           * Used for mobile chat notification messages in Slack
           */
          text: {
            private: (text = 'New appointment with') => {
              return `> ${text} ${this.client.fullName} ${this.dateTime}`
            },
            public: (text = 'New appointment') => {
              return `> ${text} ${this.client.fullName} ${this.dateTime}`
            },
          },
          /**
           * Template is used for Slack messages
           * @returns {*}
           */
          blocks: {
            private: ({ text = 'New appointment', extraText }) => {
              return new SlackTemplate()
                .divider()
                .section(`:book: *${text}*`)
                .section(this.client.fullName, `${ADMIN_URL}/accounts/${this.client.id}`)
                .timeRange(this.dateTime)
                .services(this.services.toString())
                .section(`:clipboard: Status: *${this.statusText}*`)
                .note(this.note)
                .section(extraText)
                .actions([
                  {
                    text: 'View/Modify',
                    value: `${ADMIN_URL}/waitingList/${this.id}`
                  }
                ])
                .divider()
                .template;
            },
            public: (text = 'New appointment') => {
              return new SlackTemplate()
                .divider()
                .section(`:book: *${text}*`)
                .section(this.client.fullName, `${ADMIN_URL}/accounts/${this.client.id}`)
                .timeRange(this.dateTime)
                .services(this.services.toString())
                .employees(this.employees.toString())
                .section(`:clipboard: Status: *${this.statusText}*`)
                .note(this.note)
                .actions([
                  {
                    text: 'View/Modify',
                    url: `${ADMIN_URL}/waitingList/${this.id}`
                  }
                ])
                .divider()
                .template;
            }
          }
        },
        /**
         * Returns slack template for updated waitingListRecords
         */
        update: {
          /**
           *  Used for mobile chat notification messages in Slack
           */
          text: {
            private: (text = 'Appointment updated') => {

              let dateTime = this.dateTime;

              if (!this.isOriginalTimeSameAsCurrent) {
                dateTime = `from ${this.originalRecord.dateTime} to ${dateTime}`
              }

              return `> ${text} ${this.client.fullName} ${dateTime}`
            },
            public: (text = 'Appointment updated') => {
              let dateTime = this.dateTime;
              if (!this.isOriginalTimeSameAsCurrent) {
                dateTime = `from ${this.originalRecord.dateTime} to ${dateTime}`
              }
              return `> ${text} ${this.client.fullName} ${dateTime}`
            },
          },
          /**
           * Template is used for Slack messages
           * @returns {*}
           */
          blocks: {
            private: ({ text = 'Appointment updated', extraText }) => {
              let dateTime = this.dateTime;
              if (!this.isOriginalTimeSameAsCurrent) {
                dateTime = `Updated from ${this.originalRecord.dateTime} to ${dateTime}`
              }
              return new SlackTemplate()
                .divider()
                .section(`:book: *${text}*`)
                .section(this.client.fullName, `${ADMIN_URL}/accounts/${this.client.id}`)
                .timeRange(dateTime)
                .services(this.services.toString())
                .note(this.note)
                .section(`:clipboard: Status: *${this.statusText}*`)
                .section(extraText)
                .actions([
                  {
                    text: 'View/Modify',
                    value: `${ADMIN_URL}/waitingList/${this.id}`
                  }
                ])
                .divider()
                .template;
            },
            public: (text = 'Appointment updated') => {
              let dateTime = this.dateTime;
              if (!this.isOriginalTimeSameAsCurrent) {
                dateTime = `Updated from ${this.originalRecord.dateTime} to ${dateTime}`
              }
              let employees = this.employees.toString();
              if (employees !== this.originalRecord.employees.toString()) {
                employees = `Updated from ${this.originalRecord.employees.toString()} to ${employees}`
              }
              return new SlackTemplate()
                .divider()
                .section(`:book: *${text}*`)
                .section(this.client.fullName, `${ADMIN_URL}/accounts/${this.client.id}`)
                .timeRange(dateTime)
                .services(this.services.toString())
                .employees(employees)
                .section(`:clipboard: Status: *${this.statusText}*`)
                .note(this.note)
                .actions([
                  {
                    text: 'View/Modify',
                    url: `${ADMIN_URL}/waitingList/${this.id}`
                  }
                ])
                .divider()
                .template;
            }
          }
        },
        /**
         * Returns slack template for canceled waitingListRecords
         */
        cancel: {
          /**
           *  Used for mobile chat notification messages in Slack
           */
          text: {
            private: (text = 'Appointment canceled') => {
              let dateTime = this.dateTime;
              return `x ${text} ${this.client.fullName} ${dateTime}`
            },
            public: (text = 'Appointment canceled') => {
              let dateTime = this.dateTime;
              return `x ${text} ${this.client.fullName} ${dateTime}`
            },
          },
          /**
           * Template is used for Slack messages
           * @returns {*}
           */
          blocks: {
            private: ({ text = 'Appointment canceled', extraText }) => {
              let dateTime = this.dateTime;
              return new SlackTemplate()
                .divider()
                .section(`:x: *${text}*`)
                .section(this.client.fullName, `${ADMIN_URL}/accounts/${this.client.id}`)
                .timeRange(dateTime)
                .services(this.services.toString())
                .section(`:clipboard: Status: *Canceled*`)
                .note(this.note)
                .section(extraText)
                .actions([
                  {
                    text: 'View/Modify',
                    value: `${ADMIN_URL}/waitingList/${this.id}`
                  }
                ])
                .divider()
                .template;
            },
            public: (text = 'Appointment canceled') => {
              let dateTime = `${this.startTime.format('MMM Do')} ${this.startTime.format('LT')} - ${ this.endTime.format('LT') }`;
              return new SlackTemplate()
                .divider()
                .section(`:x: *${text}*`)
                .section(this.client.fullName, `${ADMIN_URL}/accounts/${this.client.id}`)
                .timeRange(dateTime)
                .services(this.services.toString())
                .employees(this.employees.toString())
                .section(`:clipboard: Status: *Canceled*`)
                .note(this.note)
                .actions([
                  {
                    text: 'View/Modify',
                    url: `${ADMIN_URL}/waitingList/${this.id}`
                  }
                ])
                .divider()
                .template;
            }
          }
        },
      }
    }
  }

  async cancelClientEmailReminder() {
    const id = `${this.id}:email:reminder`;
    const reminder = await strapi.services.mq.get('services.email').getJob(id);
    if (reminder) {
      await reminder.remove();
    }
  }

  async addEmailRemindForClient() {
    const id = `${this.id}:email:reminder`;
    const priorTime = await strapi.services.config.get('appointments').key('sendReminderPriorTime');

    if (priorTime && priorTime.id) {
      await this.cancelClientEmailReminder();
      if (moment().unix() + priorTime.id < this.startTime.unix() - priorTime.id) {
        return this.client.notifications.email( await this.templates.email.reminder(), { delay: (this.startTime.unix() - moment().unix() - priorTime.id) * 1000, jobId: id } );
      }
    }
  }

  /**
   * Events that can be emitted by WaitingList Record
   * @returns {{playSound: (function(*=): *), setClients: (function(): *)}}
   */
  get events() {
    return {
      /**
       * Emits an event to frontend to pull WaitingLists from server
       * @returns {*}
       */
      setClients: () => strapi.io.sockets.emit('waitingList.setClients', true),
      /**
       * Emits an event to client to play sound notification
       * @param sound
       */
      playSound: sound => strapi.io.sockets.emit('notifications.sound.play', sound),
    }
  }

  /**
   * Object contains ways employees, devices and clients can be notified
   * @returns {{tv: tv, sound: (function(): *), slack: (function(): {new: new, update: update}), email: email}}
   */
  get notifications() {
    return {
      /**
       * Depending on Type plays different sound on frontend
       * @returns {Promise<*>}
       */
      sound: async () => {
        const config = await this.config.soundNotifications();
        let sound = _.get(config, 'walkIn.created');
        if (this.type === WAITING_LIST_TYPE_APPOINTMENT) {
          sound = _.get(config, 'appointment.created');
        }
        return this.events.playSound(sound);
      },
      /**
       * Shows current waitingList on TV screens
       * @returns {Promise<*|void>}
       */
      tv: async () => {
        const showOnTv = await this.config.showOnTv();
        if (showOnTv) {
          const showOnTvOnlyTodayRecords = await this.config.showOnTvOnlyTodayRecords();
          if (this.type === WAITING_LIST_TYPE_APPOINTMENT) {

            if (showOnTvOnlyTodayRecords && this.isSameDay) {
              return strapi.services.tv.showOnTv(this);
            } else if (!showOnTvOnlyTodayRecords) {
              return strapi.services.tv.showOnTv(this);
            }
          } else {
            return strapi.services.tv.showOnTv(this);
          }
        }
      },
      /**
       * Sends notification to public channel in Slack
       * @returns {{new: new, update: update}}
       */
      slack: () => ({
        new: async () => {
          if (!await this.config.isPublicSlackNotificationsEnabled()) return;
          if (this.type === WAITING_LIST_TYPE_APPOINTMENT) {
            return strapi.services.slack.channel('appointments').postMessage({
              text: this.templates.slack.new.text.public(),
              blocks: this.templates.slack.new.blocks.public(),
            })
          }
        },
        update: async () => {
          if(this.originalRecord) {
            if (!await this.config.isPublicSlackNotificationsEnabled()) return;
            if (this.type === WAITING_LIST_TYPE_APPOINTMENT) {
              return strapi.services.slack.channel('appointments').postMessage({
                text: this.templates.slack.update.text.public(),
                blocks: this.templates.slack.update.blocks.public(),
              })
            }
          }
        },
        cancel: async () => {
          if(this.originalRecord) {
            if (!await this.config.isPublicSlackNotificationsEnabled()) return;
            if (this.type === WAITING_LIST_TYPE_APPOINTMENT) {
              return strapi.services.slack.channel('appointments').postMessage({
                text: this.templates.slack.cancel.text.public(),
                blocks: this.templates.slack.cancel.blocks.public(),
              })
            }
          }
        },
      })
    }
  }
}

module.exports = WaitingListRecord;
