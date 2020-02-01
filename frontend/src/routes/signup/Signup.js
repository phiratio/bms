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
import { SubmissionError, change, reset } from 'redux-form';
import decode from 'jwt-decode';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import SignupForm from '../../components/Forms/SignupForm/SignupForm';
import s from './Signup.css';
import history from '../../history';
import { setUser } from '../../actions/user';
import { validate } from '../../core/httpClient';
import AuthApi from '../../core/AuthApi';
import BookingApi from '../book/BookingApi';
import {setNotification} from "../../actions/notifications";

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
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.AuthApi = AuthApi.bind(this);
    this.BookingApi = BookingApi.bind(this);
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.BookingApi()
        .fetchMeta()
        .then(data =>
          this.setState({
            loading: false,
            meta: data,
          }),
        );
    }
  }

  submit = values => {
    if (this.state.isFullForm) {
      return this.context.httpClient
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
    }

    if (values.email) {
      return this.AuthApi().isExists({ email: values.email }).then(res => {
        if (res.exists) {
          this.context.store.dispatch(
            setNotification({
              type: 'success',
              msg: 'You already have an account with us. Please login.',
            }),
          );
          this.context.store.dispatch(change('login', 'identifier', values.email, true));
          return history.push('/login', );
        }
        this.context.store.dispatch(reset('signup'));
        this.context.store.dispatch(change('signup', 'email', values.email, true));
        this.setState({ isFullForm: true });
      });
    }
  };

  toggleFullFormDisplay = () => {
    return this.setState({ isFullForm: !this.state.isFullForm });
  };

  toggleVerificationCodeInputDisplay = () => {
    return this.setState({ showVerificationCodeInput: !this.state.showVerificationCodeInput });
  };

  render() {
    return (
      <Card className="p-4">
        <CardBody>
          {
            !this.state.loading && (
              <SignupForm
                meta={this.state.meta}
                notifications={this.state.formNotifications}
                disabled={this.state.disabled}
                onSubmit={this.submit}
                api={this.AuthApi}
                isFullForm={this.state.isFullForm}
                toggleFullFormDisplay={this.toggleFullFormDisplay}
                toggleVerificationCodeInputDisplay={this.toggleVerificationCodeInputDisplay}
                showVerificationCodeInput={this.state.showVerificationCodeInput}
              />
            )
          }
        </CardBody>
      </Card>
    );
  }
}

export default withStyles(s)(Signup);
