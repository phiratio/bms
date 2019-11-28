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
import { Card, CardBody } from 'reactstrap';
import { SubmissionError } from 'redux-form';
import decode from 'jwt-decode';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import SignupForm from '../../components/Forms/SignupForm/SignupForm';
import s from './Signup.css';
import history from '../../history';
import { setUser } from '../../actions/user';
import { validate } from '../../core/httpClient';

class Signup extends React.Component {
  state = {
    formNotifications: {},
    disabled: false,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  submit = values =>
    this.context.httpClient
      .sendData(`/auth/signup`, 'POST', values)
      .then(validate.bind(this))
      .then(res => {
        // decode jwt token
        const decoded = decode(res.token);
        decoded
          ? this.setState({ disabled: true })
          : this.setState({ disabled: false });
        // set decoded information in redux
        this.context.store.dispatch(setUser(decoded));
        history.push('/');
        return true;
      })
      .catch(e => Promise.reject(new SubmissionError(e)));

  render() {
    return (
      <Card className="p-4">
        <CardBody>
          <SignupForm
            notifications={this.state.formNotifications}
            disabled={this.state.disabled}
            onSubmit={this.submit}
          />
        </CardBody>
      </Card>
    );
  }
}

export default withStyles(s)(Signup);
