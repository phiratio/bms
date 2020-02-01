import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import {
  Field,
  reduxForm,
  formValueSelector,
  getFormSubmitErrors,
  change,
} from 'redux-form';
import { connect } from 'react-redux';
import { Line } from 'rc-progress';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import Footer from '../../CoreUI/Footer';
import {
  emailValidator,
  firstNameValidator,
  lastNameValidator,
} from '../../../core/formValidators/formValidators';
import s from './RegistrationForm.css';
import { RenderField } from '../RenderField';
import ScrollingEmployees from '../../ScrollingEmployees';

class RegistrationForm extends React.Component {
  state = {
    timeoutModal: false,
    countDown: 25,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
    focus: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    if (process.env.BROWSER) {
      this.portalRoot = document.querySelector('#app .app');
    }
  }

  onTimeoutModalToggle = () => {
    this.setState({ timeoutModal: !this.state.timeoutModal });
  };

  timeoutModalInterval = () =>
    setInterval(() => {
      if (!this.props.pristine && this.props.showTimeoutModal) {
        this.onTimeoutModalToggle();
      }
    }, 30000);

  componentDidMount() {
    this.context.focus('registrationFormFirstName');
    this.timeoutInterval = this.timeoutModalInterval();
  }

  componentWillUnmount() {
    clearInterval(this.countDownInterval);
    clearInterval(this.timeoutInterval);
  }

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
      listOfEnabledEmployees,
      selectedEmployees,
      onEmployeeClick,
      firstName,
      email,
      lastName,
      submitErrors,
      steps,
      setStep,
      skipStep,
      clearSkip,
      unSkipStep,
    } = this.props;

    const resetForm = () => {
      this.context.store.dispatch(reset('registrationForm'));
      setStep('fullName');
      this.context.focus('registrationFormFirstName');
    };

    const onKeyPress = e => {
      clearInterval(this.timeoutInterval);
      this.timeoutInterval = this.timeoutModalInterval();
      if (e.key === 'Enter' && firstName && lastName) {
        e.preventDefault();
        handleSubmit();
      }
    };
    return (
      <form onSubmit={handleSubmit} onKeyPress={onKeyPress} autoComplete="off">
        {process.env.BROWSER &&
          ReactDOM.createPortal(
            <Footer fixed>
              <Col xs={12}>
                <Button
                  disabled={submitting || disabled}
                  color="primary"
                  className="float-right"
                  onClick={resetForm}
                >
                  Start from beginning
                </Button>
              </Col>
            </Footer>,
            this.portalRoot,
          )}
        <Modal
          className="modal-danger"
          isOpen={this.state.timeoutModal}
          toggle={this.onTimeoutModalToggle}
          onOpened={() => {
            this.setState({ countDown: 30 });
            clearInterval(this.timeoutInterval);
            this.countDownInterval = setInterval(() => {
              if (this.state.countDown === 0) {
                clearInterval(this.countDownInterval);
                this.context.store.dispatch(reset('registrationForm'));
                setStep('fullName');
                this.onTimeoutModalToggle();
              } else {
                this.setState({
                  countDown: this.state.countDown - 1,
                });
              }
            }, 1000);
          }}
          onClosed={() => {
            clearInterval(this.countDownInterval);
            this.timeoutInterval = this.timeoutModalInterval();
          }}
        >
          <ModalHeader>Inactivity warning</ModalHeader>
          <ModalBody className="text-center font-lg">
            {firstName && lastName
              ? `Hey ${firstName}, are you still here ?`
              : 'Are you still here ?'}
            <br />
            Reset in {this.state.countDown} seconds
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              onClick={() => {
                resetForm();
                this.onTimeoutModalToggle();
              }}
            >
              Reset Form
            </Button>
            <Button
              color="danger"
              onClick={() => {
                this.onTimeoutModalToggle();
              }}
            >
              I'm still here
            </Button>
          </ModalFooter>
        </Modal>
        <fieldset disabled={submitting || disabled}>
          {error && (
            <Alert color="danger">{this.context.translate(error)}</Alert>
          )}
          <Row>
            <Col xs={{ size: 6, offset: 3 }}>
              <Line
                percent={
                  ((steps.list.indexOf(steps.current) + 1) /
                    steps.list.length) *
                  100
                }
              />
            </Col>
            {submitErrors.employees && (
              <Alert color="danger">
                {this.context.translate(submitErrors.employees)}
              </Alert>
            )}
            {steps.current === 'fullName' && (
              <React.Fragment>
                <Col xs={12} className="text-center mb-5">
                  <h1>{this.props.welcomeMessage}</h1>
                  <h5 className="text-muted text-center">Please Sign In</h5>
                </Col>
                <Col xs={12} md={6}>
                  <Field
                    autocomplete="off"
                    size="mb-3"
                    icon="icon-user"
                    id="registrationFormFirstName"
                    name="firstName"
                    component={RenderField}
                    type="text"
                    className="input-lg form-control-lg form-control"
                    placeholder="First Name"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Field
                    autocomplete="off"
                    icon="icon-user"
                    name="lastName"
                    component={RenderField}
                    type="text"
                    className="input-lg form-control-lg form-control"
                    placeholder="Last Name"
                  />
                </Col>

                <Button
                  className="px-0 w-100 mt-4 mb-4"
                  color="primary"
                  onClick={() => {
                    handleSubmit();
                  }}
                  disabled={pristine}
                >
                  Select your barbers
                </Button>
              </React.Fragment>
            )}
            {steps.current === 'email' && (
              <React.Fragment>
                <Col xs={12} className="text-center">
                  <h1>Welcome {`${firstName} ${lastName}`}</h1>
                  <h5 className="text-muted text-center">Provide your email</h5>
                </Col>
                <Col xs={12}>
                  <Col xs={12}>
                    <Field
                      autocomplete="off"
                      size="mb-5 mt-5"
                      id="registrationFormEmail"
                      icon="icon-envelope"
                      name="email"
                      component={RenderField}
                      type="text"
                      className="input-lg form-control-lg form-control"
                      placeholder="Email"
                    />
                  </Col>
                </Col>
                <Col xs="12" md="6">
                  <Button
                    className="px-0 w-100 mt-4 mb-4"
                    color="primary"
                    onClick={() => {
                      setStep('fullName');
                    }}
                  >
                    Back
                  </Button>
                </Col>
                <Col xs="12" md="6">
                  <Button
                    className="px-0 w-100 mt-4 mb-4"
                    color="primary"
                    disabled={invalid || !email}
                    onClick={() => {
                      handleSubmit();
                    }}
                  >
                    Next
                  </Button>
                </Col>
                <Col xs="12">
                  <Button
                    block
                    color="link"
                    style={{ color: '#eeeeee' }}
                    // disabled={invalid}
                    onClick={async () => {
                      await skipStep('email');
                      await this.context.store.dispatch(
                        change('registrationForm', 'email', ''),
                      );
                      await handleSubmit();
                    }}
                  >
                    Skip
                  </Button>
                </Col>
              </React.Fragment>
            )}
            {steps.current === 'employees' && (
              <React.Fragment>
                <Col xs={12} className="text-center">
                  <h1>Welcome {`${firstName} ${lastName}`}</h1>
                </Col>
                <Col xs={12} className="mt-5 pl-0 pr-0">
                  <h2 className="mt-3 mb-1 text-muted text-center">
                    Click below button to sign in with first available barber
                  </h2>
                  <Button
                    size="lg"
                    color="success"
                    style={{ height: '54px', fontSize: '24px' }}
                    className="px-0 w-100 mb-5 mt-5 font-weight-bold"
                    onClick={async e => {
                      e.preventDefault();
                      await onEmployeeClick('Anyone');
                      return handleSubmit();
                    }}
                  >
                    Register with First Available Barber
                  </Button>
                </Col>
                {listOfEnabledEmployees.length === 0 && (
                  <React.Fragment>
                    <Col xs="12" className="mt-3 mb-3">
                      <Button
                        size="lg"
                        className="px-0 w-100"
                        color="primary"
                        onClick={async () => {
                          if (!steps.hasEmail) {
                            await clearSkip();
                            return setStep('email');
                          }
                          if (steps.skip.indexOf('email') === -1)
                            await setStep('email');
                          else await setStep('fullName');
                        }}
                      >
                        Back
                      </Button>
                    </Col>
                  </React.Fragment>
                )}
                {listOfEnabledEmployees.filter(el => el.name !== 'Anyone')
                  .length > 0 && (
                  <React.Fragment>
                    <Row className="col-12 mb-3">
                      <Col>
                        <hr />
                      </Col>
                      <Col className="col-auto">
                        <span className="text-muted">OR</span>
                      </Col>
                      <Col>
                        <hr />
                      </Col>
                    </Row>
                    <Col xs={12} className="text-center">
                      <h5 className="text-muted text-center">
                        You can select one or more barbers that are working
                        today
                      </h5>
                    </Col>
                    <Col xs={12} className="text-center">
                      <ScrollingEmployees
                        noAnyone
                        list={listOfEnabledEmployees}
                        onClick={onEmployeeClick}
                        selected={selectedEmployees}
                      />
                    </Col>
                    <Col
                      xs="12"
                      md="6"
                      className="pl-0 pr-0 pl-sm-2 pr-sm-2 pl-md-2 pr-md-2 mb-2"
                    >
                      <Button
                        className="px-0 w-100"
                        color="primary"
                        onClick={async () => {
                          if (!steps.hasEmail) {
                            await clearSkip();
                            return setStep('email');
                          }
                          if (steps.skip.indexOf('email') === -1)
                            await setStep('email');
                          else await setStep('fullName');
                        }}
                      >
                        Back
                      </Button>
                    </Col>
                    <Col
                      xs="12"
                      md="6"
                      className="pl-0 pr-0 pl-sm-2 pr-sm-2 pl-md-2 pr-md-2 mb-2"
                    >
                      <Button
                        className="px-0 w-100"
                        color="primary"
                        disabled={submitting || !selectedEmployees.length}
                      >
                        Register
                      </Button>
                    </Col>
                  </React.Fragment>
                )}
                {listOfEnabledEmployees.filter(el => el.name !== 'Anyone')
                  .length === 0 && (
                  <Col xs="12" md="12" className="pl-0 pr-0 mb-4 mt-4">
                    <Button
                      className="px-0 w-100"
                      color="primary"
                      onClick={async () => {
                        if (!steps.hasEmail) {
                          await clearSkip();
                          return setStep('email');
                        }
                        if (steps.skip.indexOf('email') === -1)
                          await setStep('email');
                        else await setStep('fullName');
                      }}
                    >
                      Back
                    </Button>
                  </Col>
                )}
              </React.Fragment>
            )}
            {steps.current === 'success' && (
              <React.Fragment>
                <Col xs="12" className="text-center">
                  <h1>You're all set</h1>
                </Col>
                <Col
                  xs="12"
                  className="text-center"
                  style={{ marginBottom: '58px' }}
                >
                  <div
                    className={`${s['circle-loader']} ${
                      steps.success ? s['load-complete'] : ''
                    } mb-5 mt-5`}
                  >
                    <div
                      className={`${s.checkmark} ${s.draw} ${
                        steps.success ? s['checkmark-show'] : ''
                      }`}
                    />
                  </div>
                </Col>
              </React.Fragment>
            )}
          </Row>
        </fieldset>
      </form>
    );
  }
}
const FORM_NAME = 'registrationForm';
const selector = formValueSelector(FORM_NAME);

let registrationForm = reduxForm({
  form: FORM_NAME,
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  enableReinitialize: true,
  // client side validation
  validate(values) {
    return {
      ...lastNameValidator(values),
      ...emailValidator(values).optional(),
      ...firstNameValidator(values),
    };
  },
})(RegistrationForm);

registrationForm = connect(state => {
  const { firstName, lastName, email } = selector(
    state,
    'firstName',
    'lastName',
    'email',
  );
  return {
    submitErrors: getFormSubmitErrors(FORM_NAME)(state),
    firstName,
    lastName,
    email,
  };
})(registrationForm);

export default withStyles(s)(registrationForm);
