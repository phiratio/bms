import React from 'react';
import LayoutBooking from '../../../../components/LayoutBooking';
import Terms from './Terms';

async function action({ store, title, route, location, breadcrumbs }) {
    return {
      chunks: ['terms'],
      title: route.title,
      component: (
        <LayoutBooking location={location}>
          <Terms route={route}/>
        </LayoutBooking>
      ),
    };
}

export default action;
