const io = require('socket.io')(strapi.server, { 'pingInterval': 4000, 'pingTimeout': 5000 });
const authentication = require('../utils').authentication;
const _ = require('lodash');
const semver = require('semver');
const appVersion = require('../../../package').version;
const { sanitizedUserEntry } = require('../../../api/utils/services/utils');
const { WAITING_LIST_TYPE_WALKINS, WAITING_LIST_TYPE_APPOINTMENT} = require('../../constants');

const APPEND_SEARCH_RESULTS = true;

/**
 * Socket.io Server
 */
module.exports = {
  /**
   * Socket.Io server initialization function
   * @returns {*}
   */
  server: () => {
    strapi.io = io; // Make socket.io server accessible globally
    return strapi.io.use(authentication)
      .on('connection', async socket => {
        const clientVersion = socket.state.version;
        strapi.log.debug('server.socket-io client %s with id %s connected', clientVersion, socket.id);
        if (semver.satisfies(clientVersion,`<${appVersion.slice(0,3)}.x`)) {
          socket.emit('client.update', true);
        }
        const role = socket.state.role;
        // Get permissions for a current user's role
        const permissions = await strapi.plugins['users-permissions'].models.permission.find({
          role,
          type: 'application',
        }, []);
        /**
         * Function that checks current user's role permissions
         * @param controller
         * @param action
         * @returns {boolean}
         */
        const can = (controller, action) => {
          const index = permissions.findIndex(el => {
            if (!action) return el.controller === controller && el.enabled === true;
            return el.controller === controller && el.action === action.toLowerCase() && el.enabled === true;
          });
          return index > -1;
        };

        /**
         * Based of user's role permissions populate left sidebar
         */
        const leftSidebar = [
          {  navId: 'nav-dashboard', name: 'Dashboard', url: '/', icon: 'icon-speedometer', intl: { id: 'Dashboard' } },
        ];
        /**
         * Based of user's role permissions populate aside
         */
        const aside = [];
        // can('appointments', 'services') && leftSidebar.push({ navId: 'nav-book', name: 'Book', url: '/book', icon: 'icon-calendar', intl: { id: 'Book' } });
        // can('pos') && leftSidebar.push({ navId: 'nav-pos', name: 'Point of Sale', url: '/pos', icon: 'icon-wallet', intl: { id: 'Point of Sale' } });
        can('waitinglist') && leftSidebar.push({ title: true, name: 'Waiting lists', intl: { id: 'Waiting lists' } });
        can('waitinglist', 'find') && leftSidebar.push({ navId: 'nav-waiting-list', name: 'All', url: '/waitingList', icon: 'icon-menu', intl: { id: 'Waiting lists' } });
        can('waitinglist', 'ownLists') && leftSidebar.push({ navId: 'nav-waiting-list', name: 'Personal', url: '/profile/appointments', icon: 'icon-clock', intl: { id: 'My Appointments' } });
        can('waitinglist', 'ownLists') && socket.state.acceptAppointments && leftSidebar.push({ navId: 'nav-waiting-list', name: 'Calendar', url: '/profile/calendar', icon: 'icon-calendar', intl: { id: 'Calendar' } });

        can('waitinglist', 'register') && leftSidebar.push({ title: true, name: 'Walk-Ins', intl: { id: 'Walk-Ins' } });
        can('waitinglist', 'register') && leftSidebar.push({ navId: 'nav-registration', name: 'Registration', url: '/registration', icon: 'icon-book-open', intl: { id: 'Registration' } });

        can('accounts') && leftSidebar.push({ title: true, name: 'Accounts', intl: { id: 'Accounts' } });
        can('accounts', 'getEmployees') && leftSidebar.push({ navId: 'nav-accounts', name: 'Employees', url: '/accounts/employees', icon: 'icon-user', intl: { id: 'Employees' } });
        can('accounts', 'getClients') && leftSidebar.push({ navId: 'nav-accounts', name: 'Clients', url: '/accounts/clients', icon: 'icon-user', intl: { id: 'Clients' } });
        can('accounts', 'find') && leftSidebar.push({ navId: 'nav-accounts', name: 'All Accounts', url: '/accounts/all', icon: 'icon-people', intl: { id: 'All Accounts' } });

        can('tv') && leftSidebar.push({ title: true, name: 'TV', intl: { id: 'TV' } });
        can('tv', 'getConfig') && leftSidebar.push({ navId: 'nav-television', name: 'Youtube', url: '/tv', icon: 'icon-screen-desktop', intl: { id: 'Youtube' },});

        can('settings') && leftSidebar.push({ title: true, name: 'Settings', intl: { id: 'Settings' } });
        can('settings', 'find') && leftSidebar.push({ navId: 'nav-settings', name: 'Settings', url: '/settings', icon: 'icon-settings', intl: { id: 'Settings' } });

        can('queue', 'getEmployees') && aside.push('queue');

        // Emit initial sidebar data and aside data after user's successful login
        await socket.emit('layout.data', { leftSidebar, aside, user: sanitizedUserEntry(socket.state) });

        if (can('tv')) {

          socket.on('tv.youtube.search', async query => {
            const searchResults = await strapi.services.youtube.search(query);
            strapi.services.redis.set(`accounts:${socket.state.id}:youtube:lastQuery`, { nextPageToken: searchResults.nextPageToken || '', query: query });
            strapi.services.redis.del(`accounts:${socket.state.id}:youtube:playingVideo`);
            socket.emit('tv.youtube.searchResults', searchResults);
          });

          socket.on('tv.youtube.search.more', async () => {
            const lastQuery = await strapi.services.redis.get(`accounts:${socket.state.id}:youtube:lastQuery`);
            if (lastQuery) {
              const searchResults = await strapi.services.youtube.search(lastQuery.query, 5, lastQuery.nextPageToken);
              await strapi.services.redis.set(`accounts:${socket.state.id}:youtube:lastQuery`, { nextPageToken: searchResults.nextPageToken || '', query: lastQuery.query });
              socket.emit('tv.youtube.searchResults.append', searchResults, APPEND_SEARCH_RESULTS);
            }
          });

          socket.on('tv.youtube.nextVideo', async currentPlayingVideo => {
            let playingVideo;
            playingVideo = await strapi.services.redis.get(`accounts:${socket.state.id}:youtube:playingVideo`);

            if (!playingVideo)
              playingVideo = currentPlayingVideo;
            if (_.get(playingVideo, 'id.videoId')) {
              const videoId = playingVideo.id.videoId;
              const searchResults = await strapi.services.youtube.getRelatedVideo(videoId, 2 , playingVideo.nextPageToken || null);
              if (!searchResults.nextPageToken) {
                strapi.services.redis.del(`accounts:${socket.state.id}:youtube:playingVideo`)
              } else {
                strapi.services.redis.set(`accounts:${socket.state.id}:youtube:playingVideo`, { ...playingVideo, ...{ nextPageToken: searchResults.nextPageToken, prevPageToken: searchResults.prevPageToken } });
              }
              if (Array.isArray(searchResults.items)) socket.emit('tv.youtube.setVideo', searchResults.items[0]);
              if (searchResults.error !== null && searchResults.error !== undefined) socket.emit('tv.youtube.error', searchResults.error);
            }
          });

          socket.on('tv.youtube.previousVideo', async youtubeVideoId => {
            let playingVideo;
            playingVideo = await strapi.services.redis.get(`accounts:${socket.state.id}:youtube:playingVideo`);

            if (_.get(playingVideo, 'id.videoId') && _.get(playingVideo, 'prevPageToken')) {
              const videoId = playingVideo.id.videoId;
              const searchResults = await strapi.services.youtube.getRelatedVideo(videoId, 2 , playingVideo.prevPageToken);
              strapi.services.redis.set(`accounts:${socket.state.id}:youtube:playingVideo`, { ...playingVideo, ...{ nextPageToken: searchResults.nextPageToken, prevPageToken: searchResults.prevPageToken } });

              if (Array.isArray(searchResults.items)) socket.emit('tv.youtube.setVideo', searchResults.items[0]);
              if (searchResults.error !== null && searchResults.error !== undefined) socket.emit('tv.youtube.error', searchResults.error);
            }
          });
        }

        if (can('waitinglist')) {
          /**
           * Gets configuration required for `Waiting List - Registration` page
           * @returns {Promise<{welcomeMessage: *, showTimeoutModal: *}>}
           */
          const getRegistrationConfig = async () => {
            const storeInfo = await strapi.services.config.get('general').key('storeInfo');
            const showTimeoutModal = await strapi.services.config.get('waitinglist').key('showTimeoutModal');
            return { welcomeMessage: `Welcome to ${storeInfo.name}`, showTimeoutModal  };
          };
          socket.join('waitingList');
          socket.emit('waitingList.setClients', true);
          socket.emit('waitingList.setTimeline', true);
          /**
           * Emits Initial configuration for `Registration` page
           */
          // socket.emit('waitinglist.registration.config', await getRegistrationConfig());
          socket.on('waitinglist.registration.init', async () => {
            socket.emit('waitinglist.registration.config', await getRegistrationConfig());
          });

          /**
           * Returns walkin visits of a specific user id
           * @param id objectId user id
           * @param meta object meta data
           */
          socket.on('waitingList.get.walkins', async (id, meta={}) => {
            const visits = await strapi.services.waitinglist.getVisits({
              user: id,
              type: WAITING_LIST_TYPE_WALKINS,
            }, meta, { createdAt: -1 }) || [];
            socket.emit(`waitingList.get.walkins.${id}`, visits);
          });

          /**
           * Returns appointments of a specific user id
           * @param id objectId user id
           * @param meta object meta data
           */
          socket.on('waitingList.get.appointments', async (id, meta={}) => {
            const visits = await strapi.services.waitinglist.getVisits({
              user: id,
              type: WAITING_LIST_TYPE_APPOINTMENT,
            }, meta, { createdAt: -1 }) || [];
            socket.emit(`waitingList.get.appointments.${id}`, visits);
          });

          /**
           * Returns clients of a specific employee
           * @param id objectId user id
           * @param meta object meta data
           */
          socket.on('waitingList.get.clients', async (id, meta={}) => {
            const clients = await strapi.services.waitinglist.getClients(id, meta, { createdAt: -1 }) || [];
            socket.emit(`waitingList.get.clients.${id}`, clients);
          });

          /**
           * Returns timeline information and services of employee on a certain date
           * @param id objectId user id
           * @param date Unix Timestamp
           */
          socket.on('waitingList.get.timelineAndServices', async (username, date, fn) => {
            if (username && date) {
              if (strapi.services.time.unix().startOfDay > date) {
                fn({
                  timeline: [],
                  // items:[],
                  // message: 'Selected date already past'
                });
              }
              const user = await strapi.services.accounts.fetch({ username });
              if (!user) return;
              const id = user.id;
             fn({
                timeline: await strapi.services.accounts.getTimeline(id, date),
                items: await strapi.services.accounts.getServices(id)
              })
            }
          });
          /**
           * Returns calendar events on a certain date and if specified for a certain employee
           * If not all events of all employees returned
           */
          socket.on('waitingList.calendar.events', async (timeStamp, employee, fn) => {
            fn(await strapi.services.appointments.calendar(employee, timeStamp));
          });

          if (can('waitinglist', 'changeDayStatus')) {
            socket.on('waitingList.calendar.changeDayStatus', async (employeeId, timestamp, status) => {
              console.log('tim', timestamp, status);
              if (status === true) await strapi.services.appointments.openDay(employeeId, timestamp);
              else await strapi.services.appointments.closeDay(employeeId, timestamp);
              strapi.io.sockets.emit('waitingList.setClients', true);
              await strapi.services.appointments.changeDayStatus(employeeId, timestamp, status);
            });
          }

          if (can('waitinglist', 'changeOwnDayStatus')) {
            socket.on('waitingList.calendar.changeOwnDayStatus', async (timestamp, status) => {
              const id = _.get(socket, 'state.id');
              if (status === true) await strapi.services.appointments.openDay(id, timestamp);
              else await strapi.services.appointments.closeDay(id, timestamp);
              strapi.io.sockets.emit('waitingList.setClients', true);
            });
          }
        }

        if (can('queue')) {
          socket.join('queue');
          if (can('queue', 'getEmployees')) socket.emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
          /**
           * Emits `queue.setEmployees` on event `queue.setEmployees`
           */
          socket.on('queue.getEmployees', async () => socket.emit('queue.setEmployees', await strapi.controllers.queue.getEmployees()));

          /**
           * Toggle status of specified employee and emits list of employees
           * @param {number} id Employee identification number
           */
          socket.on('queue.toggleStatus', async id => {
            if (!can('queue', 'toggleStatus')) return;
            await strapi.controllers.queue.toggleStatus(id);
            io.sockets.in('queue').emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
            io.sockets.in('queue').emit('queue.flashEmployee', id);

          });
          /**
           * Move employee from one position to another and emits list of employees
           * @param {object} element Contains id. source and destination objects
           */
          socket.on('queue.moveEmployee', async element => {
            if (!can('queue', 'moveEmployee')) return;
            if (element.id || element.draggableId) {
              if (element.source && element.destination) {
                // move item to specified position
                await strapi.controllers.queue.moveEmployee(element);
              } else {
                // move item to list`s end
                await strapi.controllers.queue.moveEmployeeToListEnd(element);
              }
            }
            // get list and emit
            const listOfEmployees = await strapi.controllers.queue.getEmployees();
            io.sockets.in('queue').emit('queue.setEmployees', listOfEmployees);
            io.sockets.in('queue').emit(
              'queue.flashEmployee',
              element.draggableId || element.id,
            );
          });
          /**
           * Enable employee and emits list of employees
           * @param {number} id Contain employee identification number
           */
          socket.on('queue.enableEmployee', async id => {
            if (!can('queue', 'enableEmployee')) return;
            if (id) {
              await strapi.controllers.queue.enableEmployee(id);
              io.sockets.in('queue').emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
              io.sockets.in('queue').emit('queue.flashEmployee', id);
            }
          });
          /**
           * Disable employee and emits list of employees
           * @param {number} id Contain employee identification number
           */
          socket.on('queue.disableEmployee', async id => {
            if (!can('queue', 'disableEmployee')) return;
            if (id) {
              await strapi.controllers.queue.disableEmployee(id);
              io.sockets.in('queue').emit('queue.setEmployees', await strapi.controllers.queue.getEmployees());
            }
          });

        }

        /**
         * Event that fires on user's disconnect
         */
        socket.on('disconnect', async () => {
          // delete socket connection from redis
          await strapi.connections.redis.del(`accounts:${socket.state.id}:sockets:${socket.id}`);
          strapi.log.debug('server.socket-io client with id %s disconnected', socket.id);
        });
      });
  }
};
