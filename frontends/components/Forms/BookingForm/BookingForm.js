import 'react-dates/initialize';
import {
  isSameDay,
} from 'react-dates';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Alert, Button, Col, Row } from 'reactstrap';
import {
  change,
  Field,
  formValueSelector,
  getFormSubmitErrors,
  reduxForm,
  stopSubmit,
} from 'redux-form';
import shortId from 'shortid';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash.get';
import _ from 'lodash';
import history from '../../../history';
import Avatar from '../../Avatar';
import DayPickerSingle from '../../DatePicker/DayPickerSingle';
import { RenderField } from '../RenderField';
import { loggedIn } from '../../../core/utils';

const BackButton = props => (
  <Row className="mt-4 justify-content-center">
    <Col xs={12} md={6}>
      <Button className="btn-light w-100" onClick={() => props.goBack()}>
        Go Back
      </Button>
    </Col>
  </Row>
);

const Header = ({ route }) => {
  if (route.path === '/summary') {
    return <h1>Your Appointment</h1>;
  }
  return <h1>Book an Appointment</h1>;
};

const FORM_NAME = 'booking';

function RenderServicesField({ input }) {
  const onClick = selected => {
    const services = input.value.slice();
    const index = services.findIndex(el => selected.id === el.id);
    const service = services[index];
    if (index > -1) {
      services.splice(index, 1, {
        ...service,
        ...{ selected: !service.selected },
      });
    }
    this.resetDatePicker();

    const { selectedEmployee } = this.props;
    // if (
    //   selectedEmployee &&
    //   Array.isArray(selectedEmployee.items) &&
    //   selectedEmployee.items.length > 0
    // ) {
    //   if (selectedEmployee.items.indexOf(selected.id) === -1) {
    //
    //   }
    // }

    this.context.store.dispatch(change(FORM_NAME, 'selectedEmployee', null));
    this.context.store.dispatch(change(FORM_NAME, 'employees', null));

    return input.onChange(services);
  };

  return (
    <React.Fragment>
      {input.value && input.value.map(el => (
        <Row key={shortId.generate()}>
          <Col
            xs={12}
            className="d-table pl-0 pr-0 mt-2"
            onClick={e => {
              e.preventDefault();
              return onClick(el);
            }}
          >
            <div
              className={`card card-body d-table-cell align-middle w-100 booking-service ${classNames(
                { active: el.selected },
              )}`}
            >
              <h5>{el.name}</h5>
              <span className="text-muted">{el.time.name}</span>
              <div className="booking-service-price">${el.priceAppt / 100}</div>
            </div>
          </Col>
        </Row>
      ))}
    </React.Fragment>
  );
}

function RenderSelectedServicesField({ input }) {
  return (
    <React.Fragment>
      {input.value.map(
        el =>
          el.selected && (
            <Row key={shortId.generate()}>
              <Col xs={12} className="d-table pl-0 pr-0">
                <div className="card card-body d-table-cell align-middle w-100 booking-service">
                  <h5>{el.name}</h5>
                  <span className="text-muted">{el.time.name}</span>
                  <div className="booking-service-price">
                    ${el.priceAppt / 100}
                  </div>
                </div>
              </Col>
            </Row>
          ),
      )}
    </React.Fragment>
  );
}

