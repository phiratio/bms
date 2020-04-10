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
  client: true,
  // Keep in mind, routes are evaluated in order
  children: [
    {
      path: '/',
      client: true,
      title: 'Dashboard',
      load: () => import(/* webpackChunkName: 'home' */ './home'),
    },
    {
      path: '/appointments',
      title: 'Appointments',
      client: true,
      protected: true,
      children: [
        {
          path: '',
          stringContext: true,
          title: 'Appointments',
          client: true,
          protected: true,
          load: () =>
            import(/* webpackChunkName: 'appointments' */ './appointments'),
        },
        {
          path: '/:id',
          title: 'Appointment',
          protected: true,
          client: true,
          load: () =>
            import(/* webpackChunkName: 'appointments' */ './appointments'),
        },
      ],
    },
    {
      path: '/auth',
      title: 'Login',
      client: true,
      children: [
        {
          path: '/:provider/callback',
          title: 'Login',
          client: true,
          stringContext: true,
          load: () =>
            import(/* webpackChunkName: 'socialAuth' */ './socialAuth'),
        },
        {
          path: '/:provider/connect',
          title: 'Login',
          client: true,
          stringContext: true,
          load: () =>
            import(/* webpackChunkName: 'socialAuth' */ './socialAuth'),
        },
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
      path: '/login',
      title: 'Login',
      client: true,
      children: [
        {
          path: '',
          title: 'Login',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'login' */ './login'),
        },
        {
          path: '/:provider/callback',
          title: 'Login',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'login' */ './login'),
        },
        {
          path: '/:provider/connect',
          title: 'Login',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'login' */ './login'),
        },
      ],
    },
    {
      path: '/book',
      title: 'Appointment Booking',
      client: true,
      children: [
        {
          path: '',
          title: 'Appointment Booking',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/employees',
          title: 'Appointment Booking - Select Employees',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/date',
          title: 'Appointment Booking - Select Date',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/time',
          title: 'Appointment Booking - Select Time',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
        {
          path: '/summary',
          title: 'Appointment Booking - Summary',
          stringContext: true,
          client: true,
          load: () => import(/* webpackChunkName: 'book' */ './book'),
        },
      ],
    },
    {
      path: '/verify/:token',
      title: 'Login',
      client: true,
      load: () => import(/* webpackChunkName: 'login' */ './verify'),
    },
    {
      path: '/forgot',
      title: 'Forgot password ?',
      client: true,
      load: () => import(/* webpackChunkName: 'login' */ './forgot'),
    },
    {
      path: '/reset/:token',
      client: true,
      title: 'Reset password',
      load: () => import(/* webpackChunkName: 'login' */ './reset'),
    },
    {
      path: '/logout',
      client: true,
      title: 'Logout',
      load: () => import(/* webpackChunkName: 'login' */ './logout'),
    },
    {
      path: '/signup',
      client: true,
      title: 'Sign Up',
      load: () => import(/* webpackChunkName: 'signup' */ './signup'),
    },
    {
      path: '/profile',
      protected: true,
      client: true,
      title: 'Profile',
      children: [
        {
          path: '',
          protected: true,
          client: true,
          title: 'Profile',
          stringContext: true,
          load: () => import(/* webpackChunkName: 'profile' */ './profile'),
        },
      ],
    },
    {
      path: '/contacts',
      title: 'Contacts',
      client: true,
      load: () => import(/* webpackChunkName: 'contacts' */ './contacts'),
    },
    {
      path: '/terms',
      title: 'Terms & Conditions',
      client: true,
      load: () => import(/* webpackChunkName: 'terms' */ './terms'),
    },
    {
      path: '/app',
      title: 'Application Settings',
      client: true,
      load: () => import(/* webpackChunkName: 'app' */ './appSettings'),
    },
    {
      path: '/website',
      title: 'Back to Website',
      client: true,
      load: () => import(/* webpackChunkName: 'website' */ './website'),
    },
    {
      path: '/access-denied',
      title: 'Access Denied',
      client: true,
      load: () =>
        import(/* webpackChunkName: 'access-denied' */ './access-denied'),
    },
    {
      path: '(.*)',
      title: 'Page not found',
      client: true,
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
