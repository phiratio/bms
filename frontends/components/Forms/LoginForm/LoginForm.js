import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import {
  Field,
  formValueSelector,
  getFormSubmitErrors,
  reduxForm,
  change,
} from 'redux-form';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { connect } from 'react-redux';
import get from 'lodash.get';
import { RenderField } from '../RenderField';
import {
  identifierValidator,
  passwordValidator,
} from '../../../core/formValidators';
import history from '../../../history';
import PageNotAvailable from '../../PageNotAvailable';

const messages = {
  'Sign in with Facebook': {
    id: 'Sign in with Facebook',
    defaultMessage: 'Sign in with Facebook',
  },
  'Forgot password ?': {
    id: 'Forgot password ?',
    defaultMessage: 'Forgot password ?',
  },
  'Create an account': {
    id: 'Create an account',
    defaultMessage: 'Create an account',
  },
  Login: {
    id: 'Sign in',
    defaultMessage: 'Sign in',
  },
  'Sign In to your account': {
    id: 'Sign In to your account',
    defaultMessage: 'Sign In to your account',
  },
};

class LoginForm extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };

  render() {
    const {
      error,
      handleSubmit,
      meta,
      submitting,
      identifier,
      submitErrors,
      invalid,
      disabled,
    } = this.props;
    if (_.get(meta, 'signIn') === false) {
      return <PageNotAvailable />;
    }

    return (
      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting || disabled}>
          <Row className="justify-content-center text-center">
            <h1>
              <FormattedMessage {...messages.Login} />
            </h1>
          </Row>
          <Row className="mb-2 justify-content-center">
            <h5>
              <FormattedMessage {...messages['Sign In to your account']} />
            </h5>
          </Row>
          {_.get(submitErrors, 'form') && (
            <Alert color="danger">
              {this.context.translate(submitErrors.form)}
            </Alert>
          )}
          <Field
            id="loginFormEmailInput"
            size="mb-3"
            icon="icon-envelope"
            name="identifier"
            component={RenderField}
            type="text"
            className="form-control"
            placeholder="Email"
          />
          <Field
            id="loginFormPassowrdInput"
            size="mb-4"
            icon="icon-lock"
            name="password"
            component={RenderField}
            type="password"
            className="form-control"
            placeholder="Password"
          />
          <Row className="mt-2 justify-content-center">
            <Col xs={12} md={8}>
              <Button
                className="pt-2 w-100"
                tabIndex={-1}
                disabled={submitting || disabled}
                color="success"
              >
                <FormattedMessage {...messages.Login} />
              </Button>
            </Col>
          </Row>
          <Row className="mt-2 justify-content-center">
            <Col xs={12} md={6}>
              <Button
                color="link"
                className="px-0 w-100"
                onClick={() => {
                  if (identifier) {
                    this.context.store.dispatch(
                      change('forgot', 'email', identifier, true),
                    );
                  }
                  history.push('/forgot');
                }}
              >
                <FormattedMessage {...messages['Forgot password ?']} />
              </Button>
            </Col>
          </Row>
        </fieldset>
      </form>
    );
  }
}
const FORM_NAME = 'login';

let loginForm = reduxForm({
  form: FORM_NAME,
  touchOnChange: true,
  validate(values) {
    if (process.env.BROWSER) {
      return {
        ...identifierValidator(values),
        ...passwordValidator(values),
      };
    }
    return {};
  },
})(LoginForm);

const selector = formValueSelector(FORM_NAME);

loginForm = connect(state => {
  if (get(state, `form.${FORM_NAME}`)) {
    const identifier = selector(state, 'identifier');

    return {
      submitErrors: getFormSubmitErrors(FORM_NAME)(state),
      identifier,
    };
  }
  return {};
})(loginForm);

export default loginForm;