function RenderSelectedEmployee({ input }) {
  const employee = input.value;
  return (
    <React.Fragment>
      <Row>
        <Col xs={12} className="d-table pl-0 pr-0">
          <div className="card card-body d-table-cell align-middle w-100 employee-select">
            <React.Fragment>
              <Avatar
                className="d-inline"
                color="#4285f4"
                size={50}
                src={employee.avatar}
                name={`${employee.firstName} ${employee.lastName}`}
              />
              <div className="ml-3 d-inline">{employee.username}</div>
            </React.Fragment>
            {/* <div className="employee-select-action"> */}
            {/*  <i className="icon-arrow-down"></i> */}
            {/* </div> */}
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
}

function RenderEmployeesField({ input, employees }) {
  const previouslySelected = this.props.selectedEmployee || {};
  const { value } = input;

  const onClick = async clicked => {
    await this.context.store.dispatch(
      change(FORM_NAME, 'selectedEmployee', clicked),
    );
    this.context.store.dispatch(change(FORM_NAME, 'time', null));
    // this.toggleShowEmployeeSelect();
    this.resetDatePicker();
    // this.props.fetchSchedule(clicked, this.selectedServices);
    input.onChange(clicked);
    this.setStep('date');
  };

  return (
    <React.Fragment>
      {Array.isArray(employees) &&
        employees.map(employee => (
          <Row key={shortId.generate()}>
            <Col
              xs={12}
              className="d-table pl-0 pr-0 mt-2"
              onClick={e => {
                e.preventDefault();
                return onClick(employee);
              }}
            >
              <div
                className={`card card-body d-table-cell align-middle w-100 employee-select ${classNames(
                  { active: value.id === employee.id },
                )}`}
              >
                {
                  <React.Fragment>
                    <Avatar
                      className="d-inline"
                      color="#4285f4"
                      size={55}
                      src={employee.avatar}
                      name={`${employee.firstName} ${employee.lastName}`}
                    />
                    <div className="ml-3 d-inline">{employee.username}</div>
                    <div className="booking-service-price">
                      <span className="text-muted">Select</span>
                    </div>
                  </React.Fragment>
                }
              </div>
            </Col>
          </Row>
        ))}
    </React.Fragment>
  );
}

const TimeBlock = ({ timeBlock, classNames, onClick }) => (
  <div className="mb-1 p-0 timeline col-12" onClick={onClick}>
    <div className={`btn btn-block btn-outline-success ${classNames}`}>
      {timeBlock}
    </div>
  </div>
);

const TimeBlockHeader = ({ header }) => (
  <div className="mb-2 p-0 timeline col-12 text-muted text-center">
    {header}
  </div>
);

/**
 * @return {null}
 */
function RenderTimeBlocks({ input, timeBlocks }) {
  if (!this.state.selectedDate || !timeBlocks) return null;

  const onClick = timeBlock => {
    input.onChange(timeBlock);
    return this.setStep('summary');
  };

  const morningItems = [
    <TimeBlockHeader key={shortId.generate()} header="Morning" />,
  ];
  const afterNoonItems = [
    <TimeBlockHeader key={shortId.generate()} header="Afternoon" />,
  ];
  const eveningItems = [
    <TimeBlockHeader key={shortId.generate()} header="Evening" />,
  ];

  const noon = moment(this.state.selectedDate)
    .add(12, 'hours')
    .unix();
  const evening = noon + 3600 * 5;

  let block = morningItems;

  for (let i = 0; i < timeBlocks.length; i++) {
    const timeBlock = timeBlocks[i];
    if (timeBlock >= noon && timeBlock <= evening) {
      block = afterNoonItems;
    } else if (timeBlock >= evening) {
      block = eveningItems;
    }
    block.push(
      <TimeBlock
        classNames={classNames({ active: timeBlock === this.props.time })}
        key={shortId.generate()}
        onClick={() => onClick(timeBlock)}
        timeBlock={moment.unix(timeBlock).format('LT')}
      />,
    );
  }

  return (
    <Row>
      <Col xs={4} className="pl-0 pr-0">
        {morningItems}
      </Col>
      <Col xs={4} className="pl-1 pr-1">
        {afterNoonItems}
      </Col>
      <Col xs={4} className="pr-0 pl-0">
        {eveningItems}
      </Col>
    </Row>
  );
}

// const RenderVacations = () =>
//   <span className="text-muted">Note: </span>;

class BookingForm extends React.Component {
  state = {
    initialMonth: moment(),
    visibleMonth: moment(),
    selectedDate: false,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    if (process.env.BROWSER) {
      this.portalRoot = document.querySelector('.app-body');
    }

    this.RenderSelectedEmployee = RenderSelectedEmployee.bind(this);
    this.RenderServicesField = RenderServicesField.bind(this);
    this.RenderEmployeesField = RenderEmployeesField.bind(this);
    this.RenderTimeBlocks = RenderTimeBlocks.bind(this);
    this.RenderSelectedServicesField = RenderSelectedServicesField.bind(this);
  }

  get totalApptPrice() {
    return (
      Array.isArray(this.props.services) &&
      this.props.services.reduce((acc, curr) => {
        if (curr.selected) {
          return curr.priceAppt + acc;
        }
        return acc;
      }, 0)
    );
  }

  setStep = (stepName = '') => {
    if (stepName === 'employees') {
      this.props.fetchEmployees(this.selectedServices);
    }
    if (
      stepName === 'date' &&
      this.selectedEmployeeId &&
      this.selectedServices
    ) {
      this.resetDatePicker();
      this.props.fetchSchedule(
        { id: this.selectedEmployeeId },
        this.selectedServices,
      );
    }

    if (!this.selectedServices) {
      return history.push('/book/');
    }

    history.push(`/book/${stepName}`);
  };

  get selectedServices() {
    const services =
      this.props.services || _.get(this.props, 'initialValues.services');
    return (
      Array.isArray(services) && services.filter(service => service.selected)
    );
  }

  get route() {
    return this.props.route;
  }

  goBack = () => {
    switch (true) {
      case /employees/.test(this.route.path):
        this.setStep();
        break;
      case /date/.test(this.route.path):
        this.setStep('employees');
        break;
      case /time/.test(this.route.path):
        this.setStep('date');
        break;
      case /summary/.test(this.route.path):
        this.setStep('time');
        break;
      default:
        this.setStep();
    }
  };

  cacheToSession = () => {
    if (process.env.BROWSER && typeof Storage !== 'undefined') {
      const values = {
        selectedEmployee: this.props.selectedEmployee,
        employees: this.props.employees,
        time: this.props.time,
        services: this.props.services,
        timestamp: Math.floor(new Date().getTime() / 1000),
      };
      sessionStorage.setItem('appointment', JSON.stringify(values));
    }
  };

  priceToText = price => `$${price / 100}`;

  resetDatePicker = () => {
    this.setState({
      initialMonth: moment(),
      visibleMonth: moment(),
      selectedDate: moment(),
    });
    this.context.store.dispatch(change(FORM_NAME, 'schedule', null));
    this.context.store.dispatch(change(FORM_NAME, 'time', null));
  };

  setVisibleMonth = month => this.setState({ visibleMonth: month });

  vacationDates = () => {
    const selectedEmployeeId = _.get(this.props, 'selectedEmployee.id');
    const schedule = this.props.schedule[selectedEmployeeId];
    if (schedule && schedule.vacationDates) return schedule.vacationDates;
  };

  setStepEmployees = async () => {
    // await this.props.fetchEmployees(this.selectedServices);
    this.setStep('employees');
  };

  get time() {
    return _.get(this.props, 'time') || _.get(this.props, 'initialValues.time');
  }

  get selectedEmployeeId() {
    return (
      _.get(this.props, 'selectedEmployee.id') ||
      _.get(this.props, 'initialValues.selectedEmployee.id')
    );
  }

  get selectedEmployeeSchedule() {
    if (!this.selectedEmployeeId) return {};
    return this.props.schedule[this.selectedEmployeeId] || {};
  }

  selectedEmployeeDay = timeStamp => {
    const day = _.get(this.selectedEmployeeSchedule, `[${timeStamp}]`);
    if (day) {
      return day;
    }
  };

  get selectedDayTimeBlocks() {
    if (!this.state.selectedDate) return;
    const day = this.state.selectedDate.unix();
    return this.selectedEmployeeDay(day);
  }

  get selectedDate() {
    if (this.state.selectedDate) return this.state.selectedDate;
    if (
      this.selectedEmployeeId &&
      _.get(
        this.props,
        `schedule.[${this.selectedEmployeeId}][${moment()
          .startOf('day')
          .unix()}]`,
      )
    ) {
      return moment();
    }
    return null;
  }

  refreshSchedule() {
    if (this.selectedEmployeeId) {
      this.props.fetchSchedule(
        this.props.selectedEmployee,
        this.selectedServices,
      );
    }
  }

  check = () => {
    this.context.store.dispatch(
      stopSubmit('booking', {
        formInfo: null,
      }),
    );
    switch (true) {
      case this.route.path === '':
        if (
          !this.props.services ||
          !_.get(this.props, 'initialValues.services')
        ) {
          this.props.fetchServices();
        }
        break;
      case /employees/.test(this.route.path):
        // if (!this.props.employees && !_.isEmpty(this.selectedServices)) {
        //   this.props.fetchEmployees(this.selectedServices);
        // }
        break;
      case /date/.test(this.route.path):
        if (!this.selectedEmployeeId) {
          this.setStep();
        }

        if (_.isEmpty(this.selectedEmployeeSchedule)) {
          this.setStep();
        }
        break;
      case /time/.test(this.route.path):
        if (!this.time) {
          this.setStep();
        }
        if (_.isEmpty(this.selectedEmployeeSchedule)) {
          this.setStep();
        }
        break;
      case /summary/.test(this.route.path):
        if (!this.selectedServices || !this.selectedEmployeeId || !this.time) {
          this.setStep();
        }
        break;
    }
  };

  handleSubmit = e => {
    e.preventDefault();
    const formData = {
      services: this.props.services.filter(el => el.selected).map(el => el.id),
      time: this.props.time,
      employees: [
        _.get(this.props, 'selectedEmployee.username')
      ],
      note: this.props.note,
    };
    return this.props.onSubmit(formData).then(data => {
      if (process.env.BROWSER && typeof Storage !== 'undefined') {
        sessionStorage.removeItem('appointment');
      }
      if (_.get(data, 'record.id')) {
        history.push(`/appointments/${data.record.id}`);
      }
    });
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.check();

      window.onpopstate = e => {
        this.check();
        e.preventDefault();
      };
    }
  }

  componentWillUnmount() {
    window.onpopstate = () => {};
  }

  render() {
    const {
      error,
      handleSubmit,
      submitting,
      submitErrors,
      invalid,
      disabled,
      meta,
      initialValues,
    } = this.props;

    if (meta.enabled === false) {
      return (
        <React.Fragment>
          <div className="text-center justify-content-center mb-2">
            <i className="icon-info font-4xl" />
          </div>
          <h4 className="text-center">
            For technical reasons, appointments temporarily not available.
          </h4>
          <h4 className="text-center">
            We are doing our best to resolve the problem as quickly as possible.
          </h4>
        </React.Fragment>
      );
    }

    const { totalApptPrice } = this;

    if (this.selectedServices.length === 0) {
      this.context.store.dispatch(change(FORM_NAME, 'employees', null));
      this.setStep();
    }

    let RenderSection;

    switch (true) {
      case /employees/.test(this.route.path):
        RenderSection = (
          <React.Fragment>
            <Row className="mb-2 justify-content-center">
              <h5>Select Your Barber</h5>
            </Row>
            <Field
              name="employees"
              employees={this.props.listOfEmployees}
              component={this.RenderEmployeesField}
            />
            {this.selectedEmployeeId && (
              <Row className="justify-content-center">
                <Col xs={12} md={6} className="justify-content-center">
                  <Button
                    onClick={() => {
                      // this.resetDatePicker();
                      // this.props.fetchSchedule(
                      //   { id: this.selectedEmployeeId },
                      //   this.selectedServices,
                      // );
                      this.setStep('date');
                    }}
                    className="mt-4 w-100"
                    color="success"
                  >
                    Next
                  </Button>
                </Col>
              </Row>
            )}
            <BackButton
              submitting={submitting}
              goBack={this.goBack}
              disabled={disabled}
            />
          </React.Fragment>
        );
        break;
      case /date/.test(this.route.path):
        RenderSection = (
          <React.Fragment>
            <Row className="mb-2 justify-content-center">
              <h5>Select Date</h5>
            </Row>
            <Row className="mb-2 justify-content-center">
              <DayPickerSingle
                isOutsideRange={date => {
                  if (
                    !Object.keys(this.selectedEmployeeSchedule).some(day2 =>
                      isSameDay(date, moment.unix(day2)),
                    )
                  )
                    return true;
                  return false;
                }}
                date={this.selectedDate}
                navPrev={
                  this.state.visibleMonth.isSame(
                    this.state.initialMonth,
                    'month',
                  ) && <a disabled />
                }
                // navNext={<a disabled ></a>}
                focused
                onPrevMonthClick={this.setVisibleMonth}
                onNextMonthClick={this.setVisibleMonth}
                onDateChange={date => {
                  this.context.store.dispatch(change(FORM_NAME, 'time', null));
                  this.setState({ selectedDate: date.startOf('day') });
                  this.setStep('time');
                }}
                hideKeyboardShortcutsPanel
                daySize={window.innerWidth <= 320 ? 32 : 48}
              />
            </Row>
            {/* { */}
            {/*  this.vacationDates() && ( */}
            {/*    <Row className="justify-content-center"> */}
            {/*      <RenderVacations/> */}
            {/*    </Row> */}
            {/*  ) */}
            {/* } */}
            <BackButton
              submitting={submitting}
              goBack={this.goBack}
              disabled={disabled}
            />
          </React.Fragment>
        );
        break;
      case /time/.test(this.route.path):
        RenderSection = (
          <React.Fragment>
            <Row className="mb-2 justify-content-center">
              <h5>Select Time</h5>
            </Row>
            <Row className="mb-2 justify-content-center">
              <Col xs={12}>
                <Field
                  name="time"
                  timeBlocks={this.selectedDayTimeBlocks}
                  component={this.RenderTimeBlocks}
                />
              </Col>
            </Row>
            <BackButton
              submitting={submitting}
              goBack={this.goBack}
              disabled={disabled}
            />
          </React.Fragment>
        );
        break;
      case /summary/.test(this.route.path):
        this.cacheToSession();

        RenderSection = (
          <React.Fragment>
            <Row className="mb-2 justify-content-center">
              <h5>Summary</h5>
            </Row>
            <Row className="mb-2 justify-content-center">
              <Col xs={12}>
                <Row className="mb-2">
                  <h6 className="text-muted">Services</h6>
                </Row>
                <Field
                  name="services"
                  component={this.RenderSelectedServicesField}
                />
                <Row className="justify-content-center mt-2">
                  <h6 className="text-muted" onClick={() => this.setStep()}>
                    Change
                  </h6>
                </Row>
                <Row className="mb-2 mt-3">
                  <h6 className="text-muted">Barber</h6>
                </Row>
                <Field
                  name="selectedEmployee"
                  component={this.RenderSelectedEmployee}
                />
              </Col>
              <Row className="mt-2 justify-content-center">
                <h6
                  className="text-muted"
                  onClick={() => this.setStep('employees')}
                >
                  Change
                </h6>
              </Row>
            </Row>
            <Row className="mb-2 mt-3">
              <h6 className="text-muted">Date & Time </h6>
            </Row>
            <Row>
              <Col xs={12} className="d-table pl-0 pr-0">
                <div className="date-card card card-body d-table-cell align-middle w-100 employee-select">
                  <React.Fragment>
                    <i className="icon-calendar" />
                    <h5 className="date-text">
                      <b>
                        {moment
                          .unix(this.props.time)
                          .format('dddd, MMMM Do, YYYY')}
                      </b>
                    </h5>
                    <h5 className="date-text mb-0">
                      at {moment.unix(this.props.time).format('hh:mm a')}
                    </h5>
                  </React.Fragment>
                </div>
              </Col>
            </Row>
            <Row className="mt-2 justify-content-center">
              <h6 className="text-muted" onClick={() => this.setStep('date')}>
                Change
              </h6>
            </Row>
            <Row className="mb-2 mt-3">
              <h6 className="text-muted">Add a note </h6>
            </Row>
            <Row>
              <Col className="d-table pl-0 pr-0" xs={12}>
                <div className="date-card card card-body d-table-cell align-middle w-100 pr-0 pl-0 employee-select">
                  <Field
                    size="mb-4"
                    name="note"
                    component={RenderField}
                    type="text"
                    className="form-control"
                    placeholder="Note"
                  />
                </div>
              </Col>
            </Row>

            <Row className="mb-2 mt-3">
              <h6 className="text-muted">Rules & restrictions</h6>
            </Row>
            <Row>
              <Col xs={12} className="d-table pl-0 pr-0">
                <div className="card card-body d-table-cell align-middle w-100 booking-service">
                  <h5>Cancellation policy</h5>
                  <span className="text-muted">
                    If you made a booking and cannot attend, please cancel your
                    booking in advance
                  </span>
                </div>
              </Col>
            </Row>
            <Row className="mb-2 mt-3">
              <h6 className="text-muted">Pricing Info</h6>
            </Row>
            <Row>
              <Col xs={12} className="d-table pl-0 pr-0">
                <div className="card card-body d-table-cell align-middle w-100 booking-service">
                  <h5>{this.priceToText(totalApptPrice)}</h5>
                  <span className="text-muted">Pay in person</span>
                </div>
              </Col>
            </Row>
            {loggedIn(_.get(this.context.store.getState(), 'user')) ? (
              <Row className="mt-4 justify-content-center">
                <Col xs={12} md={6}>
                  <Button
                    className="mt-5 pt-2 w-100"
                    tabIndex={-1}
                    disabled={submitting || disabled}
                    color="success"
                  >
                    Confirm
                  </Button>
                </Col>
              </Row>
            ) : (
              <React.Fragment>
                <Row className="mt-4 justify-content-center">
                  <h6 className="text-muted">Sign In to continue</h6>
                </Row>
                <Row className="justify-content-center">
                  <Col xs={12} md={8}>
                    <Button
                      className="pt-2 w-100"
                      tabIndex={-1}
                      onClick={() => history.push('/signup')}
                      disabled={submitting || disabled}
                      color="success"
                    >
                      Continue with email
                    </Button>
                  </Col>
                </Row>
                <Row className="mt-2 justify-content-center text-center">
                  <span className="text-muted">or</span>
                </Row>
                <Row className="mt-2 justify-content-center text-center">
                  <Col xs={12} md={8}>
                    <Button
                      className="pt-2 w-100 btn-facebook "
                      tabIndex={-1}
                      onClick={() => history.push('/auth/facebook/connect')}
                      disabled={submitting || disabled}
                      color="primary"
                    >
                      Continue with Facebook
                    </Button>
                  </Col>
                </Row>
              </React.Fragment>
            )}
            <Row className="mt-3 mb-4 justify-content-center">
              <h6 className="text-muted">
                By continuing you agree to{' '}
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    history.push('/terms');
                  }}
                >
                  Terms of Service
                </a>
              </h6>
            </Row>
            <BackButton
              submitting={submitting}
              goBack={this.goBack}
              disabled={disabled}
            />
          </React.Fragment>
        );
        break;
      default:
        RenderSection = (
          <React.Fragment>
            <Row className="mb-2 justify-content-center">
              <h5>Select Services</h5>
            </Row>
            <Field name="services" component={this.RenderServicesField} />
            <Row className="justify-content-center">
              <Col xs={12} md={6} className="justify-content-center">
                <Button
                  onClick={() => this.setStepEmployees()}
                  className="mt-4 w-100"
                  disabled={
                    !this.selectedServices.length || submitting || disabled
                  }
                  color="success"
                >
                  Next
                </Button>
              </Col>
            </Row>
          </React.Fragment>
        );
        break;
    }

    return (
      <form onSubmit={this.handleSubmit}>
        <fieldset disabled={submitting || disabled}>
          <Row className="justify-content-center text-center">
            <Header route={this.route} />
          </Row>
          {error && <Alert color="danger">{error}</Alert>}
          {_.get(submitErrors, 'formInfo') && (
            <Alert color="info">
              {this.context.translate(submitErrors.formInfo)}
            </Alert>
          )}
          {_.get(submitErrors, 'form') && (
            <Alert color="danger">
              {this.context.translate(submitErrors.form)}
            </Alert>
          )}
          {RenderSection}
        </fieldset>
        {/* {process.env.BROWSER && */}
        {/*  this.props.route.path !== '/summary' && */}
        {/*  ReactDOM.createPortal( */}
        {/*    <Footer fixed className="justify-content-center"> */}
        {/*      <Col xs={12} md={8}> */}
        {/*        /!* {totalApptPrice > 0 && *!/ */}
        {/*        /!*  `Total ${this.priceToText(totalApptPrice)}`} *!/ */}
        {/*        /!* {this.route.path && ( *!/ */}
        {/*        /!*  <Button *!/ */}
        {/*        /!*    onClick={() => this.goBack()} *!/ */}
        {/*        /!*    className="w-25 float-right" *!/ */}
        {/*        /!*    tabIndex={-1} *!/ */}
        {/*        /!*    disabled={submitting || disabled} *!/ */}
        {/*        /!*    color="success" *!/ */}
        {/*        /!*  > *!/ */}
        {/*        /!*    Back *!/ */}
        {/*        /!*  </Button> *!/ */}
        {/*        /!* )} *!/ */}

        {/*        /!* { *!/ */}
        {/*        /!*  this.state.showSelectEmployees && ( *!/ */}
        {/*        /!*    <Button *!/ */}
        {/*        /!*      className="float-right" *!/ */}
        {/*        /!*      disabled={submitting || disabled} *!/ */}
        {/*        /!*      color="success" *!/ */}
        {/*        /!*      onClick={this.toggleShowEmployeeSelect} *!/ */}
        {/*        /!*    > *!/ */}
        {/*        /!*      Back *!/ */}
        {/*        /!*    </Button> *!/ */}
        {/*        /!*  ) *!/ */}
        {/*        /!* } *!/ */}

        {/*        /!* { *!/ */}
        {/*        /!*  !this.state.showSelectEmployees && ( *!/ */}
        {/*        /!*    <Button *!/ */}
        {/*        /!*      className="float-right" *!/ */}
        {/*        /!*      disabled={submitting || disabled} *!/ */}
        {/*        /!*      color="success" *!/ */}
        {/*        /!*    > *!/ */}
        {/*        /!*      Book Now *!/ */}
        {/*        /!*    </Button> *!/ */}
        {/*        /!*  ) *!/ */}
        {/*        /!* } *!/ */}
        {/*      </Col> */}
        {/*    </Footer>, */}
        {/*    this.portalRoot, */}
        {/*  )} */}
      </form>
    );
  }
}
let bookingForm = reduxForm({
  destroyOnUnmount: false,
  form: FORM_NAME,
  enableReinitialize: true,
  touchOnChange: true,
})(BookingForm);

const selector = formValueSelector(FORM_NAME);

bookingForm = connect(state => {
  if (get(state, `form.${FORM_NAME}`)) {
    const { time, services, employees, selectedEmployee, note } = selector(
      state,
      'time',
      'services',
      'employees',
      'selectedEmployee',
      'note',
    );

    return {
      submitErrors: getFormSubmitErrors(FORM_NAME)(state),
      employees,
      note,
      time,
      selectedEmployee,
      services,
    };
  }
  return {};
})(bookingForm);

export {
  RenderSelectedServicesField,
  RenderTimeBlocks,
  RenderServicesField,
  RenderSelectedEmployee,
};
export default bookingForm;
