import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../../history';
import { RenderField } from '../RenderField';
import { emailValidator } from '../../../core/formValidators/formValidators';

const messages = defineMessages({
  'Forgot password ?': {
    id: 'Forgot password ?',
    defaultMessage: 'Forgot password ?',
  },
  'Send password reset link': {
    id: 'Send password reset link',
    defaultMessage: 'Send password reset link',
  },
  'Enter your email address and we will send you a link to reset your password': {
    id:
      'Enter your email address and we will send you a link to reset your password',
    defaultMessage:
      'Enter your email address and we will send you a link to reset your password',
  },
  'Back to login': {
    id: 'Back to login',
    defaultMessage: 'Back to login',
  },
});

class ForgotForm extends React.Component {
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
      notifications,
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <h1>
          <FormattedMessage {...messages['Forgot password ?']} />
        </h1>
        <p className="text-muted">
          <FormattedMessage
            {...messages[
              'Enter your email address and we will send you a link to reset your password'
            ]}
          />
        </p>
        {error && <Alert color="danger">{this.context.translate(error)}</Alert>}
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
          </div>
        )}
        <Row>
          <Col xs="12" md={{ size: 6 }}>
            {!notifications.msg && (
              <Button
                color="primary"
                className="px-0 w-100"
                disabled={submitting || invalid}
              >
                <FormattedMessage {...messages['Send password reset link']} />
              </Button>
            )}
          </Col>
          <Col xs="12" md={{ offset: 2, size: 4 }} className="text-right">
            <Button
              onClick={() => {
                history.push('/login');
              }}
              color="link"
              className="px-0 w-100"
            >
              <FormattedMessage {...messages['Back to login']} />
            </Button>
          </Col>
        </Row>
      </form>
    );
  }
}
export default reduxForm({
  form: 'forgot',
  touchOnChange: true,
  validate(values) {
    return {
      ...emailValidator(values),
    };
  },
})(ForgotForm);
