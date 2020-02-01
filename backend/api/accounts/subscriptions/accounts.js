'use strict';

const _ = require('lodash');
const { EMPLOYEES_DISABLED_LIST } = require('../../constants');


module.exports = {
  initialize: () => {
    /**
     * Event Emitter subscription: Invokes when a user created
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.create', async user => {
      strapi.log.info('accounts.create Account created: %s %s', user.firstName, user.lastName);
      // create a helper property `id`
      await strapi.services.accounts.update({ _id: user._id }, { id: String(user._id) });

      if (!user.blocked && await strapi.services.accounts.isEmployeeRole(user.role.name)) {
        strapi.services.eventemitter.emit('queue.add', user);

        // Refresh slack ids if account is employee
        if (user.email) {
          await strapi.services.slack.assignSlackIdsToAccounts();
        }
      }

      await strapi.services.accounts.cache.clear({ id: user.id });
      await strapi.services.accounts.cache.update();

    });

    /**
     * Event Emitter subscription: Invokes when a user updated
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.update', async user => {
      strapi.log.info('accounts.update Account updated: %s %s', user.firstName, user.lastName);
      if (!user.blocked && await strapi.services.accounts.isEmployeeRole(user.role.name)) {
        strapi.services.eventemitter.emit('queue.update', user);
        // Refresh slack ids
        if (user.email && (user.email !== _.get(user, 'original.email')) && !user.slackId) {
          await strapi.services.slack.assignSlackIdsToAccounts();
        }
      } else {
        strapi.services.eventemitter.emit('queue.remove', user);
      }
      // Disconnect active sockets if role has changed
      if (_.get(user, 'original.role.name') !== user.role.name) {
        strapi.services.eventemitter.emit('accounts.sockets.delete', user.id);
      }

      strapi.services.eventemitter.emit('queue.setEmployee');
      await strapi.services.accounts.cache.clear({ id: user.id });
      await strapi.services.accounts.cache.update();

    });

    /**
     * Event Emitter subscription: Invokes when a user removed
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.remove', async user => {
      strapi.services.eventemitter.emit('queue.remove', user);
      strapi.services.eventemitter.emit('accounts.sockets.delete', user.id);
      await strapi.services.accounts.cache.clear({ id: user.id });
      await strapi.services.accounts.cache.update();
    });

    /**
     * Event Emitter subscription: Gets user's socket.io ids from Redis and disconnects them
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.sockets.delete', async userId => {
      try {
        const sockets = await strapi.services.utils.getSockets(userId);
        if (sockets.size !== 0) {
          sockets.forEach(el => {
            const socketId = el.split(':')[3];
            strapi.io.sockets.connected[socketId].disconnect();
          });
        }
      } catch (e) {
        strapi.log.error('accounts.socket.delete.subscription', e.message);
      }
    });

    /**
     * Event Emitter subscription: Makes multiple actions when user uploads an avatar
     * @param ctx Koa context object
     * @param avatar Uploaded avatar object supplied to event
     */
    strapi.services.eventemitter.on('accounts.avatar.upload', async (account, ctx) => {
      const currentUser = ctx.state.user;
      // const contextAccount = await strapi.services.accounts.fetch({ id: _.get(ctx, 'request.body.refId') });
      // Update employee avatar in `Queue` module
      if (await strapi.services.accounts.isEmployeeRole(account.role.name)) {
        strapi.services.eventemitter.emit('queue.update', account);
      }

      // If user updating its own profile then emit new avatar to every connected socket
      if (currentUser.id === account.id) {
        strapi.services.eventemitter.emit('accounts.avatar.self.update', account);
      }

      await strapi.services.accounts.cache.clear({ id: account.id });
      await strapi.services.accounts.cache.update();

    });

    /**
     * Event Emitter subscription: Makes multiple actions when user clears an avatar
     * @param ctx Koa context
     * @param avatar Deleted avatar object supplied to event
     */
    strapi.services.eventemitter.on('accounts.avatar.clear', async (account, ctx) => {
      // currently logged in user
      const currentUser = ctx.state.user;

      if (await strapi.services.accounts.isEmployeeRole(account.role.name)) {
        strapi.services.eventemitter.emit('queue.update', account);
      }

      // If user updating its own profile then emit new avatar to every connected socket
      if (currentUser.id === account.id) {
        strapi.services.eventemitter.emit('accounts.avatar.self.update', account);
      }

      await strapi.services.accounts.cache.clear({ id: account.id });
      await strapi.services.accounts.cache.update();

    });

    strapi.services.eventemitter.on('accounts.avatar.self.update', async (account) => {
      try {
        const sockets = await strapi.services.utils.getSockets(account.id);
        if (sockets.size !== 0) {
          sockets.forEach(el => {
            const socketId = el.split(':')[3];
            strapi.io.sockets.connected[socketId].emit('layout.data', { user: { avatar: account.avatar } });
          });
        }
      } catch (e) {
        strapi.log.error('accounts.avatar.clear ', e.message)
      }
    });

  },
};
