import React from 'react';
import Forgot from './Forgot';
import { loggedIn } from '../../../core/utils';
import LayoutAuth from "../../../components/LayoutAuth";

async function action({ store, title, location }) {
  if (process.env.BROWSER && loggedIn(store.getState().user))
    return { redirect: window.App.defaultRoute };
  return {
    chunks: ['login'],
    title,
    component: (
      <LayoutAuth location={location}>
        <Forgot />
      </LayoutAuth>
    ),
  };
}

export default action;
