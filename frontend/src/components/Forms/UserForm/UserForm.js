import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash.get';
import startCase from 'lodash.startcase';
import {
  Alert,
  Button,
  Col,
  InputGroupAddon,
  InputGroupText,
  Modal,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import { connect } from 'react-redux';
import {
  Field,
  FormSection,
  reduxForm,
  formValueSelector,
  getFormSubmitErrors,
  change,
} from 'redux-form';
import moment from 'moment';
import shortId from 'shortid';
import { RenderField } from '../RenderField';
import {
  emailValidator,
  firstNameValidator,
  lastNameValidator,
  usernameValidator,
  passwordValidator,
} from '../../../core/formValidators/formValidators';
import {
  normalizePhone,
  sendSmsLink,
  callPhoneNumberLink,
  sendEmailLink,
} from '../../../core/utils';
import RenderTimePicker from '../RenderTimePicker';
import RenderDatePicker from '../RenderDatePicker';

const FORM_NAME = 'userForm';

class UserForm extends React.Component {
  static contextTypes = {
    intl: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
  };

  state = {
    deleteAccountModal: false,
  };

  onDeleteButtonClick = () => {
    this.setState({ deleteAccountModal: !this.state.deleteAccountModal });
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
      disabled,
      schedule,
      email,
      mobilePhone,
      userId,
      enableSchedule,
      customAppointmentsSchedule,
      acceptAppointments,
      customAppointmentsHours,
      submitErrors,
      role,
      timeRanges,
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <Modal
          className="modal-danger"
          isOpen={this.state.deleteAccountModal}
          toggle={this.onDeleteButtonClick}
        >
          <ModalHeader>
            Are you sure you want to delete this account ?
          </ModalHeader>
          <ModalFooter>
            <Button
              color="secondary"
              onClick={() => {
                this.onDeleteButtonClick();
              }}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => {
                this.props.onDelete();
                this.onDeleteButtonClick();
              }}
              disabled={disabled}
            >
              Delete
            </Button>
          </ModalFooter>
        </Modal>
        <fieldset disabled={submitting || disabled}>
          {error && (
            <Alert color="danger">{this.context.translate(error)}</Alert>
          )}
          <div>
            <Field
              size="mb-3"
              icon="icon-envelope"
              appendIcon="icon-envelope-letter"
              appendOnClick={() => {
                email && sendEmailLink(email);
              }}
              name="email"
              component={RenderField}
              type="text"
              className="form-control"
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
              icon="icon-phone"
              name="mobilePhone"
              component={RenderField}
              type="text"
              className="form-control"
              onChange={e => {
                this.props.change(
                  'mobilePhone',
                  normalizePhone(e.target.value),
                );
                e.preventDefault();
              }}
              placeholder="Mobile Phone"
              append={[
                <InputGroupText
                  onClick={() => {
                    mobilePhone && sendSmsLink(mobilePhone);
                  }}
                >
                  <i className="icon-speech" />
                </InputGroupText>,
                <InputGroupText
                  onClick={() => {
                    mobilePhone && callPhoneNumberLink(mobilePhone);
                  }}
                >
                  <i className="icon-call-in" />
                </InputGroupText>,
              ]}
            />
            <Field
              size="mb-4"
              icon="icon-note"
              name="description"
              component={RenderField}
              type="text"
              className="form-control"
              placeholder="Description"
            />
            <Field
              size="mb-4"
              icon="icon-lock"
              name="password"
              component={RenderField}
              type="password"
              className="form-control"
              placeholder="New Password"
            />
            <div className="mb-2">
              <Field
                isMulti={false}
                isClearable={false}
                title="Roles"
                description="Users role in the system"
                options={this.props.allUserRoles}
                name="role"
                component={RenderField}
                type="select"
              />
            </div>
            {role &&
              Array.isArray(this.props.employeeRoles) &&
              this.props.employeeRoles.findIndex(el => el.name === role.name) >
                -1 && (
                <React.Fragment>
                  <Col xs={12} className="pl-0 mb-3 mt-3 pr-0">
                    <Field
                      component={RenderField}
                      name="enableSchedule"
                      description="Employee schedule"
                      type="checkbox"
                      title="Schedule"
                    />
                  </Col>
                  <FormSection name="schedule">
                    <Row className="text-center text-md-left mt-2">
                      {enableSchedule &&
                        [
                          'monday',
                          'tuesday',
                          'wednesday',
                          'thursday',
                          'friday',
                          'saturday',
                          'sunday',
                        ].map(el => (
                          <FormSection name={el}>
                            <Col
                              xs={12}
                              sm={2}
                              md="1-7"
                              className="react-datepicker-multi text-center"
                            >
                              <Field
                                component={RenderField}
                                noFloat
                                dataChecked="On"
                                dataUnchecked="Off"
                                name="status"
                                type="checkbox"
                              />
                              <div className="label text-overflow">
                                {startCase(el)}
                              </div>
                              {get(schedule, `${el}.status`) && (
                                <Field
                                  name="timeRanges"
                                  timeRange
                                  multiSelect
                                  clearLabelText="Clear"
                                  clearable
                                  component={RenderTimePicker}
                                />
                              )}
                            </Col>
                          </FormSection>
                        ))}
                      {submitErrors.schedule && (
                        <small className="invalid-feedback d-block mb-3">
                          {this.context.translate(submitErrors.schedule)}
                        </small>
                      )}
                    </Row>
                  </FormSection>
                  {enableSchedule && (
                    <Row>
                      <Col xs={12}>
                        <small>
                          <b>Vacation dates</b>
                        </small>
                      </Col>
                      <Field
                        name="vacationDates"
                        dateRange
                        className="mb-3 mt-2"
                        multiSelect
                        dateFormat="MMM d yyyy"
                        addLabel="Add Vacation"
                        component={RenderDatePicker}
                      />
                    </Row>
                  )}
                  <div className="mb-2">
                    <Field
                      isMulti
                      isClearable
                      closeMenuOnSelect={false}
                      title="Services"
                      placeholder="All services"
                      description="Services employee can provide"
                      options={this.props.items}
                      name="items"
                      component={RenderField}
                      type="select"
                    />
                  </div>
                  <Field
                    component={RenderField}
                    name="acceptAppointments"
                    type="checkbox"
                    title="Can accept appointments"
                    description="Enable this if you want this employee to accept appointments"
                  />
                </React.Fragment>
              )}
            {acceptAppointments && (
              <React.Fragment>
                <div className="mb-4">
                  <Field
                    isMulti={false}
                    title="Future booking"
                    description="Amount of days an employee can accept appointments in future,
                  if not set default will be used"
                    options={timeRanges.from_1day_to_7day}
                    name="futureBooking"
                    component={RenderField}
                    type="select"
                  />
                </div>
                <div className="mb-4">
                  <Field
                    isMulti={false}
                    title="Prior time booking"
                    description="Client can make an appointment with this employee prior
                  selected time, if not set default will be used"
                    options={timeRanges.from_1hour_to_12hour}
                    name="priorTimeBooking"
                    component={RenderField}
                    type="select"
                  />
                </div>
                <Field
                  component={RenderField}
                  name="autoConfirmAppointments"
                  type="checkbox"
                  title="Automatically confirm bookings"
                  description="All bookings with this employee will be automatically confirmed"
                />
                <Col xs={12} className="pl-0 mb-3 mt-3 pr-0">
                  <Field
                    component={RenderField}
                    name="customAppointmentsHours"
                    type="checkbox"
                    title="Custom appointments hours"
                  />
                </Col>
                <FormSection name="customAppointmentsSchedule">
                  {customAppointmentsHours &&
                    [
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ].map(el => (
                      <FormSection name={el}>
                        <Row className="text-center text-md-left mt-2">
                          <Col
                            xs={2}
                            sm={1}
                            className="react-datepicker-multi pt-2 mr-2"
                          >
                            <Field
                              component={RenderField}
                              noFloat
                              dataChecked="Yes"
                              dataUnchecked="No"
                              onChange={e => {
                                // reset the value if toggle was set to `false`, but value was selected
                                // if (e.target.value === 'true') {
                                //   this.context.store.dispatch(
                                //     change(
                                //       FORM_NAME,
                                //       'customAppointmentsSchedule',
                                //       {
                                //         ...customAppointmentsSchedule,
                                //         ...{ [el]: {} },
                                //       },
                                //     ),
                                //   );
                                // }
                              }}
                              name="status"
                              type="checkbox"
                            />
                          </Col>
                          <Col xs={5} sm={2} className="pl-3 pt-2 text-left">
                            <div className="label text-overflow">
                              {startCase(el)}
                            </div>
                          </Col>
                          <Col xs={12} sm={6} className="text-center">
                            {get(
                              customAppointmentsSchedule,
                              `${el}.status`,
                            ) && (
                              <Field
                                name="timeRanges"
                                timeRange
                                multiSelect
                                clearable
                                component={RenderTimePicker}
                              />
                            )}
                          </Col>
                        </Row>
                      </FormSection>
                    ))}
                  {submitErrors.customAppointmentsSchedule && (
                    <small className="invalid-feedback d-block mb-3">
                      {this.context.translate(
                        submitErrors.customAppointmentsSchedule,
                      )}
                    </small>
                  )}
                </FormSection>
              </React.Fragment>
            )}
            <Row>
              <Col>
                <Field
                  switchType="switch-danger"
                  component={RenderField}
                  name="blocked"
                  type="checkbox"
                  title="Blocked"
                  description="Enable if you want user to be active"
                />
                <Field
                  component={RenderField}
                  name="confirmed"
                  type="checkbox"
                  title="Confirmed"
                  description="Enable if you want user to be verified"
                />
              </Col>
            </Row>
            {initialValues.createdAt && (
              <Row>
                <Col>
                  <React.Fragment>
                    <small>
                      <b>Joined</b>
                    </small>
                    <label className="float-right btn-link disabled">
                      {moment(initialValues.createdAt).format(
                        window.App.dateFormat,
                      )}
                    </label>
                  </React.Fragment>
                </Col>
              </Row>
            )}
            {initialValues.updatedAt && (
              <Row>
                <Col>
                  <small>
                    <b>Updated</b>
                  </small>
                  <label className="float-right btn-link disabled">
                    {moment(initialValues.updatedAt).format(
                      window.App.dateFormat,
                    )}
                  </label>
                </Col>
              </Row>
            )}
          </div>
          <Row>
            <Col xs="12">
              <Button
                color="primary"
                className="px-4 mt-4"
                disabled={this.state.disabled || submitting}
              >
                Save
              </Button>
              {this.props.userId && (
                <Button
                  disabled={this.state.disabled || submitting}
                  color="danger"
                  className="px-4 mt-4 ml-2"
                  onClick={() => {
                    this.onDeleteButtonClick();
                  }}
                >
                  Delete
                </Button>
              )}
            </Col>
          </Row>
        </fieldset>
      </form>
    );
  }
}

const selector = formValueSelector(FORM_NAME);

let userForm = reduxForm({
  form: FORM_NAME,
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  enableReinitialize: true,
  validate(values) {
    return {
      ...emailValidator(values).optional(),
      ...firstNameValidator(values),
      ...lastNameValidator(values),
      ...passwordValidator(values).optional(),
      ...usernameValidator(values).optional(),
    };
  },
})(UserForm);

userForm = connect(state => {
  const {
    mobilePhone,
    email,
    customAppointmentsSchedule,
    enableSchedule,
    schedule,
    role,
    acceptAppointments,
    customAppointmentsHours,
  } = selector(
    state,
    'mobilePhone',
    'email',
    'customAppointmentsSchedule',
    'enableSchedule',
    'schedule',
    'role',
    'acceptAppointments',
    'customAppointmentsHours',
  );
  return {
    submitErrors: getFormSubmitErrors(FORM_NAME)(state),
    customAppointmentsSchedule,
    role,
    email,
    mobilePhone,
    schedule,
    enableSchedule,
    acceptAppointments,
    customAppointmentsHours,
  };
})(userForm);

export default userForm;
