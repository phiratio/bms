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
import {SubmissionError, change, reset, stopSubmit} from 'redux-form';
import { connect } from 'react-redux';
import decode from 'jwt-decode';
import cookies from "browser-cookies";
import _ from 'lodash';
import SignupForm from '../../../../components/Forms/SignupForm';
import history from '../../../../history';
import { setUser } from '../../../../actions/user';
import AuthApi from '../../../../core/AuthApi';

class Signup extends React.Component {
  state = {
    loading: true,
    isFullForm: false,
    showVerificationCodeInput: false,
    formNotifications: {},
    disabled: false,
    meta: {},
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    focus: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.AuthApi = AuthApi.bind(this);
      this.setState({
        loading: false,
      });
    }
  }

  submit = values => {
    if (this.state.isFullForm) {
      return this.AuthApi()
        .signUpLocal(values)
        .then(res => {
          console.log('res', res);
          // decode jwt token
          if (_.get(res, 'jwt')) {
            const decoded = decode(res.jwt);
            if (decoded) {
              cookies.set(window.App.tokenId, res.jwt, {
                secure: true,
                expires: 3000,
              });
            }
            this.setState({ disabled: !!decoded });
            this.context.store.dispatch(setUser({ ...decoded, ...res.user }));
            history.push('/');
            this.context.showNotification('Successfully signed up', 'success', 5000);
            return true;
          }

          throw new Error('Unable to get authentication credentials from response');
        })
        .catch(e => {
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
              acc[curr] = typeof errors[curr] === 'string' ? errors[curr] : errors[curr].msg;
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
    }

    if (values.email) {
      return this.AuthApi()
        .isExists({ email: values.email })
        .then(res => {
          if (res.exists) {
            this.context.showNotification('You already have an account with us. Please login');
            this.context.store.dispatch(
              change('login', 'identifier', values.email, true),
            );
            return history.push('/login');
          }
          this.context.store.dispatch(reset('signup'));
          this.context.store.dispatch(
            change('signup', 'email', values.email, true),
          );
          this.setState({ isFullForm: true });
          this.context.focus('signUp[firstName]');
        }).catch(e => {
          if (e instanceof TypeError) {
            return Promise.reject(
              new SubmissionError({
                form: e.message,
              }),
            );
          }

          const errors = _.get(e, 'message.errors');
          if (errors) {
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
    }
  };

  sendSMS = (...args) =>
      this.AuthApi()
      .sendSMS(...args)
      .then(res => {
        if (res.sent) {
          this.toggleVerificationCodeInputDisplay();
        }
      })
      .catch(e => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.reset();
        }
        const errors = _.get(e, 'message.errors');
        if (errors) {
          const mappedErrors = Object.keys(errors).reduce((acc, curr) => {
            acc[curr] = errors[curr].msg;
            return acc;
          }, {});
          this.context.store.dispatch(stopSubmit('signup', mappedErrors));
        }
      });

  toggleFullFormDisplay = () =>
    this.setState({ isFullForm: !this.state.isFullForm });

  toggleVerificationCodeInputDisplay = () =>
    this.setState({
      showVerificationCodeInput: !this.state.showVerificationCodeInput,
    });

  render() {
    return (
      <Card className="p-4">
        <CardBody>
          {!this.state.loading && (
            <SignupForm
              meta={this.props.meta}
              sendSMS={this.sendSMS}
              notifications={this.state.formNotifications}
              disabled={this.state.disabled}
              onSubmit={this.submit}
              isFullForm={this.state.isFullForm}
              toggleFullFormDisplay={this.toggleFullFormDisplay}
              toggleVerificationCodeInputDisplay={
                this.toggleVerificationCodeInputDisplay
              }
              showVerificationCodeInput={this.state.showVerificationCodeInput}
            />
          )}
        </CardBody>
      </Card>
    );
  }
}

const mapState = state => ({
  meta: state.layoutBooking,
});

export default connect(mapState)(Signup);
