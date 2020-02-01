import React from 'react';
import Booking from './Booking';
import LayoutBooking from '../../components/LayoutBooking';

async function action({ store, title, route, location }) {
  return {
    chunks: ['book'],
    title: route.title,
    component: (
      <LayoutBooking location={location} >
        <Booking route={route} />
      </LayoutBooking>
    ),
  };
}

export default action;
