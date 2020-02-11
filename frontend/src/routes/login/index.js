import React from 'react';
import Login from './Login';
import { loggedIn } from '../../core/utils';
import LayoutBooking from "../../components/LayoutBooking";

async function action({ store, title, location, route, params, query }) {
  if (process.env.BROWSER && loggedIn(store.getState().user)) {
    return {
      redirect: localStorage.getItem('lastPath') || window.App.defaultRoute,
    };
  }

  switch (true) {
    case /connect/.test(route.path):
      if (process.env.BROWSER) {
        console.log('connect', query, params);
        if (params.provider) {
          console.log('re');
          window.location.replace(`${window.App.apiUrl}/connect/facebook`);
        }
        return {
          redirect: '/login',
        };
      }
    case /callback/.test(route.path):
      console.log('call', query, params);

      if (!params.provider) {
        return {
          redirect: '/login',
        }
      }

      return {
        chunks: ['login'],
        title,
        component: (
          <LayoutBooking location={location}>
            {!loggedIn(store.getState().user) && <Login route={route} query={query} />}
          </LayoutBooking>
        ),
      };
    default:
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
}

export default action;
