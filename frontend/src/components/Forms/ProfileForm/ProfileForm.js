import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import {Field, FormSection, reduxForm} from 'redux-form';
import { RenderField } from '../RenderField';
import {
  emailValidator,
  usernameValidator,
  passwordValidator,
} from '../../../core/formValidators/formValidators';

class ProfileForm extends React.Component {
  static contextTypes = {
    intl: PropTypes.object.isRequired,
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
              name="username"
              component={RenderField}
              type="text"
              className="form-control"
              placeholder="Username"
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
            <small>
              <b>Role</b>
            </small>
            <FormSection name="role">
              <Field
                size="mb-3"
                icon="icon-settings"
                name="name"
                component={RenderField}
                disabled="disabled"
                type="text"
                className="form-control"
                placeholder="Role"
              />
            </FormSection>
          </div>
          <Row>
            <Col xs="6">
              <Button
                color="primary"
                className="px-4"
                disabled={submitting || pristine}
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
})(ProfileForm);
