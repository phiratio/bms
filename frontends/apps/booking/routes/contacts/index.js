import React from 'react';
import LayoutBooking from '../../../../components/LayoutBooking';
import Contacts from './Contacts';

async function action({ store, title, route, location, breadcrumbs }) {
    return {
      chunks: ['contacts'],
      title: route.title,
      component: (
        <LayoutBooking location={location}>
          <Contacts route={route}/>
        </LayoutBooking>
      ),
    };
}

export default action;
