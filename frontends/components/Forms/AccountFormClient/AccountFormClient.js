import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm } from 'redux-form';
import { RenderField } from '../RenderField';
import {
  passwordValidator,
} from '../../../core/formValidators';

class AccountFormClient extends React.Component {
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
      disabled,
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
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
          <Row className="mt-4 justify-content-center">
            <Col xs={12} md={6}>
              <Button
                className="mt-5 pt-2 w-100"
                tabIndex={-1}
                disabled={submitting || disabled}
                color="success"
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
})(AccountFormClient);
