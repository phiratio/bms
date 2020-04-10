/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import Layout from '../../../../components/Layout';
import Accounts from './Accounts';
import AddUpdateAccounts from './AddUpdateAccounts';

async function action({ query, params, route, intl, location, store }) {
  let title;
  switch (true) {
    case route.path === '' && route.parent.path === '/accounts':
      return {
        redirect: '/accounts/all',
      };
    case /add/.test(route.path):
      title = intl.formatMessage({
        id: 'Add account',
        defaultMessage: 'Add account',
      });
      return {
        chunks: ['accounts'],
        title,
        component: (
          <Layout location={location}>
            <AddUpdateAccounts title={title} />
          </Layout>
        ),
      };
    case /^[0-9a-fA-F]{24}$/.test(params.id): // Test if provided action is MongoDB ID
      title = intl.formatMessage({
        id: 'Update account',
        defaultMessage: 'Update account',
      });
      return {
        chunks: ['accounts'],
        title,
        component: (
          <Layout location={location}>
            <AddUpdateAccounts
              key={`${route.path}${params.id}${Math.random()}`} // In order to re-render component we have to pass unique key
              route={route}
              params={params}
              userId={params.id}
              title={title}
            />
          </Layout>
        ),
      };
    case /[A-Za-z0-9]$/.test(route.parent.path):
      title = intl.formatMessage({
        id: 'Accounts',
        defaultMessage: 'Accounts',
      });
      return {
        chunks: ['accounts'],
        title,
        component: (
          <Layout location={location}>
            <Accounts
              route={route}
              params={params}
              key={`${query.page} ${Math.random()}`}
            />
          </Layout>
        ),
      };
    default:
      return null;
  }
}

export default action;
