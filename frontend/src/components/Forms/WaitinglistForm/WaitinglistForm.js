import React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Col,
  ModalBody,
  Row,
  ModalHeader,
  ModalFooter,
  InputGroupText,
} from 'reactstrap';
import {
  Field,
  FormSection,
  formValueSelector,
  getFormSubmitErrors,
  reduxForm,
  change,
} from 'redux-form';
import get from 'lodash.get';
import shortId from 'shortid';
import _ from 'lodash';
import moment from 'moment';
import humanizeDuration from 'humanize-duration';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { RenderField } from '../RenderField';
import Avatar from '../../Avatar';
import ScrollingEmployees from '../../ScrollingEmployees';
import {
  callPhoneNumberLink,
  sendEmailLink,
  sendSmsLink,
} from '../../../core/utils';
import {
  WAITING_LIST_TYPE_RESERVED,
  WAITING_LIST_TYPE_APPOINTMENT,
  WAITING_LIST_TYPE_UNAVAILABLE,
  WAITING_LIST_TYPE_WALK_IN,
  WAITING_LIST_STATUS_CONFIRMED,
  WAITING_LIST_STATUS_NOT_CONFIRMED,
  WAITING_LIST_STATUS_CANCELED,
} from '../../../constants';
import RenderDatePicker from '../RenderDatePicker';

const FORM_NAME = 'waitinglistForm';

function RenderTimeline({ input }) {
  const { id } = this.props.initialValues;
  const timeline = input.value.slice();

  if (timeline.length === 0) {
    return (
      <Col xs={12} className="mt-5 mb-5 text-center">
        <span>Selected employee does not have hours for the selected date</span>
      </Col>
    );
  }

  const itemsPerColumn = Math.round(timeline.length / 3);
  const items = [];

  const onClick = selected => {
    this.setTotalServiceTime(this.props.services);
    const timeline = this.getTimeline(input.value.slice(), selected);
    return input.onChange(timeline);
  };

  const clear = () => {
    const clearTimeline = this.clearTimeline([...input.value]);
    return input.onChange(clearTimeline);
  };

  for (let i = 0; i < timeline.length; i++) {
    const el = timeline[i];
    const nextEl = timeline[i + 1] || {};
    const classes = {
      'btn btn-block': true,
      'btn-outline-success': !el.type,
      'btn-success': id === el.id,
      // 'btn-dark disabled':
      //   id !== el.id && el.type === WAITING_LIST_TYPE_RESERVED,
      'btn-secondary disabled':
        id !== el.id && (el.type === WAITING_LIST_TYPE_APPOINTMENT || el.type === WAITING_LIST_TYPE_RESERVED),
      'btn btn-outline-warning': id === el.id && el.type === 'hint',
    };
    nextEl.timeBlock - el.timeBlock === this.timeStep &&
      items.push(
        <Col xs={12} className="mb-1 p-0" key={shortId.generate()}>
          <div className={classNames(classes)} onClick={() => onClick(el)}>
            {moment.unix(el.timeBlock).format('LT')} -{' '}
            {moment.unix(nextEl.timeBlock).format('LT')}
          </div>
        </Col>,
      );
  }

  return (
    <React.Fragment>
      <Row>
        <Col xs={4}>{items.splice(0, itemsPerColumn)}</Col>
        <Col xs={4}>{items.splice(0, itemsPerColumn)}</Col>
        <Col xs={4}>{items.splice(0, itemsPerColumn)}</Col>
      </Row>
      <Row>
        <Col className="text-center mt-3" xs={12}>
          <button
            onClick={e => {
              e.preventDefault();
              clear();
            }}
            className="btn btn-link btn-block text-overflow"
          >
            Clear Selected
          </button>
        </Col>
      </Row>
    </React.Fragment>
  );
}

