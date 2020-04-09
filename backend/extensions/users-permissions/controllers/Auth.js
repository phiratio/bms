'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require('crypto');
const _ = require('lodash');
const grant = require('grant-koa');
const { sanitizeEntity } = require('strapi-utils');
const { HOUR_1 } = require('../../../api/constants');

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];
const { sanitizedUserEntry } = require('../../../api/utils/services/utils');
const User = require('../../../api/accounts/classes/User');
const forgotPasswordTemplate = require('../../../api/accounts/classes/ForgotPassworEmailTemplate');

module.exports = {
  sendSMS: async ctx => {
    if (!await strapi.services.config.get('accounts').key('mobilePhoneVerification')) {
      return {
        enabled: false,
      }
    }
    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .mobilePhone('mobilePhone', { unique: true })
      .string('recaptchaToken', { max: 700, regex:  /[A-Za-z-0-9_]/ })
      .result()
      .then(async values => {
        const { mobilePhone, recaptchaToken } = values;

        const sendSms = await strapi.services.sms.send({
          phoneNumber: mobilePhone,
          recaptchaToken,
        });

        if (sendSms.status !== 200) {
          switch(sendSms.message) {
            case 'TOO_MANY_ATTEMPTS_TRY_LATER':
              return ctx.badRequest(null, 'Too many attempts try again later');
            default:
              return ctx.badRequest(null, _.get(sendSms, 'statusText.errors'));
          }
        }

        await strapi.services.sms.saveSession({ phoneNumber: mobilePhone, sessionInfo: sendSms.data.sessionInfo });

        return {
          status: sendSms.status,
          sent: true,
        };
      })
      .catch(e => {
        if (e.message) strapi.log.error('auth.sendSMS Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        if (e.errors) {
          return ctx.badRequest(null, { errors: e.errors });
        }
        return ctx.badRequest(null, e);
      });

  },
  async isExists(ctx) {
    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .email( { mxValidation: true, checkBlacklists: true })
      .result()
      .then(async data => {
        const account = await strapi.services.accounts.fetch({ email: data.email });
        if (account) return { exists: true };
        return { exists: false };
      })
      .catch(e => {
        if (e.message) strapi.log.error('auth.isExist Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },

  async isResetTokenValid(ctx) {
    return strapi
      .services
      .joi
      .validate(ctx.params)
      .string('token', { optional: false, sanitize: true, min:128, max: 128, regex: /[A-Za-z0-9]$/})
      .result()
      .then(async data => {
        const resetAccount = await strapi.services.redis.get(`accounts:resetTokens:${data.token}`);
        if (resetAccount) return { exists: true };
        return { exists: false };
      })
      .catch(e => {
        if (e.message) strapi.log.error('auth.isExist Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        return ctx.badRequest(null, e);
      });
  },


  async callback(ctx) {
    if (!await strapi.services.config.get('accounts').key('signIn')) {
      return {
        enabled: false,
        errors: {
          form:  'Sign In action is temporarily unavailable'
        }
      }
    }
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;

    const store = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    if (provider === 'local') {
      if (!_.get(await store.get({ key: 'grant' }), 'email.enabled')) {
        return ctx.badRequest(null, {
          errors: {
            form: 'This provider is disabled'
          }
        });
      }

      // The identifier is required.
      if (!params.identifier) {
        return ctx.badRequest(
          null,
          {
            errors: {
              identifier: 'Please provide your username or your e-mail'
            }
          },
        );
      }

      // The password is required.
      if (!params.password) {
        return ctx.badRequest(
          null,
          {
            errors: {
              password: 'Please provide your password'
            }
          },
        );
      }

      const query = {};

      // Check if the provided identifier is an email or not.
      const isEmail = emailRegExp.test(params.identifier);

      // Set the identifier to the appropriate query field.
      if (isEmail) {
        query.email = params.identifier.toLowerCase();
      } else {
        query.username = params.identifier;
      }

      // Check if the user exists.
      const user = await strapi
        .query('user', 'users-permissions')
        .findOne(query);

      if (!user) {
        return ctx.badRequest(
          null,
          {
            errors: {
              form: 'Identifier or password invalid'
            }
          }
        );
      }

      if (user.confirmed !== true) {
        return ctx.badRequest(
          null,
          {
            errors: {
              form: 'Your account is not confirmed'
            }
          },
        );
      }

      if (
        _.get(await store.get({ key: 'advanced' }), 'email_confirmation') &&
        user.confirmed !== true
      ) {
        return ctx.badRequest(
          null,
          {
            errors: {
              form:  'Your account email is not confirmed'
            }
          },
        );
      }

      if (user.blocked === true) {
        return ctx.badRequest(
          null,
          {
            errors: {
              form: 'Your account has been blocked by an administrator'
            }
          },
        );
      }

      // The user never authenticated with the `local` provider.
      if (!user.password) {
        return ctx.badRequest(
          null,
          {
            errors: {
              form: 'This user never set a local password, please login using the provider you used during account creation',
            }
          },
        );
      }

      const validPassword = strapi.plugins[
        'users-permissions'
      ].services.user.validatePassword(params.password, user.password);

      if (!validPassword) {
        return ctx.badRequest(
          null, {
            errors: {
              form: 'Identifier or password invalid'
            }
          }
        );
      } else {
        ctx.send({
          jwt: strapi.plugins['users-permissions'].services.jwt.issue({
            id: user.id,
          }),
          user: sanitizedUserEntry(user),
        });
      }
    } else {
      if (!_.get(await store.get({ key: 'grant' }), [provider, 'enabled'])) {
        return ctx.badRequest(
          null,
          {
            errors: {
              form: 'This provider is disabled'
            }
          },
        );
      }
      if (!_.get(ctx, 'query.access_token')) {
        return ctx.badRequest(null, {
          errors: {
            form: 'Access token was not provided',
          }
        })
      }

      let user, error;
      try {
        [user, error] = await strapi.plugins[
          'users-permissions'
          ].services.providers.connect(provider, ctx.query);
      } catch ([user, error]) {
        return ctx.badRequest(null, error === 'array' ? error[0] : error);
      }

      if (!_.isEmpty(error)) {
        return ctx.badRequest(null, error);
      }

      if (_.get(user, 'confirmed')) {
        return {
          jwt: strapi.plugins['users-permissions'].services.jwt.issue({
            id: user.id,
          }),
          user: sanitizedUserEntry(user),
        }
      }

      const mobilePhoneVerification = await strapi.services.config.get('accounts').key('mobilePhoneVerification');

      if (mobilePhoneVerification && !_.get(ctx, 'query.mobilePhone') && !_.get(ctx,'query.verificationCode')) {
        return {
          mobilePhoneVerification: true,
        }
      } else if (!mobilePhoneVerification && !_.get(ctx, 'query.mobilePhone')) {
        return {
          mobilePhoneVerification: true,
        }
      }

      return strapi
        .services
        .joi
        .validate(ctx.query)
        .mobilePhone('mobilePhone', { unique: true, optional: !mobilePhoneVerification })
        .number('verificationCode', { integer: true, min: 10000, max: 99999999, positive: true, optional: !mobilePhoneVerification, error: 'Invalid verification code' })
        .result()
        .then(async values => {

          if (mobilePhoneVerification) {
            const verification = await strapi.services.sms.verify(values);
            if (verification.code !== 200) {
              return ctx.badRequest(null, {
                errors: {
                  verificationCode: {
                    msg: verification.msg || 'Unable to verify mobile phone',
                    param: 'verificationCode',
                  }
                }
              })
            }
          }

          let additionalAccountInfo = {
            confirmed: true,
            ...values.mobilePhone && { mobilePhone: values.mobilePhone }
          };

          if (_.get(user, 'id')) {
            await strapi.services.accounts.update({ id: user.id  }, additionalAccountInfo)
          } else {
            // Connect the user thanks to the third-party provider.
            try {
              [user, error] = await strapi.plugins[
                'users-permissions'
                ].services.providers.connect(provider, ctx.query, additionalAccountInfo);
            } catch ([user, error]) {
              return ctx.badRequest(null, error === 'array' ? error[0] : error);
            }
          }

          if (!user) {
            return ctx.badRequest(null, error === 'array' ? error[0] : error);
          }

          return {
            jwt: strapi.plugins['users-permissions'].services.jwt.issue({
              id: user.id,
            }),
            user: sanitizedUserEntry(user),
          }

        }).catch(e => {
          if (e.message) strapi.log.error('auth.callback Error: %s', e.message);
          if (e instanceof TypeError) return ctx.badRequest(null, e.message);
          if (e.errors) {
            return ctx.badRequest(null, { errors: e.errors });
          }
          return ctx.badRequest(null, e);
        });
    }
  },

  async changePassword(ctx) {
    if (!await strapi.services.config.get('accounts').key('forgotPassword')) {
      return {
        enabled: false,
        notifications: {
          flash: {
            msg:  'Password recovery action is temporarily unavailable',
            type: 'error',
          }
        }
      }
    }
    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .password()
      .string('token', { optional: false, sanitize: true, min:128, max: 128, regex: /[A-Za-z0-9]$/})
      .result()
      .then(async values => {
        const userId = await strapi.services.redis.get(`accounts:resetTokens:${values.token}`);

        if (!userId) {
          return {
            notifications: {
              flash: {
                msg: 'Token expired',
                type: 'error',
              }
            }
          }
        }

        const password = await strapi.plugins[
          'users-permissions'
          ].services.user.hashPassword(values);

        // Update the user.
        const updatedUser = await strapi
          .query('user', 'users-permissions')
          .update({ id: userId }, { password });

        await strapi.services.redis.del(`accounts:resetTokens:${values.token}`);

        ctx.send({
          jwt: strapi.plugins['users-permissions'].services.jwt.issue({
            id: userId,
          }),
          user: sanitizedUserEntry(updatedUser),
        });

      })
      .catch(e => {
        if (e.message) strapi.log.error('auth.register Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        if (e.errors) {
          return ctx.badRequest(null, { errors: e.errors });
        }
        return ctx.badRequest(null, e);
      });
  },

  async connect(ctx, next) {
    const grantConfig = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'grant',
      })
      .get();

    let [protocol, host] = strapi.config.url.split('://');

    if (process.env.BACKEND_PROXY_HOST) {
      [protocol, host] = process.env.BACKEND_PROXY_HOST.split('://');
    }
    _.defaultsDeep(grantConfig, { server: { protocol, host } });

    const provider =
      process.platform === 'win32'
        ? ctx.request.url.split('\\')[2]
        : ctx.request.url.split('/')[2];
    const config = grantConfig[provider];

    if (!_.get(config, 'enabled')) {
      return ctx.badRequest(null, 'This provider is disabled.');
    }
    // Ability to pass OAuth callback dynamically
    grantConfig[provider].callback =
      ctx.query && ctx.query.callback
        ? ctx.query.callback
        : grantConfig[provider].callback;
    return grant(grantConfig)(ctx, next);
  },

  async forgotPassword(ctx) {

    if (!await strapi.services.config.get('accounts').key('forgotPassword')) {
      return {
        enabled: false,
        errors: {
          form:  'Password recovery action is temporarily unavailable'
        }
      }
    }

    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .email({ mxValidation: true, checkBlacklists: true })
      .result()
      .then(async values => {

        const { email } = values;

        // Find the user user thanks to his email.
        const account = await strapi
          .query('user', 'users-permissions')
          .findOne({ email });

        // User found.
        if (account && !account.blocked) {
          const user = new User(account);
          // Generate random token.
          const resetPasswordToken = crypto.randomBytes(64).toString('hex');
          await strapi.services.redis.set(`accounts:resetTokens:${resetPasswordToken}`, user.id, 'EX', HOUR_1);
          user.notifications.email(await forgotPasswordTemplate({ user, url: `${process.env.FRONTEND_BOOKING_URL}/reset/${resetPasswordToken}` } ));
        }

        ctx.send({
          notifications: {
            flash: { msg: 'If there is an account associated with email address you will receive an email with a link to reset your password', type: 'success' }
          }
        });

      }).catch(e => {
        if (e.message) strapi.log.error('auth.register Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        if (e.errors) {
          return ctx.badRequest(null, { errors: e.errors });
        }
        return ctx.badRequest(null, e);
      });
  },

  async register(ctx) {
    if (!await strapi.services.config.get('accounts').key('signUp')) {
      return {
        enabled: false,
        errors: {
          form:  'Sign Up action is temporarily unavailable'
        }
      }
    }
    const mobilePhoneVerification = await strapi.services.config.get('accounts').key('mobilePhoneVerification');
    return strapi
      .services
      .joi
      .validate(ctx.request.body)
      .string('firstName', { label: 'First Name', startCase: true })
      .string('lastName', { label: 'Last Name', startCase: true })
      .email( { unique: true, mxValidation: true, checkBlacklists: true })
      .password({ optional: false })
      .mobilePhone('mobilePhone', { unique: true })
      .string('verificationCode', { max: 10, regex: /[0-9]+/, optional: !mobilePhoneVerification, error: 'Invalid verification code' })
      .result()
      .then(async values => {
        // Throw an error if the password selected by the user
        // contains more than two times the symbol '$'.
        if (
          strapi.plugins['users-permissions'].services.user.isHashed(
            values.password
          )
        ) {
          return ctx.badRequest(
            null,
            {
              errors: {
                password:  'Your password cannot contain more than three times the symbol `$`'
              }
            }
          );
        }

        // If phone verification is disabled, mark account as verified
        if (!mobilePhoneVerification) {
          values.confirmed = true;
        } else {
          const verification = await strapi.services.sms.verify(values);

          if (verification.code === 200) {
            values.confirmed = true;
          } else {
            return ctx.badRequest(null, {
              errors: {
                verificationCode: {
                  msg: 'Unable to verify mobile phone',
                  param: 'verificationCode',
                }
              }
            })
          }

        }
        const defaultRoleName = await strapi.services.config.defaultRoleName();

        const role = await strapi
          .query('role', 'users-permissions')
          .findOne({ type: defaultRoleName }, []);

        if (!role) {
          return ctx.badRequest(
            null,
            {
              errors: {
                form:  'Impossible to find the default role'
              }
            },
          );
        }

        values.role = role.id;

        return strapi
          .plugins['users-permissions']
          .services
          .user
          .add(values)
          .then(async user => {
            strapi.services.eventemitter.emit('accounts.create', { ...user, role: {...role._doc} });

              const jwt = strapi.plugins['users-permissions'].services.jwt.issue(
                _.pick(user.toJSON ? user.toJSON() : user, ['id'])
              );

              return {
                jwt,
                user: sanitizedUserEntry(user),
              };
          });

      }).catch(e => {
        if (e.message) strapi.log.error('auth.register Error: %s', e.message);
        if (e instanceof TypeError) return ctx.badRequest(null, e.message);
        if (e.errors) {
          return ctx.badRequest(null, { errors: e.errors });
        }
        return ctx.badRequest(null, e);
      });
  },

  async emailConfirmation(ctx) {
    const params = ctx.query;

    const decodedToken = await strapi.plugins[
      'users-permissions'
    ].services.jwt.verify(params.confirmation);

    await strapi.plugins['users-permissions'].services.user.edit(
      { id: decodedToken.id },
      { confirmed: true }
    );

    const settings = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    ctx.redirect(settings.email_confirmation_redirection || '/');
  },
};
