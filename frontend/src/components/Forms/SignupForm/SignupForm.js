import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, InputGroupText, Row } from 'reactstrap';
import {
  Field,
  formValueSelector,
  getFormSubmitErrors,
  reduxForm,
  stopSubmit,
} from 'redux-form';
import { FormattedMessage, defineMessages } from 'react-intl';
import _ from 'lodash';
import shortId from 'shortid';
import firebase from 'firebase';
import { connect } from 'react-redux';
import get from 'lodash.get';
import history from '../../../history';
import { RenderField } from '../RenderField';
import {
  emailValidator,
  passwordConfirmValidator,
  passwordValidator,
} from '../../../core/formValidators/formValidators';
import { normalizePhone, sendEmailLink } from '../../../core/utils';
import PageNotAvailable from '../../PageNotAvailable';

class SendSMSButton extends Component {
  state = {
    id: 'submitForm',
  };

  constructor(props) {
    super(props);
    if (props.id) {
      this.setState({
        id: props.id,
      });
    }
    if (!firebase.apps.length && process.env.BROWSER) {
      firebase.initializeApp({
        apiKey: window.App.fibasePublicApiKey,
      });
    }
  }

  componentDidMount() {
    window.recaptchaVerifier = this.RecaptchaVerifier();
  }

  RecaptchaVerifier = () =>
    new firebase.auth.RecaptchaVerifier(this.state.id, {
      size: 'invisible',
      callback: this.recaptchaCallback,
      'expired-callback': this.recaptchaExpireCallback,
      'error-callback': this.recaptchaExpireCallback,
    });

  recaptchaExpireCallback = () => {
    console.log('expire');
    window.recaptchaVerifier.reset();
  };

  recaptchaCallback = recaptchaToken => {
    console.log('rec', recaptchaToken);
    this.props.submit({
      phoneNumber: this.props.phoneNumber,
      recaptchaToken,
    });
    window.recaptchaVerifier.reset();
  };

  render() {
    setTimeout(() => {
      window.recaptchaVerifier.render().then(widgetId => {
        window.recaptchaWidgetId = widgetId;
      });
    }, 2500);
    return null;
  }
}

const messages = defineMessages({
  'Sign up with Facebook': {
    id: 'Sign up with Facebook',
    defaultMessage: 'Sign up with Facebook',
  },
  'Sign up': {
    id: 'Sign Up',
    defaultMessage: 'Sign Up',
  },
  Continue: {
    id: 'Continue',
    defaultMessage: 'Continue',
  },
  'Sign up with your email address': {
    id: 'Sign up with your email address',
    defaultMessage: 'Sign up with your email address',
  },
  'Back to login': {
    id: 'Back to login',
    defaultMessage: 'Back to login',
  },
});