const RenderStatus = ({ input, name }) => {
  const onClick = status => input.onChange(status);
  return (
    <Row>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_STATUS_CONFIRMED);
          }}
          className={`btn btn-outline-success btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_STATUS_CONFIRMED && 'active'}`}
        >
          Confirmed
        </button>
      </Col>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_STATUS_NOT_CONFIRMED);
          }}
          className={`btn btn-outline-warning btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_STATUS_NOT_CONFIRMED && 'active'}`}
        >
          Not Confirmed
        </button>
      </Col>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_STATUS_CANCELED);
          }}
          className={`btn btn-outline-danger btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_STATUS_CANCELED && 'active'}`}
        >
          Canceled
        </button>
      </Col>
    </Row>
  );
};

const RenderType = ({ input, name }) => {
  const onClick = type => input.onChange(type);
  return (
    <Row>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_TYPE_WALK_IN);
          }}
          className={`btn btn-outline-success btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_TYPE_WALK_IN && 'active'}`}
        >
          Walk-In
        </button>
      </Col>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_TYPE_APPOINTMENT);
          }}
          className={`btn btn-outline-success btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_TYPE_APPOINTMENT && 'active'}`}
        >
          Appointment
        </button>
      </Col>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_TYPE_RESERVED);
          }}
          className={`btn btn-outline-success btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_TYPE_RESERVED && 'active'}`}
        >
          Reserved
        </button>
      </Col>
    </Row>
  );
};

function RenderServices({ input, name, items, showAll }) {
  const onClick = el => {
    const services = input.value.slice();
    const serviceIndex = services.findIndex(
      service => service.name === el.name,
    );
    let allServices = [...services, ...[el]];
    if (serviceIndex > -1) {
      services.splice(serviceIndex, 1);
      allServices = [...services];
    }
    const totalServicesTime = this.setTotalServiceTime(allServices);

    if (el.notFound) {
      input.value.splice(serviceIndex, 1);
      this.context.store.dispatch(change(FORM_NAME, 'meta.items', input.value));
    }

    this.context.store.dispatch(
      change(
        FORM_NAME,
        'timeline',
        this.getTimeline(this.props.timeline, {}, totalServicesTime),
      ),
    );
    return input.onChange(allServices);
  };

  return (
    <React.Fragment>
      {items.map(el => (
        <Col
          xs={4}
          key={shortId.generate()}
          className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2"
        >
          {el.notFound ? (
            <button
              onClick={e => {
                e.preventDefault();
                onClick(el);
              }}
              className="btn btn-block btn-lg text-overflow disabled"
            >
              {el.name}
            </button>
          ) : (
            <button
              onClick={e => {
                e.preventDefault();
                onClick(el);
              }}
              className={`select-services-list btn btn-outline-success btn-block btn-lg text-overflow ${
                input.value.findIndex(service => service.name === el.name) > -1
                  ? 'active'
                  : ''
              }`}
            >
              {el.name}
            </button>
          )}
          <span className="badge badge-light">{el.time.name}</span>
        </Col>
      ))}
    </React.Fragment>
  );
}

const SHOW_ALL = 1;
const SHOW_ONLY_WORKING = 2;
const SHOW_ACCEPT_APPOINTMENTS = 3;

