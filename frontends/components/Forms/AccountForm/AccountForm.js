import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm } from 'redux-form';
import { RenderField } from '../RenderField';
import {
  oldPasswordValidator,
  passwordValidator,
} from '../../../core/formValidators';

class AccountForm extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };

  render() {
    const {
      error,
      handleSubmit,
      pristine,
      submitting,
      invalid,
      intl,
      disabled,
    } = this.props;
    return (
      <form onSubmit={handleSubmit} id="changePasswordForm">
        <fieldset disabled={submitting || disabled}>
          {error && (
            <Alert color="danger">{this.context.translate(error)}</Alert>
          )}
          <div>
            <Field
              size="mb-4"
              icon="icon-lock"
              name="password"
              component={RenderField}
              type="password"
              className="form-control"
              placeholder="New Password"
            />
          </div>
          <Row>
            <Col xs="6">
              <Button
                color="primary"
                className="px-4"
                disabled={submitting || invalid || pristine}
              >
                Update password
              </Button>
            </Col>
          </Row>
        </fieldset>
      </form>
    );
  }
}

export default reduxForm({
  form: 'accountForm',
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  // client side validation
  validate(values) {
    return {
      ...passwordValidator(values),
    };
  },
})(AccountForm);
