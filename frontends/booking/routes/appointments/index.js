import React from 'react';
import Appointments from './Appointments';
import LayoutBooking from '../../../components/LayoutBooking';
import AppointmentDetails from '../../../components/AppointmentDetails';

function action({ location, params, route, breadcrumbs }) {
  switch (true) {
    case /^[0-9a-fA-F]{24}$/.test(params.id):
      return {
        chunks: ['appointments'],
        title: route.title,
        component: (
          <LayoutBooking location={location} breadcrumbs={breadcrumbs}>
            <AppointmentDetails title={route.title} id={params.id} />
          </LayoutBooking>
        ),
      };
    default:
      return {
        chunks: ['appointments'],
        title: route.title,
        component: (
          <LayoutBooking location={location} breadcrumbs={breadcrumbs}>
            <Appointments route={route} />
          </LayoutBooking>
        ),
      };
  }
}

export default action;
