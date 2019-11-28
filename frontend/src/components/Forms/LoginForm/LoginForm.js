import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage } from 'react-intl';
import { RenderField } from '../RenderField';
import {
  identifierValidator,
  passwordValidator,
} from '../../../core/formValidators/formValidators';
import history from '../../../history';

const messages = {
  'Forgot password ?': {
    id: 'Forgot password ?',
    defaultMessage: 'Forgot password ?',
  },
  Login: {
    id: 'Login',
    defaultMessage: 'Login',
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
      submitting,
      invalid,
      disabled,
    } = this.props;
    const notifications = this.context.store.getState().formNotifications;
    return (
      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting || disabled}>
          <h1>
            <FormattedMessage {...messages.Login} />
          </h1>
          <p className="text-muted">
            <FormattedMessage {...messages['Sign In to your account']} />
          </p>
          {error && <Alert color="danger">{this.context.translate(error)}</Alert>}
          {notifications.msg && (
            <Alert color={notifications.type}>
              {this.context.translate(notifications.msg)}
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
            autoFocus
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
          <Row>
            <Col xs="12" md={{ size: 5 }}>
              <Button
                color="primary"
                className="px-4 w-100"
                disabled={submitting || invalid}
              >
                <FormattedMessage {...messages.Login} />
              </Button>
            </Col>
            {/*<Col xs="12" md={{ offset:2, size: 3 }} className="text-right">*/}
              {/*<Button*/}
                {/*color="link"*/}
                {/*className="px-0 w-100"*/}
                {/*onClick={() => {*/}
                  {/*history.push('/forgot');*/}
                {/*}}*/}
              {/*>*/}
                {/*<FormattedMessage {...messages['Forgot password ?']} />*/}
              {/*</Button>*/}
            {/*</Col>*/}
          </Row>
        </fieldset>
      </form>
    );
  }
}
export default reduxForm({
  form: 'login',
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
