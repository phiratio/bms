import React from 'react';
import Login from './Login';
import { loggedIn } from '../../core/utils';
import LayoutBooking from "../../components/LayoutBooking";

async function action({ store, title, location }) {
  if (process.env.BROWSER && loggedIn(store.getState().user)) {
    return {
      redirect: localStorage.getItem('lastPath') || window.App.defaultRoute,
    };
  }
  return {
    chunks: ['login'],
    title,
    component: (
      <LayoutBooking location={location}>
        {!loggedIn(store.getState().user) && <Login />}
      </LayoutBooking>
    ),
  };
}

export default action;
