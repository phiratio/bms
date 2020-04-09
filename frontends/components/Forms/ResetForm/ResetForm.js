import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../../history';
import { RenderField } from '../RenderField';
import {
  passwordConfirmValidator,
  passwordValidator,
} from '../../../core/formValidators';

const messages = defineMessages({
  'Reset password': {
    id: 'Reset password',
    defaultMessage: 'Reset password',
  },
  'Back to login': {
    id: 'Back to login',
    defaultMessage: 'Back to login',
  },
  'Enter new password': {
    id: 'Enter new password',
    defaultMessage: 'Enter new password',
  },
});

class ResetForm extends React.Component {
  static contextTypes = {
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
        <Row className="mt-2 justify-content-center">
          <h1>
            <FormattedMessage {...messages['Reset password']} />
          </h1>
        </Row>
        <Row className="mb-2 justify-content-center">
          <p className="text-muted text-center">
            <FormattedMessage {...messages['Enter new password']} />
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
              size="mb-4"
              icon="icon-lock"
              name="password"
              component={RenderField}
              type="password"
              className="form-control"
              placeholder="Password"
              autoFocus
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
            <input name="token" type="hidden" value={this.props.token} />
          </div>
        )}
          <Row className="mt-2 justify-content-center">
          <Col xs={12} md={6}>
            {!notifications.msg && (
              <Button
                color="success"
                className="px-0 w-100"
                disabled={submitting || invalid}
              >
                <FormattedMessage {...messages['Reset password']} />
              </Button>
            )}
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
  form: 'reset',
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  validate() {
    return {
      ...passwordValidator,
      ...passwordConfirmValidator,
    };
  },
})(ResetForm);
