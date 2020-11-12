/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter from 'universal-router';
import pathToRegexp from 'path-to-regexp';
import get from 'lodash.get';
import React from 'react';
import routes from './routes';
import { loggedIn, replaceParam } from '../../core/utils';
import { setBreadcrumbs } from '../../actions/breadcrumbs';

export default new UniversalRouter(routes, {
  resolveRoute(context, params) {
    const { path } = context.route;

    if (context.route.title && !context.route.stringContext) {
      context.title = context.intl.formatMessage({
        id: context.route.title,
        defaultMessage: context.route.title,
      });
    }
    context.location = { pathname: replaceParam(context.route, params) };
    if (
      process.env.BROWSER &&
      loggedIn(context.store.getState().user) &&
      path !== '/logout' &&
      path !== '/login' &&
      path !== '/forgot' &&
      !/\/auth/.test(path) &&
      !pathToRegexp('/verify/:token').test(path) &&
      !pathToRegexp('/forgot/:token').test(path) &&
      !pathToRegexp('/reset/:token').test(path) &&
      path !== '/' &&
      path !== '(.*)' && // not found route
      path !== ''
    ) {
      localStorage.setItem('lastPath', context.location.pathname);
      context.store.dispatch(setBreadcrumbs(context.route, params));
    }
    if (
      context.route.protected &&
      process.env.BROWSER &&
      !loggedIn(context.store.getState().user) &&
      context.query.__uncache === undefined
    ) {
      const app = document.getElementById('app');
      if (app) {
        const elementToRemove = app.getElementsByClassName('app') || [];
        if (elementToRemove.length > 0) app.removeChild(elementToRemove[0]);
      }
      return { redirect: '/logout' };
    }

    if (path === '/logout') {
      if (Object.keys(context.socket).length !== 0) context.socket.disconnect();
    }

    if (typeof context.route.load === 'function') {
      return context.route
        .load()
        .then((action) => action.default(context, params));
    }
    if (typeof context.route.action === 'function') {
      return context.route.action(context, params);
    }
    return undefined;
  },
});
