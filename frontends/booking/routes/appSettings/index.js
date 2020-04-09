import React from 'react';
import LayoutBooking from '../../../components/LayoutBooking';
import ApplicationSettings from './ApplicationSettings';

async function action({ store, title, route, location, breadcrumbs }) {
    return {
      chunks: ['app'],
      title: route.title,
      component: (
        <LayoutBooking location={location}>
          <ApplicationSettings route={route}/>
        </LayoutBooking>
      ),
    };
}

export default action;
