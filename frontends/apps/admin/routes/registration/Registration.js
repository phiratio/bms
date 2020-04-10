import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Card, CardBody, Col, Row } from 'reactstrap';
import { reset, SubmissionError, clearSubmitErrors, change } from 'redux-form';
import RegistrationForm from '../../../../components/Forms/RegistrationForm';
import s from './Registration.css';
import { validate } from '../../../../core/httpClient';
import { setEmployees } from '../../../../core/socketEvents';

class Registration extends React.Component {
  state = {
    disabled: false,
    initialRegistrationValues: {},
    selectedEmployees: [],
    listOfEnabledEmployees: [],
    steps: {
      list: ['fullName', 'email', 'employees', 'success'],
      passed: [],
      current: 'fullName',
      previous: 'fullName',
      skip: [],
      hasEmail: false,
    },
    welcomeMessage: false,
    showTimeoutModal: false,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    fetch: PropTypes.func.isRequired,
    httpClient: PropTypes.object.isRequired,
    socket: PropTypes.object.isRequired,
    focus: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.setEmployees = setEmployees.bind(this);
  }

  setStep = async step => {
    if (this.state.steps.current === 'employees') {
      this.setState({ selectedEmployees: [] });
    }
    if (this.state.steps.current === 'email') {
      this.context.focus('registrationFormEmail');
      this.context.store.dispatch(change('registrationForm', 'email', ''));
    }
    const previousStep = this.state.steps.current;
    this.context.store.dispatch(clearSubmitErrors('registrationForm'));
    await this.setState({
      steps: { ...this.state.steps, current: step, previous: previousStep },
    });
    if (this.state.steps.current === 'fullName') {
      this.setState({
        steps: {
          ...this.state.steps,
          skip: [],
          hasEmail: false,
        },
      });
    }
  };

  clearSkip = () => {
    this.setState({
      steps: {
        ...this.state.steps,
        skip: [],
      },
    });
  };

  skipStep = step => {
    this.setState({
      steps: {
        ...this.state.steps,
        skip: [...this.state.steps.skip, step].filter(
          (el, i, a) => i === a.indexOf(el),
        ),
      },
    });
  };

  unSkipStep = step => {
    this.setState({
      ...this.state.steps,
      skip: [],
    });
  };

  nextStep = () => {
    const { current } = this.state.steps;
    const { list } = this.state.steps;
    const currentStepIndex = list.indexOf(current);
    const nextStepIndex = currentStepIndex + 1;
    if (currentStepIndex > -1) this.setStep(list[nextStepIndex]);
  };

  submitRegistration = values =>
    this.context.httpClient
      .sendData(`/waitingLists/`, 'POST', {
        firstName: values.firstName,
        lastName: values.lastName,
        ...(this.state.steps.skip.length > 0 && {
          skipSteps: this.state.steps.skip,
        }),
        ...(this.state.steps.current !== 'fullName' && { email: values.email }),
        ...(this.state.selectedEmployees.length > 0 && {
          employees: JSON.stringify(this.state.selectedEmployees),
        }),
      })
      .then(validate.bind(this))
      .then(data => {
        if (data === undefined)
          return this.context.showNotification('Response is empty', 'error');
        this.setState({
          steps: { ...this.state.steps, current: 'success' },
        });
        this.successStepTimeout = setTimeout(() => {
          this.setState({
            steps: { ...this.state.steps, success: true },
          });
        }, 800);
        this.registrationFormResetTimeout = setTimeout(() => {
          this.context.store.dispatch(reset('registrationForm'));
          this.setState({
            selectedEmployees: [],
            steps: { ...this.state.steps, current: 'fullName', skip: [] },
          });
        }, 3000);
      })
      .catch(e => {
        if (e instanceof TypeError) {
          this.context.showNotification(e.message, 'error');
        }
        const message = e.message || {};
        const currentStep = this.state.steps.current;
        this.setState({
          steps: {
            ...this.state.steps,
            previous: currentStep,
            current: message.nextStep ? message.nextStep : currentStep,
            ...(message.hasEmail && { skip: ['email'] }),
            ...(message.hasEmail && { hasEmail: true }),
          },
        });
        if (this.state.steps.passed.indexOf(currentStep) === -1) {
          this.setState({
            steps: {
              ...this.state.steps,
              passed: [...this.state.steps.passed, currentStep],
            },
          });
        }
        if (message.nextStep) {
          this.setStep(message.nextStep);
        }

        if (message.listOfEmployees) {
          this.setEmployees(message.listOfEmployees);
        }
        if (message.preferredEmployees) {
          this.setState({
            selectedEmployees: message.preferredEmployees
              .filter(el => el.name !== 'Anyone')
              .map(el => el.name),
          });
        }

        if (currentStep === 'fullName') {
          this.setState({
            steps: { ...this.state.steps, passed: ['fullName'] },
          });
          if (e.firstName || e.lastName) {
            return Promise.reject(
              new SubmissionError({
                firstName: e.firstName,
                lastName: e.lastName,
              }),
            );
          }
        } else if (currentStep === 'email') {
          if (e.email) return Promise.reject(new SubmissionError(e));
        } else if (currentStep === 'employees') {
          if (e.employees) return Promise.reject(new SubmissionError(e));
          if (e._error) {
            return Promise.reject(
              new SubmissionError({
                _error: e._error,
              }),
            );
          }
        }
      });

  onEmployeeClick = employee => {
    const { selectedEmployees } = this.state;
    let modifiedEmployees = [];
    if (selectedEmployees.indexOf(employee) > -1) {
      modifiedEmployees = selectedEmployees.filter(el => el !== employee);
    } else {
      modifiedEmployees = [...selectedEmployees, employee];
    }

    this.setState({
      selectedEmployees: modifiedEmployees,
    });
  };

  setRegistrationConfig = data => {
    this.setState({ ...data });
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.context.socket.emit('waitinglist.registration.init');
      this.context.socket.on(
        'waitinglist.registration.config',
        this.setRegistrationConfig,
      );
      this.context.socket.on('queue.setEmployees', this.setEmployees);
    }
  }

  componentWillUnmount() {
    if (process.env.BROWSER) {
      clearTimeout(this.registrationFormResetTimeout);
      clearTimeout(this.successStepTimeout);
      this.context.socket.off(
        'waitinglist.registration.config',
        this.setRegistrationConfig,
      );
      this.context.socket.off('queue.setEmployees', this.setEmployees);
    }
  }

  render() {
    // if (!this.state.welcomeMessage) {
    //   return <ReloadButton />;
    // }
    return (
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <Row>
                <Col xs={{ size: 8, offset: 2 }}>
                  <Row>
                    <Col>
                      <RegistrationForm
                        selectedEmployees={this.state.selectedEmployees}
                        listOfEnabledEmployees={this.state.listOfEnabledEmployees}
                        initialValues={this.state.initialRegistrationValues}
                        disabled={this.state.disabled}
                        steps={this.state.steps}
                        welcomeMessage={this.state.welcomeMessage}
                        showTimeoutModal={this.state.showTimeoutModal}
                        onEmployeeClick={this.onEmployeeClick}
                        onSubmit={this.submitRegistration}
                        setStep={this.setStep}
                        skipStep={this.skipStep}
                        clearSkip={this.clearSkip}
                        unSkipStep={this.unSkipStep}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default withStyles(s)(Registration);
