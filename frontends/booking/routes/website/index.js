import React from 'react';
import LayoutBooking from '../../../components/LayoutBooking';

async function action({ store, title, route, location, breadcrumbs }) {
    return {
      chunks: ['website'],
      title: route.title,
      component: (
        <LayoutBooking location={location}>
          <>
            { process.env.BROWSER && _.get(store.getState(), 'layoutBooking.website') && (
              window.location.replace(_.get(store.getState(), 'layoutBooking.website'))
            ) }
          </>
        </LayoutBooking>
      ),
    };
}

export default action;
