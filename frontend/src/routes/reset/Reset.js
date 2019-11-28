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
import { SubmissionError } from 'redux-form';
import { Card, CardBody } from 'reactstrap';
import ResetForm from '../../components/Forms/ResetForm/ResetForm';
import { validate } from '../../core/httpClient';

class Reset extends React.Component {
  state = {
    formNotifications: {},
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  submit = values =>
    this.context.httpClient
      .sendData(`/auth/reset`, 'POST', values)
      .then(validate.bind(this))
      .then(res => {})
      .catch(e => Promise.reject(new SubmissionError(e)));

  render() {
    return (
      <Card className="p-4">
        <CardBody>
          <ResetForm
            notifications={this.state.formNotifications}
            onSubmit={this.submit}
            initialValues={{ token: this.props.params.token }}
          />
        </CardBody>
      </Card>
    );
  }
}

export default Reset;
