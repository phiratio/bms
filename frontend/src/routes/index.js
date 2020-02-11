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
      load: () => import(/* webpackChunkName: 'waitingList' */ './waitingList'),
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
          load: () => import(/* webpackChunkName: 'accounts' */ './accounts'),
        },
        {
          path: '/add',
          title: 'Add account',
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
      load: () => import(/* webpackChunkName: 'login' */ './login'),
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
        {
          path: '/:provider/callback',
          title: 'Login',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'login' */ './login'),
        },
        {
          path: '/:provider/connect',
          title: 'Login',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'login' */ './login'),
        },
      ],
    },
    {
      path: '/book',
      title: 'Appointment Booking',
      children: [
        {
          path: '',
          title: 'Appointment Booking',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/employees',
          title: 'Appointment Booking - Select Employees',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/date',
          title: 'Appointment Booking - Select Date',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/time',
          title: 'Appointment Booking - Select Time',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/summary',
          title: 'Appointment Booking - Summary',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
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
      path: '/signup',
      title: 'Sign Up',
      load: () => import(/* webpackChunkName: 'signup' */ './signup'),
    },
    {
      path: '/profile',
      protected: true,
      title: 'Profile',
      load: () => import(/* webpackChunkName: 'profile' */ './profile'),
    },
    {
      path: '/settings',
      protected: true,
      title: 'Settings',
      load: () => import(/* webpackChunkName: 'settings' */ './settings'),
    },
    {
      path: '/pos',
      protected: true,
      title: 'Point of Sale',
      load: () => import(/* webpackChunkName: 'pos' */ './pos'),
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
      path: '/contacts',
      title: 'Contacts',
      load: () =>
        import(/* webpackChunkName: 'contacts' */ './contacts'),
    },
    {
      path: '/terms',
      title: 'Terms & Conditions',
      load: () =>
        import(/* webpackChunkName: 'terms' */ './terms'),
    },
    {
      path: '/website',
      title: 'Back to Website',
      load: () =>
        import(/* webpackChunkName: 'website' */ './website'),
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
      protected: true,
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
