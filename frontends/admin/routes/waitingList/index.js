/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import shortId from 'shortid';
import Layout from '../../../components/Layout';
import WaitingList from './WaitingList';
import AddUpdateWaitinglist from './AddUpdateWaitinglist';
import Calendar from './Calendar';

function action({ query, params, route, intl, location, store, breadcrumbs }) {
  let title;
  switch (true) {
    case /add/.test(route.path):
      title = intl.formatMessage({
        id: 'Add Appointment',
        defaultMessage: 'Add Appointment',
      });
      return {
        chunks: ['waitingList'],
        title,
        component: (
          <Layout location={location} breadcrumbs={breadcrumbs}>
            <AddUpdateWaitinglist
              ownEdit
              id="new"
              baseURL="/waitinglists/me"
              key={shortId.generate()}
            />
          </Layout>
        ),
      };
    case (/profile\/appointments/.test(
      route.parent.parent.path + route.parent.path,
    ) ||
      /profile\/calendar/.test(route.parent.parent.path + route.parent.path)) &&
      /^[0-9a-fA-F]{24}$/.test(params.id):
      title = intl.formatMessage({
        id: 'Update Appointment',
        defaultMessage: 'Update Appointment',
      });
      return {
        chunks: ['waitingList'],
        title,
        component: (
          <Layout location={location} breadcrumbs={breadcrumbs}>
            <AddUpdateWaitinglist
              ownEdit
              baseURL="/waitinglists/me"
              key={shortId.generate()}
              id={params.id}
            />
          </Layout>
        ),
      };
    case /^[0-9a-fA-F]{24}$/.test(params.id): // Test if provided action is MongoDB ID
      title = intl.formatMessage({
        id: 'Update Appointment',
        defaultMessage: 'Update Appointment',
      });
      return {
        chunks: ['waitingList'],
        title,
        component: (
          <Layout location={location} breadcrumbs={breadcrumbs}>
            <AddUpdateWaitinglist key={shortId.generate()} id={params.id} />
          </Layout>
        ),
      };
    case /appointments/.test(route.parent.path):
      title = intl.formatMessage({
        id: 'Appointments',
        defaultMessage: 'Appointments',
      });
      return {
        chunks: ['waitingList'],
        title,
        component: (
          <Layout location={location} breadcrumbs={breadcrumbs}>
            <WaitingList
              ownEdit
              noEmployeeFilter
              key={shortId.generate()}
              baseURL="/waitinglists/me"
            />
          </Layout>
        ),
      };
    case /profile\/calendar/.test(route.parent.parent.path + route.parent.path):
      title = intl.formatMessage({
        id: 'Calendar',
        defaultMessage: 'Calendar',
      });
      return {
        chunks: ['waitingList'],
        title,
        component: (
          <Layout location={location} breadcrumbs={breadcrumbs}>
            <Calendar
              baseURL="/waitinglists/me"
              title={title}
              key={shortId.generate()}
            />
          </Layout>
        ),
      };
    case /waitingList/.test(route.parent.path):
      title = intl.formatMessage({
        id: 'Waitinglists',
        defaultMessage: 'Waitinglists',
      });
      return {
        chunks: ['waitingList'],
        title,
        component: (
          <Layout location={location} breadcrumbs={breadcrumbs}>
            <WaitingList key={shortId.generate()} />
          </Layout>
        ),
      };
    default:
      return null;
  }
}

export default action;
