import React from 'react';
import Booking from './Booking';
import LayoutBooking from '../../components/LayoutBooking';
import LayoutAdmin from "../../components/Layout";
import {loggedIn} from "../../core/utils";
import get from "lodash.get";
import LayoutBlank from "../../components/LayoutBlank";

async function action({ store, title, route, location, breadcrumbs }) {
  const userLoggedIn = loggedIn(store.getState().user);
  const role = get(store.getState(), 'user.role.name');
  switch (true) {
    case !userLoggedIn || userLoggedIn && role === 'Client' || !role:
      return {
        chunks: ['book'],
        title: route.title,
        component: (
          <LayoutBooking location={location}>
            <Booking route={route}/>
          </LayoutBooking>
        ),
      };
    case userLoggedIn && role && role !== 'Client':
      return {
        redirect: '/profile'
      };
    default:
      return {
        component: <LayoutBlank />,
      };
  }
}

export default action;
