/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import Layout from '../../components/Layout';
import Pos from './Pos';

function action({ title, location, breadcrumbs }) {
  return {
    chunks: ['pos'],
    title,
    component: (
      <Layout location={location} breadcrumbs={breadcrumbs}>
        <Pos title={title} />
      </Layout>
    ),
  };
}

export default action;
