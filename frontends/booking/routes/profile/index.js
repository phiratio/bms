import React from 'react';
import ClientProfile from './ClientProfile';
import LayoutBooking from '../../../components/LayoutBooking';
import LayoutBlank from '../../../components/LayoutBlank';

function action({ title, store, location, breadcrumbs, route }) {
  if (!process.env.BROWSER) {
    return {
      component: <LayoutBlank>{null}</LayoutBlank>,
    };
  }

  return {
    chunks: ['profile'],
    title: route.title,
    component: (
      <LayoutBooking location={location}>
        <ClientProfile title={route.title} />
      </LayoutBooking>
    ),
  };
}

export default action;
