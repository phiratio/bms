import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../../history';
import { RenderField } from '../RenderField';
import { emailValidator } from '../../../core/formValidators/formValidators';
import _ from "lodash";
import PageNotAvailable from "../../PageNotAvailable";

const messages = defineMessages({
  'Forgot password ?': {
    id: 'Forgot password ?',
    defaultMessage: 'Forgot password ?',
  },
  'Send reset link': {
    id: 'Send reset link',
    defaultMessage: 'Send reset link',
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
      meta,
    } = this.props;

    if (!_.get(meta, 'forgotPassword')) {
      return <PageNotAvailable />;
    }

    return (
      <form onSubmit={handleSubmit}>
        <Row className="mt-2 justify-content-center">
          <h1>
            <FormattedMessage {...messages['Forgot password ?']} />
          </h1>
        </Row>
        <Row className="mb-2 justify-content-center">
          <p className="text-muted text-center">
            <FormattedMessage
              {...messages[
                'Enter your email address and we will send you a link to reset your password'
                ]}
            />
          </p>
        </Row>
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
        <Row className="mt-2 justify-content-center">
          <Col xs={12} md={6}>
            <Button
              color="success"
              className="px-0 w-100"
              disabled={submitting || invalid}
            >
              <FormattedMessage {...messages['Send reset link']} />
            </Button>
          </Col>
        </Row>
        <Row className="mt-2 justify-content-center">
          <Col xs={12} md={6}>
            <Button
              onClick={() => {
                history.push('/login');
              }}
              color="link"
              className="px-0 w-100"
              disabled={submitting}
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
