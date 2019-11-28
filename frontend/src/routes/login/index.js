import React from 'react';
import Login from './Login';
import LayoutAuth from '../../components/LayoutAuth';
import { loggedIn } from '../../core/utils';

async function action({ store, title }) {
  if (process.env.BROWSER && loggedIn(store.getState().user)) {
    return {
      redirect: localStorage.getItem('lastPath') || window.App.defaultRoute,
    };
  }
  return {
    chunks: ['login'],
    title,
    component: (
      <LayoutAuth>
        {!loggedIn(store.getState().user) && <Login />}
      </LayoutAuth>
    ),
  };
}

export default action;
