import React from 'react';
import Login from './Login';
import { loggedIn } from '../../../../core/utils';
import LayoutAuth from '../../../../components/LayoutAuth';
import {Col, Row} from "reactstrap";
import history from "../../../../history";

async function action({ store, title, location, route, params, query }) {

  return {
    chunks: ['login'],
    title: route.title,
    component: (
      <LayoutAuth location={location}>
        <Login />
      </LayoutAuth>
    ),
  };
}

export default action;
