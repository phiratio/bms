import React from 'react';
import Layout from '../../components/Layout';
import Settings from './Settings';

function action({ location, title, breadcrumbs }) {
  return {
    chunks: ['settings'],
    title,
    component: (
      <Layout location={location} breadcrumbs={breadcrumbs}>
        <Settings title={title} />
      </Layout>
    ),
  };
}

export default action;
