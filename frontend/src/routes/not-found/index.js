/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import { Card, CardBody, CardGroup, Col, Container, Row } from 'reactstrap';
import Layout from '../../components/Layout';
import NotFound from '../../components/NotFound';

function action({ store, params, route, title, location, breadcrumbs }) {
  const { user } = store.getState();
  if (!user) {
    return {
      chunks: ['not-found'],
      title,
      component: (
        <div className="app flex-row align-items-center">
          <Container>
            <Row className="justify-content-center">
              <Col md="8">
                <CardGroup>
                  <Card className="p-4">
                    <CardBody>
                      <NotFound title={title} />
                    </CardBody>
                  </Card>
                </CardGroup>
              </Col>
            </Row>
          </Container>
        </div>
      ),
      status: 404,
    };
  }
  return {
    chunks: ['not-found'],
    title,
    component: (
      <Layout location={location} breadcrumbs={breadcrumbs}>
        <NotFound title={title} />
      </Layout>
    ),
    status: 404,
  };
}

export default action;
