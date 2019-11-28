import React from 'react';
import Signup from './Signup';
import { loggedIn } from '../../core/utils';
import LayoutAuth from '../../components/LayoutAuth';

async function action({ store, title }) {
  if (process.env.BROWSER && loggedIn(store.getState().user))
    return { redirect: window.App.defaultRoute };
  return {
    chunks: ['login'],
    title,
    component: (
      <LayoutAuth>
        <Signup title={title} />
      </LayoutAuth>
    ),
  };
}

export default action;
