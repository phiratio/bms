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
import { setNotification } from '../../actions/notifications';
import history from '../../history';
import LayoutBlank from '../../components/LayoutBlank';
import LayoutAuth from '../../components/LayoutAuth';

async function action({ store, params, fetch, title }) {
  let success = false;
  if (process.env.BROWSER) {
    if (params.token) {
      const result = await fetch(`/auth/reset/${params.token}`);
      await result.json().then(res => {
        if (res.errors) {
          let response;
          for (let key in res.errors) {
            response = res.errors[key].msg;
          }
          if (typeof res.errors === 'string') response = res.errors;
          store.dispatch(
            setNotification({ type: 'danger', msg: response })
          )
        }
        if (res.success) {
          success = true;
        }
      });
    } else {
      store.dispatch(
        setNotification({ type: 'danger', msg: 'Token should be specified' }),
      );
    }
    if (!success) history.push('/login');
  }
  // We have to render `Reset` Component with condition, otherwise it renders with bugs and warnings in console
  if (success) {
    return {
      title,
      component: (
        <LayoutAuth>
          <Reset params={params} />
        </LayoutAuth>
      ),
    };
  }

  return {
    title,
    component: (
      <LayoutBlank />
    ),
  };


}

export default action;
