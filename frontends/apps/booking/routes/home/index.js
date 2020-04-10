import React from 'react';
import Home from './Home';
import LayoutBlank from '../../../../components/LayoutBlank';

async function action({ title }) {
  return {
    title,
    chunks: ['home'],
    component: (
      <LayoutBlank>
        <Home />
      </LayoutBlank>
    ),
  };
}

export default action;
