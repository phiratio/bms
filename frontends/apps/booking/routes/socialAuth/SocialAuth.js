import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, Button, Alert, Col } from 'reactstrap';
import {
  SubmissionError,
  change,
  submit,
  clearSubmitErrors,
  stopSubmit,
} from 'redux-form';
import { connect } from 'react-redux';
import decode from 'jwt-decode';
import cookies from 'browser-cookies';
import _ from 'lodash';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../../../history';
import { setUser } from '../../../../actions/user';
import { setNotification } from '../../../../actions/notifications';
import AuthApi from '../../../../core/AuthApi';
import VerifyMobilePhoneForm from '../../../../components/Forms/VerifyMobilePhoneForm';

const messages = defineMessages({
  'Sign Up': {
    id: 'Sign Up',
    defaultMessage: 'Sign Up',
  },
  'Back to login': {
    id: 'Back to login',
    defaultMessage: 'Back to login',
  },
  'Create an Account': {
    id: 'Create an Account',
    defaultMessage: 'Create an Account',
  },
});

class SocialAuth extends React.Component {
  state = {
    loading: true,
    disabled: false,
    // cacheToken: '',
    showVerificationCodeInput: false,
    showMobileVerificationInput: false,
    mobilePhoneVerificationRequired: false,
    formNotifications: {},
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    focus: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
    translate: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.AuthApi = AuthApi.bind(this);
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      const path = _.get(this.props, 'route.path');
      if (path && /callback/.test(path)) {
        const token = _.get(this.props, 'query.access_token');
        if (!token) {
          this.context.showNotification(
            'Unable to get an access token',
            'error',
          );
          return history.push('/login');
        }
      }

      this.signUp({
        accessToken: _.get(this.props, 'query.access_token'),
      }).then(res => {
        if (!res) {
          return this.context.store.dispatch(
            stopSubmit('verifyMobilePhone', {
              form: 'Unexpected response from server',
            }),
          );
        }

        if (res.mobilePhoneVerification) {
          this.setState({
            loading: false,
          });
        }
      });
    }
  }

  componentWillUnmount() {
    this.context.store.dispatch(setNotification({}));
  }

  submit = ({ verificationCode, mobilePhone }) =>
    this.AuthApi()
      .signUpFacebook({
        accessToken: _.get(this.props, 'query.access_token'),
        verificationCode,
        mobilePhone,
      })
      .then(res => {
        if (res.jwt) {
          // decode jwt token
          const decoded = decode(res.jwt);
          this.setState({ disabled: !!decoded });
          if (decoded) {
            cookies.set(window.App.tokenId, res.jwt, {
              secure: true,
              expires: 3000,
            });
            // set decoded user information
            this.context.store.dispatch(setUser({ ...decoded, ...res.user }));
            // return history.push('/');
          }
          this.context.showNotification('Successfully logged in');
          history.push('/');
          return res;
        }

        if (res.mobilePhoneVerification) {
          this.setState({
            showMobileVerificationInput: true,
          });
          return res;
        }
        throw new Error('Unhandled rejection: Login failed');
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
            acc[curr] =
              typeof errors[curr] === 'string'
                ? errors[curr]
                : errors[curr].msg;
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

  signUp = ({ verificationCode, mobilePhone }) =>
    this.AuthApi()
      .signUpFacebook({
        accessToken: _.get(this.props, 'query.access_token'),
        verificationCode,
        mobilePhone,
      })
      .then(res => {
        if (res.jwt) {
          // decode jwt token
          const decoded = decode(res.jwt);
          this.setState({ disabled: !!decoded });
          if (decoded) {
            cookies.set(window.App.tokenId, res.jwt, {
              secure: true,
              expires: 3000,
            });
            // set decoded user information
            this.context.store.dispatch(setUser({ ...decoded, ...res.user }));
            // return history.push('/');
          }
          this.context.showNotification('Successfully logged in');
          history.push('/');
          return res;
        }

        if (res.mobilePhoneVerification) {
          this.setState({
            showMobileVerificationInput: true,
          });
          return res;
        }

        throw new Error('Unhandled rejection: Login failed');
      })
      .catch(e => {
        if (e instanceof TypeError) {
          return this.context.store.dispatch(
            stopSubmit('verifyMobilePhone', {
              form: e.message,
            }),
          );
        }
        if (_.get(e, 'message.errors')) {
          const { errors } = e.message;
          const mappedErrors = Object.keys(errors).reduce((acc, curr) => {
            acc[curr] =
              typeof errors[curr] === 'string'
                ? errors[curr]
                : errors[curr].msg;
            return acc;
          }, {});
          console.log('mappedErrors', mappedErrors);
          return this.context.store.dispatch(
            stopSubmit('verifyMobilePhone', mappedErrors),
          );
        }
        if (_.get(e, 'message.error.message')) {
          return this.context.store.dispatch(
            stopSubmit('verifyMobilePhone', {
              form: e.message.error.message,
            }),
          );
        }
        return this.context.store.dispatch(
          stopSubmit('verifyMobilePhone', {
            form: 'Unexpected response from the server',
          }),
        );
      });

  toggleVerificationCodeInputDisplay = () =>
    this.setState({
      showVerificationCodeInput: !this.state.showVerificationCodeInput,
    });

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
          this.context.store.dispatch(
            stopSubmit('verifyMobilePhone', mappedErrors),
          );
        }
      });

  render() {
    const { submitErrors } = this.props;
    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            {this.state.loading && _.get(submitErrors, 'form') && (
              <>
                <Alert color="danger">
                  {this.context.translate(submitErrors.form)}
                </Alert>
                <Button
                  onClick={() => {
                    history.push('/login');
                  }}
                  color="link"
                  className="px-0 w-100"
                >
                  <FormattedMessage {...messages['Back to login']} />
                </Button>
              </>
            )}
            {!this.state.loading && (
              <VerifyMobilePhoneForm
                sendSMS={this.sendSMS}
                query={this.props.query}
                onSubmit={this.submit}
                loading={this.state.loading}
                meta={this.props.meta}
                disabled={this.state.disabled}
                showVerificationCodeInput={this.state.showVerificationCodeInput}
              />
            )}
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}

const mapState = state => ({
  meta: state.layoutBooking,
  submitErrors: _.get(state, 'form.verifyMobilePhone.submitErrors'),
});

export default connect(mapState)(SocialAuth);
