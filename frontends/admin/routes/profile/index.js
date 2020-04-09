/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import get from 'lodash.get';
import Layout from '../../../components/Layout';
import Profile from './Profile';
import { loggedIn } from '../../../core/utils';
import LayoutBlank from '../../../components/LayoutBlank';

function action({ title, store, location, breadcrumbs, route }) {
  const userLoggedIn = loggedIn(store.getState().user);
  const role = get(store.getState(), 'user.role.name');

  if (!process.env.BROWSER) {
    return {
      component: <LayoutBlank>{null}</LayoutBlank>,
    };
  }

  switch (true) {
    case userLoggedIn && role && role !== 'Client':
      return {
        chunks: ['profile'],
        title: route.title,
        component: (
          <Layout location={location} breadcrumbs={breadcrumbs}>
            <Profile title={title} />
          </Layout>
        ),
      };
    default:
      return {
        component: <LayoutBlank>{null}</LayoutBlank>,
      };
  }
}

export default action;
