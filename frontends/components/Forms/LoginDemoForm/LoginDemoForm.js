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

class LoginDemoForm extends React.Component {
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
          <Row className="mb-2 justify-content-center text-center">
            <h4>{this.props.headerText}</h4>
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
        </fieldset>
      </form>
    );
  }
}
let loginForm = reduxForm({
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
})(LoginDemoForm);

loginForm = connect((state, { form }) => {
  if (get(state, `form.${form}`)) {
    const selector = formValueSelector(form);
    const identifier = selector(state, 'identifier');

    return {
      submitErrors: getFormSubmitErrors(form)(state),
      identifier,
    };
  }
  return {};
})(loginForm);

export default loginForm;
