import React from 'react';
import Signup from './Signup';
import { loggedIn } from '../../../../core/utils';
import LayoutBooking from '../../components/LayoutBooking';

async function action({ store, title, location }) {
  if (process.env.BROWSER && loggedIn(store.getState().user))
    return { redirect: window.App.defaultRoute };
  return {
    chunks: ['login'],
    title,
    component: (
      <LayoutBooking location={location}>
        <Signup title={title} />
      </LayoutBooking>
    ),
  };
}

export default action;
