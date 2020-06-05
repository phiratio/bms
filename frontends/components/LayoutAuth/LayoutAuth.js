/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CardGroup, Col, Container, Row } from 'reactstrap';
import LoadingBar from 'react-redux-loading-bar';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Notifs } from 'redux-notification-center';
import Notification from '../../components/Notification';
import s from './LayoutAuth.css';
import history from "../../history";

class LayoutAuth extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  };
  render() {
    return (
      <React.Fragment>
        <LoadingBar className="loading" />
        <Notifs className="notif__container notif__position__bottom_right" CustomComponent={Notification} />
        <div className="app flex-row align-items-center">
          <Container>
            <Row className="mb-4 mt-4">
              <Col xs={12} className="text-center mt-2">
                {
                  process.env.BROWSER && (
                    <a href="#" onClick={e => { e.preventDefault(); window.location.replace(window.App.bookingUrl) }}><b> {"<<"} Go to Booking Demo </b></a>
                  )
                }
              </Col>
            </Row>
            <Row className="justify-content-center">
              <Col md="12">
                <CardGroup>
                  {this.props.children}
                </CardGroup>
              </Col>
            </Row>
          </Container>
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(s)(LayoutAuth);
