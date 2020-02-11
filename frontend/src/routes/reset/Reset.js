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
import AuthApi from "../../core/AuthApi";
import s from "./Reset.css";
import history from "../../history";
import _ from "lodash";
import decode from "jwt-decode";
import cookies from "browser-cookies";
import {setUser} from "../../actions/user";
import withStyles from "isomorphic-style-loader/lib/withStyles";

class Reset extends React.Component {
  state = {
    formNotifications: {},
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props){
    super(props);
    this.AuthApi = AuthApi.bind(this);
  }

  componentDidMount() {
    const token = _.get(this.props, 'params.token');
    console.log('token', token, this.props);
    if (process.env.BROWSER && token) {
      this.AuthApi()
        .fetchResetToken(token)
        .then(data => {
          console.log('data', data);
          if (!data.exists) {
            throw new Error('Provided token is incorrect');
          }
        }).catch(e => {
          this.context.showNotification('Provided token is incorrect', 'error');
          return history.push('/login');
      });
    }
  }

  submit = values =>
    this.AuthApi()
      .resetPassword(values)
      .then(res => {
        const decoded = decode(res.jwt);
        this.setState({ disabled: !!decoded });
        if (decoded) {
          cookies.set(window.App.tokenId, res.jwt, {
            secure: true,
            expires: 3000,
          });
          // set decoded user information
          this.context.store.dispatch(setUser({ ...decoded, ...res.user }));
          history.push('/');
          return decoded;
        }
        throw new Error('Unhandled rejection: Login failed');
      }).catch(e => {
      if (e instanceof TypeError) {
        return Promise.reject(
          new SubmissionError({
            form: e.message,
          }),
        );
      }
      if (_.get(e, 'message.errors')) {
        const { errors } = e.message;
        const mappedErrors = Object.keys(errors).reduce((acc, curr) => {
          acc[curr] = errors[curr].msg;
          return acc;
        }, {});

        return Promise.reject(new SubmissionError(mappedErrors));
      }
      return Promise.reject(
        new SubmissionError({
          form: 'Unexpected response from the server',
        }),
      );
    });

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

export default  withStyles(s)(Reset);

