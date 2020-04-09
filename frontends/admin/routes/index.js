/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/* eslint-disable global-require */
// The top-level (parent) route
const routes = {
  path: '',
  // Keep in mind, routes are evaluated in order
  children: [
    {
      path: '/',
      title: 'Dashboard',
      load: () => import(/* webpackChunkName: 'home' */ './home'),
    },
    {
      path: '/waitingList',
      protected: true,
      title: 'Waiting List',
      children: [
        {
          path: '',
          stringContext: true,
          protected: true,
          load: () =>
            import(/* webpackChunkName: 'waitingList' */ './waitingList'),
        },
        {
          path: '/:id',
          title: 'Update record',
          protected: true,
          children: [
            {
              path: '',
              protected: true,
              stringContext: true,
              load: () =>
                import(/* webpackChunkName: 'waitingList' */ './waitingList'),
            },
          ],
        },
      ],
    },
    {
      path: '/registration',
      title: 'Registration',
      protected: true,
      load: () =>
        import(/* webpackChunkName: 'registration' */ './registration'),
    },
    {
      path: '/accounts',
      title: 'Accounts',
      protected: true,
      children: [
        {
          path: '',
          stringContext: true,
          protected: true,
          children: [
            {
              path: '/clients',
              title: 'Clients',
              protected: true,
              children: [
                {
                  path: '',
                  stringContext: true,
                  protected: true,
                  load: () =>
                    import(/* webpackChunkName: 'accounts' */ './accounts'),
                },
                {
                  path: '/add',
                  title: 'Add Client',
                  stringContext: true,
                  protected: true,
                  load: () =>
                    import(/* webpackChunkName: 'accounts' */ './accounts'),
                },
                {
                  path: '/:id',
                  title: '{user}',
                  protected: true,
                  children: [
                    {
                      path: '',
                      protected: true,
                      stringContext: true,
                      load: () =>
                        import(/* webpackChunkName: 'accounts' */ './accounts'),
                    },
                    {
                      path: '/details',
                      title: 'Details',
                      protected: true,
                      stringContext: true,
                      load: () =>
                        import(/* webpackChunkName: 'accounts' */ './accounts'),
                    },
                  ],
                },
              ],
            },
            {
              path: '/employees',
              title: 'Employees',
              protected: true,
              children: [
                {
                  path: '',
                  stringContext: true,
                  protected: true,
                  load: () =>
                    import(/* webpackChunkName: 'accounts' */ './accounts'),
                },
                {
                  path: '/add',
                  title: 'Add Employee',
                  stringContext: true,
                  protected: true,
                  load: () =>
                    import(/* webpackChunkName: 'accounts' */ './accounts'),
                },
                {
                  path: '/:id',
                  title: '{user}',
                  protected: true,
                  children: [
                    {
                      path: '',
                      protected: true,
                      stringContext: true,
                      load: () =>
                        import(/* webpackChunkName: 'accounts' */ './accounts'),
                    },
                    {
                      path: '/details',
                      title: 'Details',
                      protected: true,
                      stringContext: true,
                      load: () =>
                        import(/* webpackChunkName: 'accounts' */ './accounts'),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          path: '',
          title: 'Accounts',
          stringContext: true,
          protected: true,
          load: () => import(/* webpackChunkName: 'accounts' */ './accounts'),
        },
        {
          path: '/all',
          title: 'All',
          stringContext: true,
          protected: true,
          load: () => import(/* webpackChunkName: 'accounts' */ './accounts'),
        },
        {
          path: '/add',
          title: 'Add Account',
          stringContext: true,
          protected: true,
          load: () => import(/* webpackChunkName: 'accounts' */ './accounts'),
        },
        {
          path: '/:id',
          title: '{user}',
          protected: true,
          children: [
            {
              path: '',
              protected: true,
              stringContext: true,
              load: () =>
                import(/* webpackChunkName: 'accounts' */ './accounts'),
            },
            {
              path: '/details',
              title: 'Details',
              protected: true,
              stringContext: true,
              load: () =>
                import(/* webpackChunkName: 'accounts' */ './accounts'),
            },
          ],
        },
      ],
    },
    {
      path: '/login',
      title: 'Login',
      children: [
        {
          path: '',
          title: 'Login',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'login' */ './login'),
        },
      ],
    },
    {
      path: '/verify/:token',
      title: 'Login',
      load: () => import(/* webpackChunkName: 'login' */ './verify'),
    },
    {
      path: '/forgot',
      title: 'Forgot password ?',
      load: () => import(/* webpackChunkName: 'login' */ './forgot'),
    },
    {
      path: '/reset/:token',
      title: 'Reset password',
      load: () => import(/* webpackChunkName: 'login' */ './reset'),
    },
    {
      path: '/logout',
      title: 'Logout',
      load: () => import(/* webpackChunkName: 'login' */ './logout'),
    },
    {
      path: '/profile',
      protected: true,
      title: 'Profile',
      children: [
        {
          path: '',
          protected: true,
          title: 'Profile',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'profile' */ './profile'),
        },
        {
          path: '/appointments',
          protected: true,
          stringContext: true,
          title: 'Appointments',
          children: [
            {
              path: '',
              protected: true,
              stringContext: true,
              title: 'Appointments',
              load: () =>
                import(/* webpackChunkName: 'waitingList' */ './waitingList'),
            },
            {
              path: '/add',
              protected: true,
              stringContext: true,
              title: 'Add Appointment',
              load: () =>
                import(/* webpackChunkName: 'waitingList' */ './waitingList'),
            },
            {
              path: '/:id',
              protected: true,
              stringContext: true,
              title: 'Update Appointment',
              load: () =>
                import(/* webpackChunkName: 'waitingList' */ './waitingList'),
            },
          ],
        },
        {
          path: '/calendar',
          protected: true,
          stringContext: true,
          title: 'Calendar',
          children: [
            {
              path: '',
              protected: true,
              stringContext: true,
              title: 'Calendar',
              load: () =>
                import(/* webpackChunkName: 'waitingList' */ './waitingList'),
            },
            {
              path: '/:id',
              protected: true,
              stringContext: true,
              title: 'Update Appointment',
              load: () =>
                import(/* webpackChunkName: 'waitingList' */ './waitingList'),
            },
          ],
        },
      ],
    },
    {
      path: '/auth',
      title: 'Login',
      client: true,
      children: [
        {
          path: '/verify',
          title: 'Verify your account',
          client: true,
          stringContext: true,
          load: () =>
            import(/* webpackChunkName: 'socialAuth' */ './socialAuth'),
        },
        {
          path: '/token/:token',
          title: 'Login',
          client: true,
          stringContext: true,
          load: () =>
            import(/* webpackChunkName: 'socialAuth' */ './socialAuth'),
        },
      ],
    },
    {
      path: '/settings',
      protected: true,
      title: 'Settings',
      load: () => import(/* webpackChunkName: 'settings' */ './settings'),
    },
    {
      path: '/tv',
      protected: true,
      title: 'Television',
      children: [
        {
          path: '',
          title: 'Television',
          stringContext: true,
          protected: true,
          load: () => import(/* webpackChunkName: 'tv' */ './tv'),
        },
        {
          path: '/search/',
          title: 'Search',
          stringContext: true,
          protected: true,
          load: () => import(/* webpackChunkName: 'tv' */ './tv'),
        },
        {
          path: '/:videoId',
          title: 'Video',
          stringContext: true,
          protected: true,
          load: () => import(/* webpackChunkName: 'tv' */ './tv'),
        },
      ],
    },
    {
      path: '/access-denied',
      title: 'Access Denied',
      load: () =>
        import(/* webpackChunkName: 'access-denied' */ './access-denied'),
    },
    // Wildcard routes, e.g. { path: '(.*)', ... } (must go last)
    {
      path: '(.*)',
      title: 'Page not found',
      load: () => import(/* webpackChunkName: 'not-found' */ './not-found'),
    },
  ],

  async action({ next }) {
    // Execute each child route until one of them return the result
    const route = await next();

    // Provide default values for title, description etc.
    route.title = `${route.title || 'Untitled Page'}`;
    route.description = route.description || '';

    return route;
  },
};

// The error page is available by permanent url for development mode
if (__DEV__) {
  routes.children.unshift({
    path: '/error',
    action: require('./error').default,
  });
}

export default routes;
