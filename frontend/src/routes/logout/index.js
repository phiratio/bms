import React from 'react';
import cookies from 'browser-cookies';
import { actions as notifActions } from 'redux-notification-center';
import { unsetUser } from '../../actions/user';
import { setNotification } from '../../actions/notifications';
import history from '../../history';
import LayoutBlank from '../../components/LayoutBlank';

const { notifClear } = notifActions;

async function action({ store, socket }) {
  // if user access page directly then logout does not work, because of SSR
  if (process.env.BROWSER) {
    // clear all existing notifications
    store.dispatch(notifClear());
    store.dispatch(unsetUser());
    cookies.erase(window.App.tokenId);
    socket.close();
    // set success notification
    store.dispatch(
      setNotification({
        type: 'success',
        msg: 'Successfully logged out',
      }),
    );
    history.push('/login');
  }
  return {
    component: <LayoutBlank />,
  };
}

export default action;
