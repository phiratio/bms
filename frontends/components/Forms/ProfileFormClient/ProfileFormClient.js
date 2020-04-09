import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import {Field, FormSection, reduxForm} from 'redux-form';
import { RenderField } from '../RenderField';
import {
  emailValidator,
  usernameValidator,
  passwordValidator,
} from '../../../core/formValidators';

class ProfileFormClient extends React.Component {
  static contextTypes = {
    intl: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };
  render() {
    const {
      error,
      handleSubmit,
      submitting,
      initialValues,
      disabled
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting || disabled}>
          {error && (
            <Alert color="danger">{this.context.translate(error)}</Alert>
          )}
          <div>
            <Field
              size="mb-3"
              icon="icon-envelope"
              name="email"
              component={RenderField}
              disabled="disabled"
              type="text"
              className="form-control"
              validFeedback={initialValues.verified ? 'Verified email' : false }
              placeholder="Email"
            />
            <Field
              size="mb-4"
              icon="icon-user"
              name="firstName"
              component={RenderField}
              type="text"
              className="form-control"
              placeholder="First Name"
            />
            <Field
              size="mb-4"
              icon="icon-user"
              name="lastName"
              component={RenderField}
              type="text"
              className="form-control"
              placeholder="Last Name"
            />
            <Field
              size="mb-4"
              icon="icon-user"
              name="mobilePhone"
              component={RenderField}
              disabled="disabled"
              type="text"
              className="form-control"
              placeholder="Mobile Phone"
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
                Save
              </Button>
            </Col>
          </Row>
        </fieldset>
      </form>
    );
  }
}
export default reduxForm({
  form: 'profileForm',
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  enableReinitialize: true,
  validate(values) {
    return {
      ...emailValidator(values),
      ...passwordValidator(values),
      ...usernameValidator(values).optional(),
    };
  },
})(ProfileFormClient);
