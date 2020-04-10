/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import Reset from './Reset';
import { setNotification } from '../../../../actions/notifications';
import history from '../../../../history';
import LayoutBlank from '../../../../components/LayoutBlank';
import LayoutAuth from '../../../../components/LayoutAuth';
import { loggedIn } from '../../../../core/utils';

async function action({
  store,
  params,
  fetch,
  location,
  title,
  showNotification,
}) {
  if (process.env.BROWSER) {
    const userLoggedIn = loggedIn(store.getState().user);

    if (userLoggedIn) {
      showNotification('Please logout first', 'error');
      history.push('/');
      return null;
    }

    if (!params.token || params.token.length < 128) {
      showNotification('Provided token is incorrect', 'error');
      history.push('/login');
      return null;
    }
    return {
      chunks: ['reset'],
      title,
      component: (
        <LayoutAuth location={location}>
          <Reset params={params} />
        </LayoutAuth>
      ),
    };
  }
  return {
    title,
    component: (
      <LayoutBlank>
        <></>
      </LayoutBlank>
    ),
  };
}

export default action;
