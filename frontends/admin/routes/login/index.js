import React from 'react';
import Login from './Login';
import { loggedIn } from '../../../core/utils';
import LayoutAuth from '../../../components/LayoutAuth';

async function action({ store, title, location, route, params, query }) {
  if (process.env.BROWSER && loggedIn(store.getState().user)) {
    return {
      redirect: localStorage.getItem('lastPath') || window.App.defaultRoute,
    };
  }

  return {
    chunks: ['login'],
    title: route.title,
    component: (
      <LayoutAuth location={location}>
        {!loggedIn(store.getState().user) && <Login />}
      </LayoutAuth>
    ),
  };
}

export default action;