class SignupForm extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };

  sendSMS = (...args) =>
    this.props
      .api()
      .sendSMS(...args)
      .then(res => {
        console.log('res', res);
        if (res.sent) {
          this.props.toggleVerificationCodeInputDisplay();
        }
      })
      .catch(e => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.reset();
        }
        console.log('e', e);
        const errors = _.get(e, 'message.errors');
        if (errors) {
          const mappedErrors = Object.keys(errors).reduce((acc, curr) => {
            acc[curr] = errors[curr].msg;
            return acc;
          }, {});

          console.log('mappe', mappedErrors);

          this.context.store.dispatch(stopSubmit('signup', mappedErrors));
        }
      });

  render() {
    const {
      error,
      handleSubmit,
      pristine,
      reset,
      submitting,
      meta,
      invalid,
      disabled,
      mobilePhone,
      email,
      notifications,
    } = this.props;

    if (!_.get(meta, 'signUp')) {
      return <PageNotAvailable />;
    }

    return (
      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting || disabled}>
          <Row className="justify-content-center text-center">
            <h1>
              <FormattedMessage {...messages['Sign up']} />
            </h1>
          </Row>
          <Row className="mb-4 justify-content-center">
            <h5>
              <FormattedMessage
                {...messages['Sign up with your email address']}
              />
            </h5>
          </Row>
          {error && (
            <Alert color="danger">{this.context.translate(error)}</Alert>
          )}
          {notifications.msg && (
            <Alert color={notifications.type}>
              {this.context.translate(notifications.msg)}
            </Alert>
          )}
          <div>
            {this.props.showVerificationCodeInput && (
              <Field
                size="mb-4"
                icon="icon-lock"
                name="verificationCode"
                component={RenderField}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control"
                autoComplete="new-password"
                placeholder="Verification Code"
              />
            )}
            {!this.props.isFullForm &&
              !this.props.showVerificationCodeInput && (
                <Field
                  size="mb-3"
                  icon="icon-envelope"
                  name="email"
                  component={RenderField}
                  type="text"
                  className="form-control"
                  autoComplete="new-password"
                  placeholder="Email"
                />
              )}
            {this.props.isFullForm && !this.props.showVerificationCodeInput && (
              <>
                <Field
                  size="mb-3"
                  icon="icon-envelope"
                  name="email"
                  appendIcon="icon-close"
                  disabled
                  appendOnClick={() => this.props.toggleFullFormDisplay()}
                  component={RenderField}
                  type="text"
                  className="form-control"
                  placeholder="Email"
                  autoComplete="new-password"
                />
                <Field
                  size="mb-3"
                  icon="icon-user"
                  name="firstName"
                  component={RenderField}
                  type="text"
                  className="form-control"
                  autoComplete="new-password"
                  placeholder="First name"
                />
                <Field
                  size="mb-3"
                  icon="icon-user"
                  name="lastName"
                  component={RenderField}
                  type="text"
                  className="form-control"
                  autoComplete="new-password"
                  placeholder="Last name"
                />
                <Field
                  size="mb-4"
                  icon="icon-lock"
                  name="password"
                  component={RenderField}
                  type="password"
                  className="form-control"
                  autoComplete="new-password"
                  placeholder="Password"
                />
                {meta.mobilePhoneVerification && (
                  <>
                    <Field
                      size="mb-4"
                      type="text"
                      inputMode="numeric"
                      pattern="+[0-9 ]*"
                      icon="icon-phone"
                      name="mobilePhone"
                      onChange={e => {
                        this.props.change(
                          'mobilePhone',
                          normalizePhone(e.target.value),
                        );
                        e.preventDefault();
                      }}
                      component={RenderField}
                      className="form-control"
                      placeholder="Mobile Phone"
                      autoComplete="new-password"
                    />
                    <SendSMSButton
                      id="submitForm"
                      submit={this.sendSMS}
                      phoneNumber={mobilePhone}
                    />
                  </>
                )}
              </>
            )}
          </div>
          <Row className="mt-2 justify-content-center text-center">
            <Col xs={12} md={8}>
              {this.props.isFullForm && (
                <Button
                  className="pt-2 w-100"
                  tabIndex={-1}
                  id="submitForm"
                  disabled={submitting || disabled}
                  color="success"
                >
                  <FormattedMessage {...messages['Sign up']} />
                </Button>
              )}
              {!this.props.isFullForm && (
                <Button
                  className="pt-2 w-100"
                  tabIndex={-1}
                  disabled={submitting || disabled}
                  color="success"
                >
                  <FormattedMessage {...messages.Continue} />
                </Button>
              )}
            </Col>
          </Row>
          <Row className="mt-2 justify-content-center text-center">
            <span className="text-muted">or</span>
          </Row>
          <Row className="mt-2 justify-content-center text-center">
            <Col xs={12} md={8}>
              <Button
                className="pt-2 w-100 btn-facebook "
                tabIndex={-1}
                disabled={submitting || disabled}
                color="primary"
              >
                <FormattedMessage {...messages['Sign up with Facebook']} />
              </Button>
            </Col>
          </Row>
          <Row className="mt-2 justify-content-center">
            <Col xs={12} md={6}>
              <Button
                onClick={() => {
                  history.push('/login');
                }}
                disabled={disabled}
                color="link"
                className="px-0 w-100"
              >
                <FormattedMessage {...messages['Back to login']} />
              </Button>
            </Col>
          </Row>
        </fieldset>
      </form>
    );
  }
}

const FORM_NAME = 'signup';

let signupForm = reduxForm({
  form: FORM_NAME,
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  // client side validation
  validate(values) {
    return {
      ...emailValidator(values),
      ...passwordValidator(values),
    };
  },
})(SignupForm);

const selector = formValueSelector(FORM_NAME);

signupForm = connect(state => {
  if (get(state, `form.${FORM_NAME}`)) {
    const { mobilePhone, email } = selector(state, 'email', 'mobilePhone');

    return {
      submitErrors: getFormSubmitErrors(FORM_NAME)(state),
      mobilePhone,
      email,
    };
  }
  return {};
})(signupForm);

export default signupForm;