class WaitinglistForm extends React.Component {
  static contextTypes = {
    intl: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  state = {
    listOfEmployeesType: null,
    showAllServices: false,
    items: [],
    totalServiceTime: null,
  };

  constructor(props) {
    super(props);
    this.RenderTimeline = RenderTimeline.bind(this);
    this.RenderServices = RenderServices.bind(this);
  }

  setTotalServiceTime = services => {
    const totalServiceTime = services.reduce(
      (acc, current) => acc + _.get(current, 'time.id', 0),
      0,
    );
    this.setState({ totalServiceTime });
    return totalServiceTime;
  };

  get timelineFrom() {
    const timeline = this.props.timeline || null;
    if (!timeline) return null;
    const fromTimeIndex = this.props.timeline.findIndex(
      el => el.id === this.props.initialValues.id,
    );
    return fromTimeIndex > -1 && this.props.timeline[fromTimeIndex];
  }

  get timelineTo() {
    const timeline = this.props.timeline || null;
    if (!timeline) return null;
    const toTimeIndex = _.findLastIndex(
      timeline,
      el =>
        el.id === this.props.initialValues.id,
    );
    return toTimeIndex > -1 && timeline[toTimeIndex];
  }

  get timeStep() {
    return _.get(this.props.initialValues, 'timeStep.id');
  }

  getTimeline(initialTimeline = [], selected = {}, servicesTime) {
    const timeline = initialTimeline.slice();
    const { id } = this.props.initialValues;
    const { timeStep } = this;
    let { totalServiceTime } = this;
    let selectedTimeBlock = selected.timeBlock;
    if (servicesTime) {
      totalServiceTime = servicesTime;
    }

    const fromIndex = timeline.findIndex(el => el.from);
    const toIndex = timeline.findIndex(el => el.to);

    const from = fromIndex > -1;
    const to = toIndex > -1;

    if (!selected.timeBlock && from) {
      selectedTimeBlock = timeline[fromIndex].timeBlock;
    }

    if (selected && typeof selected.id !== 'undefined' && selected.id !== id) {
      return;
    }

    const clickedIndex = timeline.findIndex(
      el => el.timeBlock === selectedTimeBlock,
    );

    // Time when selected services end
    const totalServiceTimeEnd =
      selectedTimeBlock + ((totalServiceTime % timeStep) + totalServiceTime);

    const occupy = (arr, fromIndex, toIndex, data) => {
      for (let i = fromIndex; i < toIndex + 1; i++) {
        arr.splice(i, 1, { ...arr[i], ...data });
      }
    };

    const pathIsClear = (arr, fromIndex, toIndex) => {
      for (let i = fromIndex; i < toIndex + 1; i++) {
        if (
          (arr[i].id && arr[i].id !== id) ||
          arr[i].type === WAITING_LIST_TYPE_UNAVAILABLE ||
          arr[i].type === WAITING_LIST_TYPE_RESERVED
        ) {
          this.context.showNotification('Wrong time blocks selected', 'error');
          return false;
        }
      }
      return true;
    };

    if (from && !to) {
      const data = { id, type: WAITING_LIST_TYPE_APPOINTMENT, to: true };

      for (let i = 0; i < timeline.length; i++) {
        const el = timeline[i];

        if (el.type === 'hint') {
          timeline.splice(i, 1, { ...el, ...{ type: null } });
        }
        if (el.type === WAITING_LIST_TYPE_APPOINTMENT) break;
        if (!selected.timeBlock) {
          if (
            el.type !== WAITING_LIST_TYPE_APPOINTMENT &&
            el.timeBlock > selectedTimeBlock &&
            el.timeBlock < totalServiceTimeEnd
          ) {
            timeline.splice(i, 1, {
              timeBlock: el.timeBlock,
              id,
              type: 'hint',
            });
          }
        }
      }

      if (!selected.timeBlock) {
        return timeline;
      }

      if (
        fromIndex > clickedIndex &&
        pathIsClear(timeline, clickedIndex, fromIndex)
      ) {
        occupy(timeline, clickedIndex, fromIndex, data);
      } else if (pathIsClear(timeline, fromIndex, clickedIndex)) {
        occupy(timeline, fromIndex, clickedIndex, data);
      }
    } else if ((!from && !to) || (from && to && selected.timeBlock)) {
      for (let i = 0; i < timeline.length; i++) {
        const el = timeline[i];

        if (el.id === id && selectedTimeBlock) {
          timeline.splice(i, 1, { timeBlock: el.timeBlock });
        }
      }

      for (let i = 0; i < timeline.length; i++) {
        const el = timeline[i];
        if (
          el.timeBlock === selectedTimeBlock &&
          el.type !== WAITING_LIST_TYPE_APPOINTMENT &&
          el.type !== WAITING_LIST_TYPE_UNAVAILABLE
        ) {
          timeline.splice(i, 1, {
            timeBlock: el.timeBlock,
            id,
            type: 'appointment',
            from: true,
          });
        }
        if (
          selectedTimeBlock &&
          el.type !== WAITING_LIST_TYPE_APPOINTMENT &&
          el.timeBlock > selectedTimeBlock &&
          el.timeBlock < totalServiceTimeEnd
        ) {
          timeline.splice(i, 1, {
            timeBlock: el.timeBlock,
            id,
            type: 'hint',
          });
        }
        if (
          from &&
          timeline[i + 1] &&
          timeline[i + 1].type === WAITING_LIST_TYPE_APPOINTMENT
        )
          break;
      }
    }
    return timeline;
  }

  get totalServiceTime() {
    return this.props.services.reduce(
      (acc, current, initial) => acc + _.get(current, 'time.id', 0),
      0,
    );
  }

  setListOfEmployeesType = type => {
    this.setState({ listOfEmployeesType: type });
  };

  onShowAllServicesClick = () => {
    this.setState({
      showAllServices: !this.state.showAllServices,
      // items: !this.state.showAllServices
      //   ? [...this.items]
      //   : [...this.props.services],
    });
  };

  clearTimeline(timeline) {
    const { id } = this.props.initialValues;

    for (let i = 0; i < timeline.length; i++) {
      const el = timeline[i];

      if (el.type === 'hint') {
        timeline.splice(i, 1, { ...el, ...{ type: null } });
      } else if (el.id === id) {
        timeline.splice(i, 1, { timeBlock: el.timeBlock });
      }
    }

    return timeline;
  }

  get items() {
    return _.get(this.props, 'meta.items', []);
  }

  get services() {
    return _.get(this.props, 'services', []);
  }

  get initialValues() {
    return _.get(this.props, 'initialValues', []);
  }

  checkServices(selected = this.services, items = this.items) {
    const selectedServices = [...selected];
    const employeeServices = items;

    if (selectedServices.length === 0) return employeeServices;
    const result = [];
    employeeServices.map(service => {
      const index = selectedServices.findIndex(
        selectedService => selectedService.name === service.name,
      );
      if (index !== -1) {
        selectedServices.splice(index, 1);
      }
      result.push(service);
    });
    return [
      ...result,
      ...selectedServices.map(el => ({ ...el, ...{ notFound: true } })),
    ];
  }

  servicesExist(selected = this.services, items = this.items) {
    const index = items.findIndex(empService => empService.notFound === true);
    return index === -1;
  }

  setData(field, data) {
    this.context.store.dispatch(change(FORM_NAME, field, data));
  }

  setTimeline(timeline) {
    this.setData('timeline', timeline);
  }

  setItems(items) {
    this.setData('meta.items', items);
  }

  setServices(services) {
    this.setData('services', services);
  }

  componentDidMount() {
    this.setItems(
      this.checkServices(
        this.initialValues.services,
        this.initialValues.meta.items,
      ),
    );
    this.setTotalServiceTime([...this.initialValues.services]);
    if (this.initialValues.services.length === 0) {
      this.setState({
        showAllServices: true,
        // items: this.props.items,
      });
    }
  }

  setTimelineAndServices(employee, timeStamp = this.props.date) {
    this.context.socket.emit(
      'waitingList.get.timelineAndServices',
      employee,
      timeStamp,
      data => {
        if (data.items)
          this.setItems(this.checkServices(this.services, data.items));
        if (data.timeline) this.setTimeline(data.timeline);
        if (data.message) this.context.showNotification(data.message, 'warning');
      },
    );
    this.setTotalServiceTime([...this.services]);
  }

  render() {
    let listOFEmployees;

    const {
      error,
      handleSubmit,
      pristine,
      reset,
      submitting,
      invalid,
      timeline,
      initialValues,
      services,
      type,
      disabled,
      employees,
      user,
      date,
    } = this.props;
    const email = get(user, 'email', false);
    const mobilePhone = get(user, 'mobilePhone', false);

    if (
      this.state.listOfEmployeesType === SHOW_ALL ||
      (this.state.listOfEmployeesType === SHOW_ALL &&
        type === WAITING_LIST_TYPE_APPOINTMENT) ||
      type === WAITING_LIST_TYPE_RESERVED
    ) {
      listOFEmployees = this.props.listOfAllEmployees;
    } else if (this.state.listOfEmployeesType === SHOW_ACCEPT_APPOINTMENTS) {
      listOFEmployees = this.props.listOfAllEmployees.filter(
        el => el.acceptAppointments,
      );
    } else if (
      type === WAITING_LIST_TYPE_APPOINTMENT &&
      !this.state.listOfEmployeesType
    ) {
      listOFEmployees = this.props.listOfAllEmployees;
    } else {
      listOFEmployees = this.props.listOfEnabledEmployees;
    }

    if (
      type === WAITING_LIST_TYPE_APPOINTMENT &&
      this.props.selectedEmployees.length > 1
    ) {
      this.props.onEmployeeSelect(null);
    }

    const { timelineFrom } = this;
    const { timelineTo } = this;
    const timelineMessage = [];
    let timelineMessageType = 'success';

    console.log('timelineFrom && timelineTo', timelineFrom, timelineTo);

    if (timelineFrom && timelineTo) {
      if (
        this.timeStep + timelineTo.timeBlock - timelineFrom.timeBlock <
        this.state.totalServiceTime
      ) {
        timelineMessageType = 'warning';
        timelineMessage.push('Attention: Selected services require more time');
      }
    }

    if ((!timelineFrom || !timelineTo) && (WAITING_LIST_TYPE_APPOINTMENT || WAITING_LIST_TYPE_RESERVED)) {
      timelineMessageType = 'warning';
      timelineMessage.push('Attention: Please select time');
    }

    if (!this.servicesExist(services, this.items)) {
      timelineMessageType = 'warning';
      timelineMessage.push(
        'Attention: One on more services that were selected cannot be provided by employee',
      );
    }

    return (
      <React.Fragment>
        <form onSubmit={this.props.handleSubmit}>
          <ModalHeader toggle={this.props.toggle}>
            <Avatar
              color="#3E83F8"
              size={35}
              src={get(initialValues, 'user.avatar', false)}
              email={get(initialValues, 'user.email', false)}
              name={`${get(initialValues, 'user.firstName', '-')} ${get(
                initialValues,
                'user.lastName',
                '-',
              )}`}
            />
            <span className="ml-2 text-overflow">
              {_.get(initialValues, 'user.firstName', '-')}{' '}
              {_.get(initialValues, 'user.lastName', '-')}
            </span>
          </ModalHeader>
          <ModalBody>
            <fieldset disabled={submitting || disabled}>
              {error && (
                <Alert color="danger">{this.context.translate(error)}</Alert>
              )}
              <FormSection name="user">
                {email && (
                  <Field
                    size="mb-3"
                    icon="icon-envelope"
                    name="email"
                    component={RenderField}
                    appendIcon="icon-envelope-letter"
                    appendOnClick={() => {
                      email && sendEmailLink(email);
                    }}
                    disabled="disabled"
                    type="text"
                    className="form-control"
                    placeholder="Email"
                  />
                )}
                <Field
                  size="mb-4"
                  icon="icon-user"
                  name="firstName"
                  disabled="disabled"
                  component={RenderField}
                  type="text"
                  className="form-control"
                  placeholder="First Name"
                />
                <Field
                  size="mb-4"
                  icon="icon-user"
                  name="lastName"
                  disabled="disabled"
                  component={RenderField}
                  type="text"
                  className="form-control"
                  placeholder="Last Name"
                />
                {mobilePhone && (
                  <Field
                    size="mb-4"
                    icon="icon-user"
                    name="mobilePhone"
                    component={RenderField}
                    disabled="disabled"
                    type="text"
                    className="form-control"
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
                )}
              </FormSection>
              <Field
                size="mb-4"
                icon="icon-note"
                name="note"
                component={RenderField}
                type="text"
                className="form-control"
                placeholder="Note"
              />
              <Row>
                <Col xs={12}>
                  <small>
                    <b>Type</b>
                  </small>
                </Col>
              </Row>
              <Field name="type" component={RenderType} />
              <ScrollingEmployees
                size={80}
                singleSelect={
                  type === WAITING_LIST_TYPE_APPOINTMENT ||
                  type === WAITING_LIST_TYPE_RESERVED
                }
                className="mb-0"
                list={listOFEmployees}
                onClick={(employee, singleSelect) => {
                  this.props.onEmployeeSelect(employee, singleSelect);
                  if (
                    _.get(this.props.selectedEmployees, '[0]') !== employee
                  ) {
                    this.setTimelineAndServices(employee);
                  } else {
                    this.setItems([]);
                    // this.setServices([]);
                    this.setTimeline([]);
                    this.setTotalServiceTime([]);
                  }
                }}
                selected={this.props.selectedEmployees}
              />
              <Row className="justify-content-center mt-1 mb-2">
                <Col xs={3} className="pl-0 pr-0">
                  <button
                    className={`btn btn-link btn-block text-overflow ${
                      this.state.listOfEmployeesType === SHOW_ONLY_WORKING
                        ? 'text-muted'
                        : ''
                    }`}
                    onClick={e => {
                      e.preventDefault();
                      this.setListOfEmployeesType(SHOW_ONLY_WORKING);
                    }}
                  >
                    Only Working
                  </button>
                </Col>
                <Col xs={3} className="pl-0 pr-0">
                  <button
                    className={`btn btn-link btn-block text-overflow ${
                      this.state.listOfEmployeesType === SHOW_ALL
                        ? 'text-muted'
                        : ''
                    }`}
                    onClick={e => {
                      e.preventDefault();
                      this.setListOfEmployeesType(SHOW_ALL);
                    }}
                  >
                    Show All
                  </button>
                </Col>
                <Col xs={3} className="pl-0 pr-0">
                  <button
                    className={`btn btn-link btn-block text-overflow ${
                      this.state.listOfEmployeesType ===
                      SHOW_ACCEPT_APPOINTMENTS
                        ? 'text-muted'
                        : ''
                    }`}
                    onClick={e => {
                      e.preventDefault();
                      this.setListOfEmployeesType(SHOW_ACCEPT_APPOINTMENTS);
                    }}
                  >
                    Can accept appointments
                  </button>
                </Col>
              </Row>
              {(type === WAITING_LIST_TYPE_APPOINTMENT ||
                type === WAITING_LIST_TYPE_RESERVED) && (
                <React.Fragment>
                  <Row>
                    <Col className="mb-3" xs={12}>
                      <small>
                        <b>Summary</b>
                      </small>
                    </Col>
                    <Col className="mb-3" xs={12}>
                      <Alert color={timelineMessageType}>
                        {timelineMessageType === 'warning' &&
                          timelineMessage.map(msg => (
                            <p key={msg}>
                              <b>{msg}</b>
                            </p>
                          ))}
                        {timelineFrom && (
                          <React.Fragment>
                            <span>Scheduled for </span>
                            <b>
                              {moment
                                .unix(timelineFrom.timeBlock)
                                .format('MMMM Do YYYY')}
                            </b>
                          </React.Fragment>
                        )}
                        <p className="mb-0">
                          {timelineFrom && (
                            <React.Fragment>
                              <span>Starts at </span>
                              <b>
                                {moment
                                  .unix(timelineFrom.timeBlock)
                                  .format('LT')}
                              </b>
                            </React.Fragment>
                          )}
                          {timelineTo && (
                            <React.Fragment>
                              <span> ends at </span>
                              <b>
                                {moment
                                  .unix(timelineTo.timeBlock + this.timeStep)
                                  .format('LT')}
                              </b>
                            </React.Fragment>
                          )}
                          {timelineFrom &&
                            timelineTo &&
                            ` (${humanizeDuration(
                              (timelineTo.timeBlock +
                                this.timeStep -
                                timelineFrom.timeBlock) *
                                1000,
                              { units: ['m'] },
                            )})`}
                        </p>
                        <p className="mb-0">
                          {this.state.totalServiceTime > 0 ? (
                            <React.Fragment>
                              <span>Requires </span>
                              <b>
                                {humanizeDuration(
                                  this.state.totalServiceTime * 1000,
                                  {
                                    units: ['m'],
                                  },
                                )}
                              </b>
                            </React.Fragment>
                          ) : (
                            <b> Services were not selected</b>
                          )}
                        </p>
                      </Alert>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12}>
                      <small>
                        <b>Date & Time</b>
                      </small>
                    </Col>
                    <Col xs={12} className="mb-3 text-center">
                      <Field
                        name="date"
                        className="btn btn-block btn-secondary"
                        // dateRange
                        // multiSelect
                        onClick={timeStamp => {
                          this.setTimelineAndServices(
                            _.get(this.props.selectedEmployees, '[0]'),
                            timeStamp
                          );
                        }}
                        minDate={moment().toDate()}
                        dateFormat="MMM d, Y"
                        component={RenderDatePicker}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12}>
                      <Field name="timeline" component={this.RenderTimeline} />
                    </Col>
                  </Row>
                </React.Fragment>
              )}
              <Row>
                <Col xs={12}>
                  <small>
                    <b>Services</b>
                  </small>
                </Col>
              </Row>
              {this.state.showAllServices ? (
                <Row>
                  <Field
                    component={this.RenderServices}
                    name="services"
                    showAll
                    items={this.items}
                  />
                </Row>
              ) : (
                <Row>
                  <Field
                    component={this.RenderServices}
                    name="services"
                    items={this.items}
                  />
                </Row>
              )}
              {/*<Row>*/}
              {/*  <Col xs={12} className="text-center">*/}
              {/*    <span*/}
              {/*      className="btn btn-link"*/}
              {/*      onClick={this.onShowAllServicesClick}*/}
              {/*    >*/}
              {/*      {this.state.showAllServices ? 'Hide' : 'Show All'}*/}
              {/*    </span>*/}
              {/*  </Col>*/}
              {/*</Row>*/}
              <Field
                switchType="switch-danger"
                component={RenderField}
                name="flag"
                type="checkbox"
                title="Flagged"
                description="Enable if you want this record to be flagged"
              />
              <Row>
                <Col xs={12}>
                  <small>
                    <b>Status</b>
                  </small>
                </Col>
              </Row>
              <Field name="status" component={RenderStatus} />
              <Field
                component={RenderField}
                name="check"
                type="checkbox"
                title="Done"
                description="Enable if you want this record to be marked as done"
              />
              <Row>
                <Col>
                  <small>
                    <b>Created at</b>
                  </small>
                  <label className="float-right btn-link disabled">
                    {moment(initialValues.createdAt).format(
                      window.App.dateFormat,
                    )}
                  </label>
                </Col>
              </Row>
              <Row>
                <Col>
                  <React.Fragment>
                    <small>
                      <b>Updated at</b>
                    </small>
                    <label className="float-right btn-link disabled">
                      {moment(initialValues.updatedAt).format(
                        window.App.dateFormat,
                      )}
                    </label>
                  </React.Fragment>
                </Col>
              </Row>
              {(type === WAITING_LIST_TYPE_APPOINTMENT ||
                type === WAITING_LIST_TYPE_RESERVED) && (
                <Field
                  component={RenderField}
                  disabled={!_.get(user, 'email')}
                  name="notifyClient"
                  type="checkbox"
                  title="Notify Client"
                  description="Enable if you want to notify client about this appointment"
                />
              )}
            </fieldset>
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              onClick={() => {
                this.props.onEmployeeHeaderClick();
              }}
            >
              Cancel
            </Button>
            {/* <Button */}
            {/*  color="primary" */}
            {/*  className="px-4" */}
            {/*  disabled={submitting || pristine} */}
            {/* > */}
            {/*  Save */}
            {/* </Button> */}
            <Button
              color="primary"
              onClick={() => {
                this.props.onEmployeeUpdate(
                  initialValues.id,
                  this.props.selectedEmployees,
                );
              }}
            >
              Update
            </Button>
          </ModalFooter>
        </form>
      </React.Fragment>
    );
  }
}

let waitinglistForm = reduxForm({
  form: FORM_NAME,
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  // enableReinitialize: true,
})(WaitinglistForm);

const selector = formValueSelector(FORM_NAME);

waitinglistForm = connect(state => {
  if (get(state, `form.${FORM_NAME}`)) {
    const { type, services, timeline, user, date, meta } = selector(
      state,
      'type',
      'services',
      'timeline',
      'user',
      'date',
      'meta',
    );
    return {
      type,
      timeline,
      services,
      user,
      date,
      meta,
    };
  }
  return {};
})(waitinglistForm);

export default waitinglistForm;
