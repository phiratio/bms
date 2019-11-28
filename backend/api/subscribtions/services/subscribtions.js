/**
 * Subscriptions.js
 * Project async tasks that run when certain events emitted
 */
const _ = require('lodash');
const { EMPLOYEES_DISABLED_LIST } = require('../../constants');

module.exports = {
  initialize: () => {

    /**
     * Event Emitter subscriptions
     */
    /**
     * Event Emitter subscription: Event fires when waitingList record has been created
     * @param ctx Koa context
     * @param record Waitinglist object
     */
    strapi.services.eventemitter.on('waitinglist.create', async (ctx, record) => {
      strapi.log.info('waitinglist.create Waitinglist created: %s %s', _.get(record, 'user.firstName'), _.get(record, 'user.lastName'), record);
      const registrationConfig = await strapi.services.config.get('waitinglist').key('registration');
      const showOnTv = await strapi.services.config.get('waitinglist').key('showOnTv');
      strapi.io.sockets.emit('waitingList.setClients', true);
      strapi.io.sockets.emit('notifications.sound.play', registrationConfig.sound.success);

      if (showOnTv) {
        const object = {
          user: {
            firstName: _.get(record, 'user.firstName'),
            lastName: _.get(record, 'user.lastName'),
            avatar: _.get(record, 'user.avatar'),
            email: _.get(record, 'user.email'),
          },
          employees: record.employees.map(el => ({ username: el.username })),
        };
        strapi.io.sockets.emit('tv.show.waitinglist.new', object);
      }

    });

    /**
     * Event Emitter subscription: Invokes when a user created
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.create', async user => {
      strapi.log.info('accounts.create Account created: %s %s', user.firstName, user.lastName, user);
      await strapi.services.accounts.update({ _id: user._id }, { id: String(user._id) });
      if (!user.blocked && await strapi.services.accounts.isEmployeeRole(user.role.name)) {
        await strapi.controllers.queue.addToCache(user, EMPLOYEES_DISABLED_LIST);
        strapi.io.sockets.emit(
          'queue.setEmployees',
          await strapi.controllers.queue.getEmployees(),
        );
      }
    });

    /**
     * Event Emitter subscription: Invokes when a user updated
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.update', async user => {
      strapi.log.info('accounts.update Account updated: %s %s', user.firstName, user.lastName, user);
      if (!user.blocked && await strapi.services.accounts.isEmployeeRole(user.role.name)) {
        await strapi.controllers.queue.updateCache(user);
      } else {
        await strapi.controllers.queue.removeFromCache(user);
      }
      // Disconnect active sockets if role has changed
      if (_.get(user.oldRole, '_doc.role.name') !== user.role.name) {
        strapi.services.eventemitter.emit('accounts.sockets.delete', user.id);
      }
      strapi.io.sockets.emit(
        'queue.setEmployees',
        await strapi.controllers.queue.getEmployees(),
      );
    });

    /**
     * Event Emitter subscription: Invokes when a user removed
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.remove', async user => {
      await strapi.controllers.queue.removeFromCache(user);
      strapi.services.eventemitter.emit('accounts.sockets.delete', user.id);
      strapi.io.sockets.emit(
        'queue.setEmployees',
        await strapi.controllers.queue.getEmployees(),
      );
    });

    /**
     * Event Emitter subscription: Gets user's socket.io ids from Redis and disconnects them
     * @param userId User Id
     */
    strapi.services.eventemitter.on('accounts.sockets.delete', async userId => {
      try {
        const sockets = await strapi.services.utils.getSockets(userId);
        if (sockets.size !== 0) {
          sockets.forEach(async el => {
            const socketId = el.split(':')[3];
            await strapi.io.sockets.connected[socketId].disconnect();
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
    strapi.services.eventemitter.on('accounts.avatar.upload', async (ctx, avatar) => {
      const currentUser = ctx.state.user;
      const contextAccount = await strapi.services.accounts.fetch({ id: _.get(ctx, 'request.body.refId') });
      // Update employee avatar in `Queue` module
      if (await strapi.services.accounts.isEmployeeRole(contextAccount.role.name)) {
        await strapi.controllers.queue.updateCache(contextAccount);
        strapi.io.sockets.emit(
          'queue.setEmployees',
          await strapi.controllers.queue.getEmployees(),
        );
      }

      // If user updating its own profile then emit new avatar to every connected socket
      if (currentUser.id === contextAccount.id) {
        try {
          const sockets = await strapi.services.utils.getSockets(currentUser.id);
          if (sockets.size !== 0) {
            sockets.forEach(async el => {
              const socketId = el.split(':')[3];
              await strapi.io.sockets.connected[socketId].emit('layout.data', { user: { avatar: contextAccount.avatar } });
            });
          }
        } catch (e) {
          strapi.log.error('accounts.avatar.upload.subscription', e.message);
        }
      }

    });

    /**
     * Event Emitter subscription: Makes multiple actions when user clears an avatar
     * @param ctx Koa context
     * @param avatar Deleted avatar object supplied to event
     */
    strapi.services.eventemitter.on('accounts.avatar.clear', async (ctx, avatar) => {
      const currentUser = ctx.state.user;
      const contextAccount = await strapi.services.accounts.fetch({ id: _.get(ctx, 'params.id') });

      if (await strapi.services.accounts.isEmployeeRole(contextAccount.role.name)) {
        await strapi.controllers.queue.updateCache( {id: contextAccount._id, username: contextAccount.username, avatar: '', fullName: `${contextAccount.firstName} ${contextAccount.lastName}` } );
        strapi.io.sockets.emit(
          'queue.setEmployees',
          await strapi.controllers.queue.getEmployees(),
        );
      }

      // If user updating its own profile then emit new avatar to every connected socket
      if (currentUser.id === contextAccount.id) {
        try {
          const sockets = await strapi.services.utils.getSockets(currentUser.id);
          if (sockets.size !== 0) {
            sockets.forEach(async el => {
              const socketId = el.split(':')[3];
              await strapi.io.sockets.connected[socketId].emit('layout.data', { user: { avatar: contextAccount.avatar } });
            });
          }
        } catch (e) {
          strapi.log.error('accounts.avatar.clear ', e.message)
        }
      }

    });

    /**
     * Message broker subscriptions
     */

    /**
     * Message broker subscription: invoked when email review request was sent successfully
     */
    // strapi.services.messagebroker.subscribe('email:request-review-success', async data => {
    //   await strapi
    //     .plugins['users-permissions']
    //     .services
    //     .user
    //     .edit({ id: data.id }, { reviewRequested: true });
    // });

    /**
     * Message broker subscription: invoked when error event occurs if email review request
     * was not sent successfully
     */
    // strapi.services.messagebroker.subscribe('email:request-review-error', async data => {
    //   // Customer email id is invalid
    //   await strapi
    //     .plugins['users-permissions']
    //     .services
    //     .user
    //     .edit({ id: data.id }, { email: null });
    // });
  }
};
