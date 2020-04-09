import React from 'react';
import decode from 'jwt-decode';
import { setNotification } from '../../../actions/notifications';
import LayoutBlank from '../../../components/LayoutBlank';
import history from '../../../history';
import { setUser } from '../../../actions/user';
import { loggedIn } from '../../../core/utils';

async function action({ store, params, httpClient }) {
  if (process.env.BROWSER && loggedIn(store.getState().user))
    return { redirect: window.App.defaultRoute };
  // if user access page directly then verify does not work, because of SSR
  if (process.env.BROWSER) {
    if (params.token) {
      const result = await httpClient.getData(`/auth/verify/${params.token}`);
      await result.json().then(res => {
        if (res.errors) {
          let response;
          for (const key in res.errors) {
            response = res.errors[key].msg;
          }
          if (typeof res.errors === 'string') response = res.errors;
          store.dispatch(setNotification({ type: 'danger', msg: response }));
        }
        if (res.notifications) {
          store.dispatch(
            setNotification({ type: 'success', msg: res.notifications }),
          );
        }
        // Return data if login was successful
        if (res.data) {
          // decode jwt token
          const decoded = decode(res.data.token);
          // set decoded information in redux
          store.dispatch(setUser(decoded));
          history.push('/');
          return true;
        }
      });
    } else {
      store.dispatch(
        setNotification({ type: 'danger', msg: 'Token should be specified' }),
      );
    }
    history.push('/login');
  }
  return {
    component: <LayoutBlank />,
  };
}

export default action;
