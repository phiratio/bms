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
  clearSubmitErrors,
  SubmissionError,
  untouch,
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
import history from '../../../history';
import ScrollingEmployees from '../../ScrollingEmployees';
import AutoSuggest from '../../AutoSuggest';
import { isEmail } from '../../../core/formValidators';

import {
  callPhoneNumberLink,
  normalizePhone,
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
import { validate } from '../../../core/httpClient';

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

  const noon =
    moment
      .unix(timeline[0].timeBlock)
      .startOf('day')
      .add(12, 'hours') / 1000;

  const HOURS_5 = noon + 3600 * 5;

  const morningItems = [];
  const afterNoonItems = [];
  const eveningItems = [];

  const onClick = selected => {
    if (selected.type === WAITING_LIST_TYPE_UNAVAILABLE) return;
    this.setTotalServiceTime(this.props.services);
    this.setState({ timelineClicked: true });
    const timeline = this.getTimeline(input.value.slice(), selected);
    return input.onChange(timeline);
  };

  const clear = () => {
    const clearTimeline = this.clearTimeline([...input.value]);
    this.setState({ timelineClicked: false });
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
      'btn-primary disabled':
        id !== el.id &&
        (el.type === WAITING_LIST_TYPE_APPOINTMENT ||
          el.type === WAITING_LIST_TYPE_RESERVED),
      'btn-secondary disabled':
        id !== el.id && el.type === WAITING_LIST_TYPE_UNAVAILABLE,
      'btn btn-outline-warning': id === el.id && el.type === 'hint',
    };

    let block = morningItems;

    if (el.timeBlock >= noon && el.timeBlock <= HOURS_5 - this.timeStep) {
      block = afterNoonItems;
    } else if (el.timeBlock >= HOURS_5 - this.timeStep) {
      block = eveningItems;
    }

    nextEl.timeBlock - el.timeBlock === this.timeStep &&
      block.push(
        <Col xs={12} className="mb-1 p-0 timeline" key={shortId.generate()}>
          <div className={classNames(classes)} onClick={() => onClick(el)}>
            {moment.unix(el.timeBlock).format('LT')}
            {/* {' '} */}
            {/* {moment.unix(nextEl.timeBlock).format('LT')} */}
          </div>
        </Col>,
      );
  }

  return (
    <React.Fragment>
      <Row>
        <Col className="text-center mb-3" xs={12}>
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
      <Row>
        <Col xs={4}>{morningItems}</Col>
        <Col xs={4}>{afterNoonItems}</Col>
        <Col xs={4}>{eveningItems}</Col>
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

const RenderPositiveStatus = ({ input, name }) => {
  const onClick = status => input.onChange(status);
  return (
    <Row>
      <Col xs={6} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
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
      <Col xs={6} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
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
    </Row>
  );
};

function RenderType({ input, name }) {
  const onClick = type => {
    if (type !== WAITING_LIST_TYPE_WALK_IN) {
      this.setTimelineAndServices(
        _.get(this.props.selectedEmployees, '[0]'),
        this.props.date,
      );
    }
    input.onChange(type);
  };
  return (
    <Row>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <Button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_TYPE_WALK_IN);
          }}
          className={`btn btn-outline-success btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_TYPE_WALK_IN && 'active'}`}
        >
          Walk-In
        </Button>
      </Col>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <Button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_TYPE_APPOINTMENT);
          }}
          className={`btn btn-outline-success btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_TYPE_APPOINTMENT && 'active'}`}
        >
          Appointment
        </Button>
      </Col>
      <Col xs={4} className="ml-0 mr-0 mt-2 mb-2 text-center pl-2 pr-2">
        <Button
          onClick={e => {
            e.preventDefault();
            onClick(WAITING_LIST_TYPE_RESERVED);
          }}
          className={`btn btn-outline-success btn-block btn-lg text-overflow ${input.value ===
            WAITING_LIST_TYPE_RESERVED && 'active'}`}
        >
          Reserved
        </Button>
      </Col>
    </Row>
  );
}

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
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  state = {
    timelineClicked: false,
    listOfEmployeesType: null,
    showAllServices: false,
    showAccountForm: false,
    items: [],
    disableForm: false,
    newAccount: true,
    autoSuggestionValue: '',
    totalServiceTime: null,
  };

  constructor(props) {
    super(props);
    this.RenderTimeline = RenderTimeline.bind(this);
    this.RenderServices = RenderServices.bind(this);
    this.RenderType = RenderType.bind(this);
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
      el => el.id === this.props.initialValues.id && el.type !== 'hint',
    );
    return fromTimeIndex > -1 && this.props.timeline[fromTimeIndex];
  }

  get timelineTo() {
    const timeline = this.props.timeline || null;
    if (!timeline) return null;
    const toTimeIndex = _.findLastIndex(
      timeline,
      el =>
        (el.id === this.props.initialValues.id && el.type !== 'hint') ||
        (el.id === this.props.initialValues.id && el.to),
    );
    if (toTimeIndex > -1) {
      return timeline[toTimeIndex];
    }
    return false;
  }

  get timeStep() {
    return _.get(this.props.initialValues, 'meta.timeStep.id');
  }

  get formData() {
    const state = this.context.store.getState();
    const values = _.get(state, `form.[${FORM_NAME}].values`);
    const timeline = _.get(state, `form.[${FORM_NAME}].values.timeline`);
    const timeRange = [];
    const user = {};
    const id = values.id ? values.id : values._id;
    const listOfEmployees = this.listOfEmployees();
    const employees = this.props.selectedEmployees.filter(selected => {
      return listOfEmployees.findIndex(el => el.name === selected) > -1;
    });

    if (values.type !== WAITING_LIST_TYPE_WALK_IN && timeline) {
      const apptStartTimeIndex = values.timeline.findIndex(el => el.id === id);
      const apptEndTimeIndex = _.findLastIndex(
        values.timeline,
        el => el.id === id,
      );

      const fromTimeBlock = _.get(
        values,
        `timeline[${apptStartTimeIndex}].timeBlock`,
      );
      const toTimeBlock = _.get(
        values,
        `timeline[${apptEndTimeIndex}].timeBlock`,
      );

      if (fromTimeBlock && toTimeBlock) {
        timeRange.push([fromTimeBlock, toTimeBlock + this.timeStep]);
      }
    }

    if (this.initialValues.id === 'new') {
      user['user.firstName'] = _.get(values, 'user.firstName');
      user['user.lastName'] = _.get(values, 'user.lastName');
      user['user.mobilePhone'] = _.get(values, 'user.mobilePhone');
      user['user.email'] = _.get(values, 'user.email');
      user['user.id'] = _.get(values, 'user.id');
    }

    return {
      timeRange,
      services: values.services.map(el => el._id),
      employees,
      type: values.type,
      note: values.note,
      status: values.status,
      flag: values.flag,
      check: values.check,
      date: values.date,
      ...user,
      notifyEmployee: values.notifyEmployee,
      notifyEmployeeNote: values.notifyEmployee && values.notifyEmployeeNote,
      notifyClient: values.notifyClient,
      notifyClientNote: values.notifyClient && values.notifyClientNote,
    };
  }

  /**
   *  TODO: Refactor this code. Implement class
   * */
  getTimeline(initialTimeline = [], selected = {}, servicesTime) {
    if (!selected.timeBlock) {
      return;
    }
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
      let startIndex = fromIndex;
      let endIndex = toIndex;

      if (fromIndex > toIndex) {
        startIndex = toIndex;
        endIndex = fromIndex;
      }
      for (let i = startIndex; i < endIndex + 1; i++) {
        if (
          (arr[i].id && arr[i].id !== id) ||
          arr[i].type === WAITING_LIST_TYPE_UNAVAILABLE ||
          arr[i].type === WAITING_LIST_TYPE_RESERVED
        ) {
          return false;
        }
      }
      return true;
    };

    const clearHints = () => {
      for (let i = 0; i < timeline.length; i++) {
        const el = timeline[i];
        if (el.type === 'hint') {
          timeline.splice(i, 1, { timeBlock: el.timeBlock });
        }
      }
    };

    if (from && !to) {
      const data = { id, type: WAITING_LIST_TYPE_APPOINTMENT, to: true };

      for (let i = 0; i < timeline.length; i++) {
        const el = timeline[i];
        if (el.type === 'hint') {
          timeline.splice(i, 1, { timeBlock: el.timeBlock, ...{ type: null } });
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
        clearHints();
      } else {
        this.context.showNotification('Wrong time blocks selected', 'error');
        return;
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
        if (el.id === id) {
          timeline.splice(i, 1, {
            timeBlock: el.timeBlock,
          });
        }
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
          !el.type &&
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
    if (
      this.initialValues.id !== 'new' &&
      this.props.type !== WAITING_LIST_TYPE_WALK_IN
    ) {
      return _.get(this.props, 'meta.items', []);
    }
    return _.get(this.props, 'meta.allItems', []);
  }

  get services() {
    return _.get(this.props, 'services', []);
  }

  get initialValues() {
    return _.get(this.props, 'initialValues', {});
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

  goToAccount() {
    const accountId = get(this.props, 'user._id');
    if (accountId) history.push(`/accounts/${accountId}`);
  }

  componentDidMount() {
    this.setItems(
      this.checkServices(
        this.initialValues.services,
        this.initialValues.meta.items,
      ),
    );
    const services = Array.isArray(this.initialValues.services)
      ? [...this.initialValues.services]
      : [];
    this.setTotalServiceTime(services);
    if (this.initialValues.id !== 'new') {
      this.setState({ newAccount: false });
    }
    if (_.get(this.initialValues, 'user.email')) {
      this.setData('notifyClient', true);
    }
    // this.setData('notifyEmployee', true);
    this.context.socket.on('waitingList.setTimeline', this.refreshTimeline);
  }

  componentWillUnmount() {
    this.context.socket.off('waitingList.setTimeline');
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
        if (data.message)
          this.context.showNotification(data.message, 'warning');
      },
    );
    this.setTotalServiceTime([...this.services]);
  }

  searchAccounts = (search = '', limit = 7) => {
    if (search.length <= 1) return [];
    const params = {
      ...(search && { search }),
      ...(limit && { limit }),
    };
    const query = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return this.context.httpClient
      .getData(`/accounts/${query && `?${query}`}`)
      .then(validate.bind(this))
      .then(data => data.users)
      .catch(err => {
        Object.keys(err).forEach(key =>
          this.context.showNotification(err[key], 'error'),
        );
      });
  };

  onSuggestionSelected = () => {
    setTimeout(
      () => document.getElementById(`${FORM_NAME}-auto-suggest`).blur(),
      320,
    );
  };

  getSuggestionValue = suggestion => {
    this.context.store.dispatch(
      change(FORM_NAME, 'user', {
        ...suggestion,
        ...{ mobilePhone: normalizePhone(suggestion.mobilePhone) },
      }),
    );

    if (suggestion.email) {
      this.setData('notifyClient', true);
    }

    this.setState({ disableForm: true });
    this.context.store.dispatch(untouch(FORM_NAME, 'user.firstName'));
    this.context.store.dispatch(untouch(FORM_NAME, 'user.lastName'));
    this.context.store.dispatch(untouch(FORM_NAME, 'user.email'));
    this.context.store.dispatch(untouch(FORM_NAME, 'user.mobilePhone'));
    return '';
  };

  renderSuggestion = suggestion => (
    <React.Fragment>
      <div className="avatar float-left react-autosuggest__suggestion-avatar">
        <Avatar
          color="#3E83F8"
          size={40}
          src={get(suggestion, 'avatar', false)}
          email={suggestion.email}
          name={`${get(suggestion, 'firstName', '-')} ${get(
            suggestion,
            'lastName',
            '-',
          )}`}
        />
      </div>
      <div className="mt-1 react-autosuggest__suggestion-text">
        {suggestion.firstName} {suggestion.lastName}
      </div>
      {suggestion.mobilePhone && (
        <small className="text-muted mr-3 react-autosuggest__suggestion-text">
          <i className="icon-phone" />
          &nbsp; {normalizePhone(suggestion.mobilePhone)}
        </small>
      )}
    </React.Fragment>
  );

  onCreate = () =>
    this.props
      .createRecord(this.formData)
      .then(() => {
        this.setState({
          clientUpdateModal: !this.state.clientUpdateModal,
        });
      })
      .catch(
        e => {
          if (e.message === 'Selected time is not available') {
            this.refreshTimeline();

          }
          return Promise.reject(new SubmissionError(e))
        },

        // if (!_.isEmpty(e) && !e.error) {
        //   Object.values(e).map(msg =>
        //     this.context.showNotification(msg, 'error'),
        //   );
        // }
        // if (_.isEmpty(e.message) && e.error)
        //   this.context.showNotification(e.error, 'error');
      );

  refreshTimeline = () => {
    if (this.props.type !== WAITING_LIST_TYPE_WALK_IN) {
      this.setTimelineAndServices(
        _.get(this.props.selectedEmployees, '[0]'),
        this.props.date,
      );
    }
  };

  listOfEmployees = () => {
    let listOFEmployees;
    if (
      this.state.listOfEmployeesType === SHOW_ALL ||
      (this.state.listOfEmployeesType === SHOW_ALL &&
        this.props.type === WAITING_LIST_TYPE_APPOINTMENT) ||
      this.props.type === WAITING_LIST_TYPE_RESERVED
    ) {
      listOFEmployees = this.props.listOfAllEmployees;
    } else if (this.state.listOfEmployeesType === SHOW_ACCEPT_APPOINTMENTS) {
      listOFEmployees = this.props.listOfAllEmployees.filter(
        el => el.acceptAppointments,
      );
    } else if (
      this.props.type === WAITING_LIST_TYPE_APPOINTMENT &&
      !this.state.listOfEmployeesType
    ) {
      listOFEmployees = this.props.listOfAllEmployees;
    } else {
      listOFEmployees = this.props.listOfEnabledEmployees;
    }
    return listOFEmployees;
  };

  render() {
    const listOFEmployees = this.listOfEmployees();

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
      status,
      check,
      disabled,
      employees,
      user,
      date,
      notifyEmployee,
      notifyClient,
      submitErrors,
    } = this.props;
    const email = get(user, 'email', false);
    const mobilePhone = get(user, 'mobilePhone', false);
    const id = get(initialValues, 'id', false);

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

    if (timelineFrom && timelineTo) {
      if (
        this.timeStep + timelineTo.timeBlock - timelineFrom.timeBlock <
        this.state.totalServiceTime
      ) {
        timelineMessageType = 'warning';
        timelineMessage.push('Attention: Selected services require more time');
      }
    }

    if (status === WAITING_LIST_STATUS_CANCELED) {
      timelineMessageType = 'danger';
    }

    // if ((!timelineFrom || !timelineTo) && type !== WAITING_LIST_TYPE_WALK_IN) {
    //   timelineMessageType = 'warning';
    //   timelineMessage.push('Attention: Please select time');
    // }

    if (!this.servicesExist(services, this.items)) {
      timelineMessageType = 'warning';
      timelineMessage.push(
        'Attention: One on more services that were selected cannot be provided by employee',
      );
    }
    return (
      <React.Fragment>
        <form onSubmit={handleSubmit(this.onCreate)}>
          <div className="modal-header">
            <Col xs={8} className="mt-1" onClick={() => this.goToAccount()}>
              {user && user.firstName && user.lastName && (
                <React.Fragment>
                  <Avatar
                    color="#3E83F8"
                    size={35}
                    src={get(user, 'avatar', false)}
                    email={isEmail(email) && user.id && email}
                    name={`${get(user, 'firstName', '-')} ${get(
                      user,
                      'lastName',
                      '-',
                    )}`}
                  />
                  <span className="ml-2 text-overflow">
                    {_.get(user, 'firstName', '-')}{' '}
                    {_.get(user, 'lastName', '-')}
                  </span>
                </React.Fragment>
              )}
            </Col>
            <Col xs={3} className="text-right mt-1 pr-0">
              <a
                className="modal-actions btn-setting btn"
                onClick={this.props.onEdit}
              >
                <i className="icon-close" />
              </a>
            </Col>
          </div>
          <ModalBody>
            <fieldset disabled={submitting || disabled}>
              {error && (
                <Alert color="danger">{this.context.translate(error)}</Alert>
              )}
              {id === 'new' && (
                <Row>
                  <Col md={8} xs={12}>
                    <AutoSuggest
                      placeholder="Search for account"
                      className="mb-2"
                      loadSuggestions={this.searchAccounts}
                      getSuggestionValue={this.getSuggestionValue}
                      renderSuggestion={this.renderSuggestion}
                      onSuggestionSelected={this.onSuggestionSelected}
                      inputProps={{
                        id: `${FORM_NAME}-auto-suggest`,
                        value: this.state.autoSuggestionValue,
                        onChange: (e, { newValue }) => {
                          this.setState({
                            autoSuggestionValue: newValue,
                          });
                        },
                      }}
                    />
                  </Col>
                  <Col md={4} xs={12} className="align-items-center mb-2">
                    <Button
                      name="Create new account"
                      className="btn btn-outline-success btn-block text-overflow"
                      onClick={e => {
                        e.preventDefault();
                        if (!this.state.autoSuggestionValue) return;
                        const fullName = this.state.autoSuggestionValue.match(
                          /^(\S+)\s(.*)/,
                        );
                        const firstName = _.get(fullName, '[1]', false);
                        const lastName = _.get(fullName, '[2]', false);

                        this.context.store.dispatch(
                          change(FORM_NAME, 'user', {
                            ...(firstName
                              ? { firstName }
                              : { firstName: this.state.autoSuggestionValue }),
                            ...(lastName && { lastName }),
                            notifyClient: false,
                          }),
                        );

                        this.context.store.dispatch(
                          clearSubmitErrors(FORM_NAME),
                        );

                        this.setState({
                          autoSuggestionValue: '',
                          disableForm: false,
                        });
                      }}
                    >
                      Create new account
                    </Button>
                  </Col>
                </Row>
              )}
              <FormSection name="user">
                <Field
                  size="mb-4"
                  icon="icon-user"
                  name="firstName"
                  disabled={
                    id !== 'new' || (this.state.disableForm && 'disabled')
                  }
                  component={RenderField}
                  type="text"
                  className="form-control"
                  placeholder="First Name"
                  error={_.get(submitErrors, '["user.firstName"]')}
                />
                <Field
                  size="mb-4"
                  icon="icon-user"
                  name="lastName"
                  disabled={
                    id !== 'new' || (this.state.disableForm && 'disabled')
                  }
                  component={RenderField}
                  type="text"
                  className="form-control"
                  placeholder="Last Name"
                  error={_.get(submitErrors, '["user.lastName"]')}
                />
                {(email || id === 'new') && (
                  <Field
                    size="mb-3"
                    icon="icon-envelope"
                    name="email"
                    component={RenderField}
                    appendIcon="icon-envelope-letter"
                    appendOnClick={() => {
                      email && sendEmailLink(email);
                    }}
                    disabled={
                      id !== 'new' || (this.state.disableForm && 'disabled')
                    }
                    type="text"
                    className="form-control"
                    placeholder="Email"
                    error={_.get(submitErrors, '["user.email"]')}
                  />
                )}
                {(mobilePhone || id === 'new') && (
                  <Field
                    size="mb-4"
                    icon="icon-user"
                    name="mobilePhone"
                    component={RenderField}
                    disabled={
                      id !== 'new' || (this.state.disableForm && 'disabled')
                    }
                    type="text"
                    className="form-control"
                    placeholder="Mobile Phone"
                    onChange={e => {
                      this.props.change(
                        'user.mobilePhone',
                        normalizePhone(e.target.value),
                      );
                      e.preventDefault();
                    }}
                    error={_.get(submitErrors, '["user.mobilePhone"]')}
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
              <Field name="type" component={this.RenderType} />
              <Row>
                <Col xs={12}>
                  {_.get(submitErrors, 'type') && (
                    <span className="form-control-invalid mb-2">
                      {_.get(submitErrors, 'type')}
                    </span>
                  )}
                </Col>
              </Row>
              <ScrollingEmployees
                size={80}
                singleSelect={type !== WAITING_LIST_TYPE_WALK_IN}
                className="mb-0"
                list={listOFEmployees}
                onClick={(employee, singleSelect) => {
                  this.props.onEmployeeSelect(employee, singleSelect);
                  if (_.get(this.props.selectedEmployees, '[0]') !== employee) {
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
                <Col xs={12}>
                  {_.get(submitErrors, 'employees') && (
                    <span className="form-control-invalid mb-2">
                      {_.get(submitErrors, 'employees')}
                    </span>
                  )}
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <small>
                    <b>Services</b>
                  </small>
                </Col>
              </Row>
              <Row>
                <Field
                  component={this.RenderServices}
                  name="services"
                  items={this.items}
                />
              </Row>
              {(type === WAITING_LIST_TYPE_APPOINTMENT ||
                type === WAITING_LIST_TYPE_RESERVED) &&
                status !== WAITING_LIST_STATUS_CANCELED && (
                  <React.Fragment>
                    <Row>
                      <Col xs={12}>
                        <small>
                          <b>Available Time</b>
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
                              timeStamp,
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
                        <Field
                          name="timeline"
                          component={this.RenderTimeline}
                        />
                      </Col>
                    </Row>
                  </React.Fragment>
                )}
              {/* <Row> */}
              {/*  <Col xs={12} className="text-center"> */}
              {/*    <span */}
              {/*      className="btn btn-link" */}
              {/*      onClick={this.onShowAllServicesClick} */}
              {/*    > */}
              {/*      {this.state.showAllServices ? 'Hide' : 'Show All'} */}
              {/*    </span> */}
              {/*  </Col> */}
              {/* </Row> */}
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
              {id !== 'new' ? (
                <Field name="status" component={RenderStatus} />
              ) : (
                <Field name="status" component={RenderPositiveStatus} />
              )}
              <Row>
                <Col xs={12}>
                  {_.get(submitErrors, 'status') && (
                    <span className="form-control-invalid mb-2">
                      {_.get(submitErrors, 'status')}
                    </span>
                  )}
                </Col>
              </Row>
              {this.initialValues.id !== 'new' && (
                <React.Fragment>
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
                </React.Fragment>
              )}
              <React.Fragment>
                <Field
                  component={RenderField}
                  disabled={!_.get(user, 'email')}
                  name="notifyClient"
                  type="checkbox"
                  title="Notify Client"
                  description="Enable if you want to notify client about this appointment"
                />
                {notifyClient && (
                  <Field
                    component={RenderField}
                    name="notifyClientNote"
                    className="form-control m1-1 mb-2"
                    type="textarea"
                    placeholder="Note for a client"
                  />
                )}
              </React.Fragment>
              {/*<Field*/}
              {/*  component={RenderField}*/}
              {/*  name="notifyEmployee"*/}
              {/*  type="checkbox"*/}
              {/*  title="Add a note to Employee(s)"*/}
              {/*/>*/}
              {/*{notifyEmployee && (*/}
              {/*  <Field*/}
              {/*    component={RenderField}*/}
              {/*    name="notifyEmployeeNote"*/}
              {/*    className="form-control mt-1"*/}
              {/*    type="textarea"*/}
              {/*    placeholder="Note for employee(s)"*/}
              {/*  />*/}
              {/*)}*/}
            </fieldset>
            {(type === WAITING_LIST_TYPE_APPOINTMENT ||
              type === WAITING_LIST_TYPE_RESERVED) && (
              <Row>
                <Col className="mb-3" xs={12}>
                  <small>
                    <b>Summary</b>
                  </small>
                </Col>
                <Col xs={12}>
                  <Alert color={timelineMessageType}>
                    {timelineMessageType === 'warning' &&
                    timelineMessage.map(msg => (
                      <p key={msg}>
                        <b>{msg}</b>
                      </p>
                    ))}
                    {this.state.timelineClicked && timelineFrom && (
                      <React.Fragment>
                        <span>Scheduled for </span>
                        <b>
                          {moment
                            .unix(timelineFrom.timeBlock)
                            .format('MMMM Do YYYY')}
                        </b>
                      </React.Fragment>
                    )}
                    {!this.state.timelineClicked &&
                    initialValues.apptStartTime && (
                      <React.Fragment>
                        <span>Scheduled for </span>
                        <b>
                          {moment(initialValues.apptStartTime).format(
                            'MMMM Do YYYY',
                          )}
                        </b>
                      </React.Fragment>
                    )}
                    <p className="mb-0">
                      {!this.state.timelineClicked &&
                      initialValues.apptStartTime && (
                        <React.Fragment>
                          <span>Starts at </span>
                          <b>
                            {moment(initialValues.apptStartTime).format(
                              'LT',
                            )}
                          </b>
                          <span> ends at </span>
                          <b>
                            {moment(initialValues.apptEndTime).format(
                              'LT',
                            )}
                          </b>
                        </React.Fragment>
                      )}
                      {this.state.timelineClicked && timelineFrom && (
                        <React.Fragment>
                          <span>Starts at </span>
                          <b>
                            {moment
                              .unix(timelineFrom.timeBlock)
                              .format('LT')}
                          </b>
                        </React.Fragment>
                      )}
                      {this.state.timelineClicked && timelineTo && (
                        <React.Fragment>
                          <span> ends at </span>
                          <b>
                            {moment
                              .unix(timelineTo.timeBlock + this.timeStep)
                              .format('LT')}
                          </b>
                        </React.Fragment>
                      )}
                      {this.state.timelineClicked &&
                      timelineFrom &&
                      timelineTo &&
                      ` (${humanizeDuration(
                        (timelineTo.timeBlock +
                          this.timeStep -
                          timelineFrom.timeBlock) *
                        1000,
                        { units: ['m'] },
                      )})`}
                      {!this.state.timelineClicked &&
                      initialValues.apptStartTime &&
                      ` (${humanizeDuration(
                        (moment(initialValues.apptEndTime).unix() -
                          moment(initialValues.apptStartTime).unix()) *
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
            )}
            <Row>
              {
                !_.isEmpty(submitErrors) && (
                  <Col className="mb-2 mt-1" xs={12}>
                    <Alert color="danger">
                      <b>Form was not submitted. Please review errors above</b>
                    </Alert>
                  </Col>
                )
              }
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => this.props.onEdit()}>
              Cancel
            </Button>
            {this.initialValues.id !== 'new' ? (
              <Button
                color="primary"
                onClick={e => {
                  e.preventDefault();
                  this.props.onUpdate(initialValues.id, this.formData).catch(e => {
                    if (e.message === 'Selected time is not available') {
                      this.refreshTimeline();
                    }
                  });
                }}
              >
                Update
              </Button>
            ) : (
              <Button type="submit" color="primary">
                Create
              </Button>
            )}
          </ModalFooter>
        </form>
      </React.Fragment>
    );
  }
}

let waitinglistForm = reduxForm({
  form: FORM_NAME,
  touchOnChange: true,
  // enableReinitialize: true,
})(WaitinglistForm);

const selector = formValueSelector(FORM_NAME);

waitinglistForm = connect(state => {
  if (get(state, `form.${FORM_NAME}`)) {
    const {
      type,
      services,
      timeline,
      user,
      date,
      meta,
      check,
      status,
      notifyClient,
      notifyEmployee,
    } = selector(
      state,
      'type',
      'services',
      'timeline',
      'status',
      'user',
      'date',
      'meta',
      'check',
      'notifyClient',
      'notifyEmployee',
    );
    return {
      submitErrors: getFormSubmitErrors(FORM_NAME)(state),
      type,
      timeline,
      services,
      user,
      status,
      check,
      date,
      meta,
      notifyClient,
      notifyEmployee,
    };
  }
  return {};
})(waitinglistForm);

export default waitinglistForm;
