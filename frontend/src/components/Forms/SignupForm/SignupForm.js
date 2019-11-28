import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../../history';
import { RenderField } from '../RenderField';
import {
  emailValidator,
  passwordConfirmValidator,
  passwordValidator,
} from '../../../core/formValidators/formValidators';

const messages = defineMessages({
  'Sign up': {
    id: 'Sign up',
    defaultMessage: 'Sign up',
  },
  Signup: {
    id: 'Signup',
    defaultMessage: 'Signup',
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
  render() {
    const {
      error,
      handleSubmit,
      pristine,
      reset,
      submitting,
      invalid,
      disabled,
      notifications,
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting || disabled}>
          <h1>
            <FormattedMessage {...messages['Sign up']} />
          </h1>
          <p className="text-muted">
            <FormattedMessage
              {...messages['Sign up with your email address']}
            />
          </p>
          {error && (
            <Alert color="danger">{this.context.translate(error)}</Alert>
          )}
          {notifications.msg && (
            <Alert color={notifications.type}>
              {this.context.translate(notifications.msg)}
            </Alert>
          )}
          {!notifications.msg && (
            <div>
              <Field
                size="mb-3"
                icon="icon-envelope"
                name="email"
                component={RenderField}
                type="text"
                className="form-control"
                placeholder="Email"
                autoFocus
              />
              <Field
                size="mb-4"
                icon="icon-lock"
                name="password"
                component={RenderField}
                type="password"
                className="form-control"
                placeholder="Password"
              />
              <Field
                size="mb-4"
                icon="icon-lock"
                name="passwordConfirm"
                component={RenderField}
                type="password"
                className="form-control"
                placeholder="Confirm password"
              />
            </div>
          )}
          <Row>
            <Col xs="6">
              {!notifications.msg && (
                <Button
                  color="primary"
                  className="px-4"
                  disabled={submitting || invalid}
                >
                  <FormattedMessage {...messages.Signup} />
                </Button>
              )}
            </Col>
            <Col xs="6" className="text-right">
              <Button
                onClick={() => {
                  history.push('/login');
                }}
                disabled={disabled}
                color="link"
                className="px-0"
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
export default reduxForm({
  form: 'signup',
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  // client side validation
  validate(values) {
    return {
      ...emailValidator(values),
      ...passwordValidator(values),
      ...passwordConfirmValidator(values),
    };
  },
})(SignupForm);
