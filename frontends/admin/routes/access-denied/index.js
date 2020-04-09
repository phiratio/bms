import React from 'react';
import AccessDeniedPage from './AccessDeniedPage';

function action({ route }) {
  return {
    chunk: ['access-denied'],
    title: 'Access Denied',
    component: <AccessDeniedPage />,
  };
}

export default action;
