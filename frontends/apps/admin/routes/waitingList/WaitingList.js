import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  Button,
  ButtonDropdown,
  Card,
  CardBody,
  CardHeader,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Modal,
  ModalFooter,
  ModalHeader,
  Row,
} from 'reactstrap';
import _ from 'lodash';
import {
  change,
  Field,
  formValueSelector,
  getFormSubmitErrors,
  reduxForm,
  SubmissionError,
} from 'redux-form';
import moment from 'moment';
import get from 'lodash.get';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import history from '../../../../history';
import WaitingListTable from '../../../../components/Tables/WaitingListTable';
import s from './WaitingList.css';
import { validate } from '../../../../core/httpClient';
import { setEmployees } from '../../../../core/socketEvents';
import ReloadButton from '../../../../components/ReloadButton';
import Timeline from '../../../../components/Timeline';
import WaitinglistForm from '../../../../components/Forms/WaitinglistForm';
import Select from '../../../../components/Select';
import Avatar from '../../../../components/Avatar';
import { isEmail } from '../../../../core/formValidators';
import {
  WAITING_LIST_STATUS_CONFIRMED,
  WAITING_LIST_TYPE_APPOINTMENT,
} from '../../../../constants';
import RenderDatePicker from '../../../../components/Forms/RenderDatePicker';

const defaultPageSize = 8;

const localStorageForEach = callback => {
  for (let i = 0; i < localStorage.length; i++) {
    callback(localStorage.key(i));
  }
};

function createRecord(formData) {
  this.setState({ loading: true });
  return this.context.httpClient
    .sendData(`${this.baseURL}/new`, 'POST', formData)
    .then(validate.bind(this))
    .then(data => {
      this.setState({
        loading: false,
        clientUpdateModal: !this.state.clientUpdateModal,
      });
      return data;
    })
    .catch(e => {
      this.setState({ loading: false });
      return Promise.reject(e);
    });
}

function updateRecord(id, formData) {
  this.setState({ loading: true });
  return this.context.httpClient
    .sendData(`${this.baseURL}/${id}`, 'PUT', formData)
    .then(validate.bind(this))
    .then(data => {
      this.setState({ loading: false });
      return data;
    })
    .catch(e => {
      this.setState({ loading: false });
      return Promise.reject(e);
    });
}

async function fetchRecord(id) {
  this.setState({ loading: true });
  return this.context.httpClient
    .getData(`${this.baseURL}/${id}`)
    .then(validate.bind(this))
    .then(data => {
      this.setState({ loading: false });
      return data;
    })
    .catch(err => {
      this.setState({ notFound: true, loading: false });
      // if (typeof err === 'object')
      //   Object.keys(err).forEach(key =>
      //     this.context.showNotification(err[key], 'error'),
      //   );
      // else if (err._error) this.context.showNotification(err._error, 'error');
      // else this.context.showNotification('Unhandled error', 'error');
    });
}

async function onEdit(client) {
  if (typeof client === 'string') {
    const data = await this.fetchRecord(client);
    if (data) {
      data.employees = Array.isArray(data.employees)
        ? data.employees.map(el => el.username)
        : [];

      this.setState({
        modals: {
          appointments: { ...this.state.modals.appointments },
          services: [],
          id: 'new',
          status: WAITING_LIST_STATUS_CONFIRMED,
          type: WAITING_LIST_TYPE_APPOINTMENT,
          date: new Date().getTime() / 1000,
          ...data,
        },
      });
    }
  }
  this.setState({
    clientUpdateModal: !this.state.clientUpdateModal,
  });
}

async function onEmployeeSelect(employee, singleSelect) {
  if (employee === null) {
    return this.setState({
      modals: { ...this.state.modals, employees: [] },
    });
  }
  const selectedEmployees = this.state.modals.employees;
  let modifiedEmployees = [];
  if (selectedEmployees.indexOf(employee) > -1) {
    modifiedEmployees = selectedEmployees.filter(el => el !== employee);
  } else {
    modifiedEmployees = singleSelect
      ? [employee]
      : [...selectedEmployees, employee];
  }
  this.setState({
    modals: { ...this.state.modals, employees: modifiedEmployees },
  });
}

async function onUpdate(id, formData) {
  return this.updateRecord(id, formData)
    .then(() => {
      this.setState({
        clientUpdateModal: !this.state.clientUpdateModal,
      });
    })
    .catch(e => {
      if (!_.isEmpty(e) && !e.error) {
        Object.values(e).map(msg =>
          this.context.showNotification(msg, 'error'),
        );
      }
      if (_.isEmpty(e.message) && e.error)
        this.context.showNotification(e.error, 'error');

      return Promise.reject(e);
    });
}

function getCalendarEvents(timeStamp, employee) {
  let user = employee;
  if (!employee && this.state.currentUser) {
    user = _.get(this.state, 'currentUser.id');
  }
  this.context.socket.emit(
    'waitingList.calendar.events',
    timeStamp,
    user,
    data => {
      if (data.resources && data.events) {
        this.setState({
          calendar: {
            events: data.events.map(el => ({
              ...el,
              ...{
                start: new Date(el.start),
                end: new Date(el.end),
              },
            })),
            ...(data.resources && {
              resources: data.resources,
            }),
            viewDate: moment.unix(timeStamp).toDate(),
            ...(data.dayStatus && {
              dayStatus: data.dayStatus,
            }),
            currentDayHours: {
              start: moment(data.currentDayHours.start, 'X').toDate(),
              end: moment(data.currentDayHours.end, 'X').toDate(),
            },
          },
        });
      }

      if (data.message) this.context.showNotification(data.message, 'warning');
    },
  );
}

class WaitingList extends React.Component {
  state = {
    dateFrom: null,
    dateTo: null,
    listOfAllEmployees: [],
    currentUser: {},
    fetchFailed: false,
    fullscreen: { registration: false, done: false, appointments: false },
    clientUpdateModal: false,
    actionDropdown: {},
    modals: {
      appointments: {
        isOpen: false,
      },
      user: {},
      employees: [],
    },
    records: {
      recent: [],
      checked: [],
      appointments: [],
    },
    filters: {
      recent: {
        fullscreen: false,
        visibility: true,
      },
      checked: {
        fullscreen: false,
        visibility: true,
      },
      appointments: {
        showFilter: false,
        expanded: true,
        visibility: true,
        fullscreen: false,
      },
      all: {
        dateFrom: null,
        dateTo: null,
        employees: [],
        showFilter: false,
        expanded: true,
        visibility: true,
        fullscreen: false,
      },
    },
    calendar: {
      viewDate: new Date(),
      events: [],
      resources: [],
      dayStatus: {},
      currentDayHours: {},
    },
    expanded: {
      checked: {},
      recent: {},
      appointments: {},
    },
    recordsMeta: {
      recent: {},
      checked: {},
      appointments: {},
    },
    employees: {
      enabled: [],
      disabled: [],
    },
    loading: false,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.setEmployees = setEmployees.bind(this);
    this.fetchRecord = fetchRecord.bind(this);
    this.onEdit = onEdit.bind(this);
    this.onEmployeeSelect = onEmployeeSelect.bind(this);
    this.onUpdate = onUpdate.bind(this);
    this.createRecord = createRecord.bind(this);
    this.updateRecord = updateRecord.bind(this);
    this.baseURL = props.baseURL || '/waitinglists';
    this.getCalendarEvents = getCalendarEvents.bind(this);
  }

  toggleFullscreen = el => {
    if (!this.getFilter(`${el}.fullscreen`)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = null;
    }
    this.toggleFilter(el, 'fullscreen');
  };

  fetchNewClients = page => {
    this.fetchTableRecords(page, 'recent');
  };

  fetchNewAppointments = page => {
    this.fetchTableRecords(page, 'appointments');
  };

  fetchCheckedClients = page => {
    this.fetchTableRecords(page, 'checked');
  };

  fetchTableRecords = (page, listType = false) => {
    this.setState({ loading: true });
    const { dateFrom, dateTo } = this.state;
    const tableFilters = {
      all: {
        employees: this.state.filters.all.employees,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      },
    };

    const params = {
      viewDate: this.state.calendar.viewDate.getTime() / 1000,
      ...(page && { page: Number(page) }),
      ...(listType && { listType }),
      ...(tableFilters && { filters: JSON.stringify(tableFilters) }),
    };
    const query = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    this.context.httpClient
      .getData(`${this.baseURL}/${query && `?${query}`}`)
      .then(validate.bind(this))
      .then(data => {
        if (listType) {
          const expanded = {};
          if (Array.isArray(data[listType].records)) {
            data[listType].records.forEach((el, i) => {
              if (
                el.apptStartTime ||
                el.apptEndTime ||
                el.note ||
                (Array.isArray(el.services) && el.services.length > 0)
              ) {
                expanded[i] = true;
              }
            });
          }
          this.setState({
            fetchFailed: false,
            expanded: {
              ...this.state.expanded,
              ...{ [listType]: expanded },
            },
            records: {
              ...this.state.records,
              ...(Array.isArray(data[listType].records) && {
                [listType]: data[listType].records,
              }),
            },
            recordsMeta: {
              ...this.state.recordsMeta,
              ...(data[listType].meta && {
                [listType]: data[listType].meta,
              }),
            },
          });
        } else {
          const expanded = {
            checked: {},
            recent: {},
            appointments: {},
          };
          if (Array.isArray(data.appointments.records)) {
            data.appointments.records.forEach((el, i) => {
              if (
                el.apptStartTime ||
                el.apptEndTime ||
                el.note ||
                (Array.isArray(el.services) && el.services.length > 0)
              ) {
                expanded.appointments[i] = true;
              }
            });
          }
          if (Array.isArray(data.recent.records)) {
            data.recent.records.forEach((el, i) => {
              if (
                el.apptStartTime ||
                el.apptEndTime ||
                el.note ||
                (Array.isArray(el.services) && el.services.length > 0)
              ) {
                expanded.recent[i] = true;
              }
            });
          }
          if (Array.isArray(data.checked.records)) {
            data.checked.records.forEach((el, i) => {
              if (
                el.apptStartTime ||
                el.apptEndTime ||
                el.note ||
                (Array.isArray(el.services) && el.services.length > 0)
              ) {
                expanded.checked[i] = true;
              }
            });
          }

          this.setState({
            expanded,
            fetchFailed: false,
            records: {
              ...(data.recent &&
                Array.isArray(data.recent.records) && {
                  recent: data.recent.records,
                }),
              ...(data.checked &&
                Array.isArray(data.checked.records) && {
                  checked: data.checked.records,
                }),
              ...(data.appointments &&
                Array.isArray(data.appointments.records) && {
                  appointments: data.appointments.records,
                }),
            },
            calendar: {
              events: data.calendar.events.map(el => ({
                ...el,
                ...{
                  start: new Date(el.start),
                  end: new Date(el.end),
                },
              })),
              ...(data.calendar.resources && {
                resources: data.calendar.resources,
              }),
              ...(data.calendar.viewDate && {
                viewDate: moment.unix(data.calendar.viewDate).toDate(),
              }),
              ...(data.calendar.dayStatus && {
                dayStatus: data.calendar.dayStatus,
              }),
              ...(data.calendar.currentDayHours && {
                currentDayHours: {
                  start: moment(data.calendar.currentDayHours.start, 'X').toDate(),
                  end: moment(data.calendar.currentDayHours.end, 'X').toDate(),
                },
              }),
            },
            recordsMeta: {
              ...(data.recent.meta && {
                recent: data.recent.meta,
              }),
              ...(data.checked.meta && {
                checked: data.checked.meta,
              }),
              ...(data.appointments.meta && {
                appointments: data.appointments.meta,
              }),
            },
          });
        }
        return data;
      })
      .then(() => this.setState({ loading: false }))
      .catch(err => {
        if (err instanceof TypeError) {
          this.setState({ fetchFailed: true });
        }
        this.setState({ loading: false });
        if (typeof err === 'object')
          Object.keys(err).forEach(key =>
            this.context.showNotification(err[key], 'error'),
          );
        else if (err._error) this.context.showNotification(err._error, 'error');
        else this.context.showNotification('Unhandled error', 'error');
      });
  };

  toggleProperty = (id, property = 'check') => {
    this.setState({ loading: true });
    return this.context.httpClient
      .sendData(`${this.baseURL}/${id}/${property}`, 'PUT')
      .then(validate.bind(this))
      .then(res => {
        this.setState({ loading: false });
      })
      .catch(e => {
        this.setState({ loading: false });
        if (!e.message) {
          return this.context.showNotification(
            'Error occured while changing clients status',
            'error',
          );
        }
      });
  };

  getFilter = path => _.get(this.state.filters, path);

  activeFilter = (path, inversed = false) => {
    const value = _.get(this.state.filters, path);
    if (inversed) return value ? {} : { color: '#20a8d8' };
    return value ? { color: '#20a8d8' } : {};
  };

  toggleFilter = (list, settingName) => {
    this.setState({
      ...{
        filters: {
          ...this.state.filters,
          [list]: {
            ...this.state.filters[list],
            [settingName]: !this.state.filters[list][settingName],
          },
        },
      },
    });

    localStorage.setItem(
      `waitingList/${list}/filters/${settingName}`,
      String(!this.state.filters[list][settingName]),
    );
  };

  setFilter = (list, settingName, value) => {
    this.setState({
      ...{
        filters: {
          ...this.state.filters,
          [list]: {
            ...this.state.filters[list],
            [settingName]: value,
          },
        },
      },
    });

    localStorage.setItem(
      `waitingList/${list}/filters/${settingName}`,
      JSON.stringify(value),
    );
  };

  toggleRowDetails = list => this.toggleFilter(list, 'expanded');

  toggleTableVisibility = list => this.toggleFilter(list, 'visibility');

  showModal = modalName => {
    this.setState({
      modals: {
        ...this.state.modals,
        ...{
          [modalName]: {
            isOpen: !this.state.modals[modalName].isOpen,
          },
        },
      },
    });
  };

  showAppointmentFilter = () => this.toggleFilter('appointments', 'showFilter');

  showAppointmentsModal = () => {
    if (!this.state.modals.appointments.isOpen) {
      clearInterval(this.updateInterval);
    } else {
      this.updateInterval = this.updateIntervalFunction();
    }
    this.showModal('appointments');
  };

  updateIntervalFunction = () =>
    setInterval(() => {
      this.setState({
        records: this.state.records,
      });
    }, 90000);

  componentDidMount() {
    if (process.env.BROWSER) {
      const getItem = path => {
        try {
          const slitted = path.split('.');
          const item = localStorage.getItem(
            `waitingList/${slitted[0]}/filters/${slitted[1]}`,
          );
          if (item) return JSON.parse(item);
          return this.getFilter(path);
        } catch (e) {
          // Clear all filters if we unable to parse
          localStorageForEach(item => {
            if (item.startsWith('waitingList')) {
              localStorage.removeItem(item);
            }
          });
          return this.getFilter(path);
        }
      };
      const filter = {};
      Object.keys(this.state.filters).forEach(list => {
        Object.keys(this.state.filters[list]).forEach(el => {
          if (!filter[list]) filter[list] = {};
          filter[list][el] = getItem(`${list}.${el}`);
        });
      });

      this.setState({
        filters: {
          ...this.state.filters,
          ...filter,
        },
      });

      this.context.socket.on('waitingList.setClients', this.fetchTableRecords);
      this.context.socket.on('queue.setEmployees', this.setEmployees);

      setTimeout(() => this.fetchTableRecords(), 0);

      // Interval needed for moment.js, so it can dynamically present dates
      // Dates will be reRendered every 90 seconds
      this.updateInterval = this.updateIntervalFunction();
      if (this.props.ownEdit) {
        const currentUser = this.context.store.getState().user;
        this.setState({
          currentUser,
        });
      }
    }
  }

  toggleTableActionDropdown = id => {
    this.setState({
      actionDropdown: {
        ...this.state.actionDropdown,
        ...{ [id]: !this.state.actionDropdown[id] },
      },
    });
  };

  componentWillUnmount() {
    if (process.env.BROWSER) {
      this.context.socket.off('waitingList.setClients', this.fetchTableRecords);
      this.context.socket.off('queue.setEmployees', this.setEmployees);
      clearInterval(this.updateInterval);
    }
  }

  goToAccount = user => {
    const accountId = get(user, 'id');
    if (accountId) history.push(`/accounts/${accountId}`);
  };

  render() {
    if (this.state.fetchFailed) {
      return <ReloadButton />;
    }
    const user = _.get(this.props, 'user') || {};
    return (
      <Row>
        <Col xs={{ size: 12 }} sm={{ size: 12 }} lg={{ size: 12 }}>
          <Modal
            size="lg"
            fade={false}
            className="modal-primary"
            isOpen={this.state.modals.appointments.isOpen}
            toggle={() => this.showAppointmentsModal()}
          >
            <div className="modal-header">
              <Col xs={6} className="mt-1">
                <h4 className="mb-0">Appointments</h4>
              </Col>
              <Col xs={5} className="text-right mt-1 pr-0">
                <a
                  className="modal-actions btn-setting btn"
                  onClick={() => this.showAppointmentsModal()}
                >
                  <i className="icon-close" />
                </a>
              </Col>
            </div>
            <Timeline
              view="day"
              toggle={() => this.showAppointmentsModal()}
              appointments={this.state.calendar}
              onEdit={this.onEdit}
              getCalendarEvents={this.getCalendarEvents}
              min={this.state.calendar.currentDayHours.start}
              max={this.state.calendar.currentDayHours.end}
              initialValues={{
                date: this.state.calendar.viewDate / 1000,
              }}
              viewDate={this.state.calendar.viewDate}
            />
          </Modal>
          <Modal
            size="lg"
            fade={false}
            className="modal-primary"
            isOpen={this.state.clientUpdateModal}
            toggle={this.onEdit}
          >
            <div className="modal-header">
              <Col
                xs={8}
                className="mt-1 text-overflow"
                onClick={() => this.goToAccount(user)}
              >
                {user.firstName && user.lastName && (
                  <React.Fragment>
                    <Avatar
                      color="#3E83F8"
                      size={35}
                      src={get(user, 'avatar', false)}
                      email={user.email}
                      facebookId={user.facebookId}
                      name={`${get(user, 'firstName', '-')} ${get(
                        user,
                        'lastName',
                        '-',
                      )}`}
                    />
                    <span className="ml-2 pr-0">
                      {_.get(user, 'firstName', '-')}{' '}
                      {_.get(user, 'lastName', '-')}
                    </span>
                  </React.Fragment>
                )}
              </Col>
              <Col xs={4} className="text-right mt-1 pl-0 pr-0">
                {_.get(this.state, 'modals.id') !== 'new' && (
                  <a
                    className="pl-0 pr-0 modal-actions btn-setting btn"
                    onClick={() =>
                      history.push(
                        `${window.location.pathname}/${this.state.modals.id}`,
                      )
                    }
                  >
                    <i className="icon-share-alt" />
                  </a>
                )}
                <a
                  className="pl-1 pr-0 modal-actions btn-setting btn"
                  onClick={this.onEdit}
                >
                  <i className="icon-close" />
                </a>
              </Col>
            </div>
            <WaitinglistForm
              ownEdit={this.props.ownEdit}
              currentUser={this.state.currentUser}
              initialValues={this.state.modals}
              clientUpdateModal={this.state.clientUpdateModal}
              selectedEmployees={this.state.modals.employees}
              listOfEnabledEmployees={this.state.listOfEnabledEmployees}
              listOfAllEmployees={this.state.listOfAllEmployees}
              onEmployeeSelect={this.onEmployeeSelect}
              onUpdate={this.onUpdate}
              onEdit={this.onEdit}
              actions={
                <Button color="secondary" onClick={() => this.onEdit()}>
                  Close
                </Button>
              }
              createRecord={this.createRecord}
              // onSubmit={this.onCreate}
            />
          </Modal>
          <Card
            key="appointments"
            className={
              this.getFilter('appointments.fullscreen') ? 'fullscreen' : ''
            }
          >
            <CardHeader>
              <Row>
                <Col xs={5} sm={6} lg={8} md={8} className="text-overflow">
                  <h4>Appointments</h4>
                </Col>
                <Col xs={7} sm={6} lg={4} md={4} className="pr-2 pl-0">
                  <div className="card-header-actions">
                    <a
                      className="card-header-action btn-setting btn"
                      onClick={() => this.onEdit('new')}
                    >
                      <i className="icon-user-follow" />
                    </a>
                    {_.get(this.state, 'calendar.resources').length !== 0 && (
                      <a
                        className="card-header-action btn-setting btn"
                        onClick={() => this.showAppointmentsModal()}
                      >
                        <i className="icon-calendar" />
                      </a>
                    )}
                    <a
                      style={this.activeFilter('appointments.showFilter')}
                      className="card-header-action btn-setting btn"
                      onClick={() => this.showAppointmentFilter()}
                    >
                      <i className="icon-settings" />
                    </a>
                    <ButtonDropdown
                      tag="span"
                      isOpen={this.state.actionDropdown.appointments}
                      toggle={() =>
                        this.toggleTableActionDropdown('appointments')
                      }
                    >
                      <DropdownToggle className="btn-link p-0 pl-2" color="">
                        <i className="icon-options" />
                      </DropdownToggle>
                      <DropdownMenu className="actions-column-dropdown" right>
                        <DropdownItem header>Actions</DropdownItem>
                        <DropdownItem
                          name="table-action-show-details"
                          onClick={() => this.toggleRowDetails('appointments')}
                        >
                          <a
                            style={this.activeFilter('appointments.expanded')}
                            className="card-header-action btn-setting"
                          >
                            <i className="icon-info" />
                            Show details
                          </a>
                        </DropdownItem>
                        <DropdownItem
                          name="table-action-fullscreen"
                          onClick={() => this.toggleFullscreen('appointments')}
                        >
                          <a
                            className="card-header-action btn-setting"
                            style={this.activeFilter('appointments.fullscreen')}
                          >
                            <i className="icon-size-fullscreen" />
                            Maximize table
                          </a>
                        </DropdownItem>
                        <DropdownItem
                          name="table-action-show-details"
                          onClick={() =>
                            this.toggleTableVisibility('appointments')
                          }
                        >
                          <a
                            href="#"
                            style={this.activeFilter(
                              'appointments.visibility',
                              true,
                            )}
                            className="card-header-action btn-setting"
                          >
                            <i className="icon-eye" />
                            Minimize table
                          </a>
                        </DropdownItem>
                      </DropdownMenu>
                    </ButtonDropdown>
                  </div>
                </Col>
              </Row>
              {this.getFilter('appointments.showFilter') && (
                <Row className="justify-content-end">
                  <Col
                    xs={12}
                    md={6}
                    className="pl-0 pr-0 pt-3 ml-2 pl-2 text-center text-md-right"
                  >
                    <Field
                      name="date"
                      className="btn btn-block btn-secondary pt-1"
                      // dateRange
                      // multiSelect
                      clearable
                      popperPlacement="auth-right"
                      onClick={async timeStamp => {
                        await this.setState({
                          dateFrom: timeStamp,
                        });
                        this.fetchTableRecords();
                      }}
                      // minDate={moment().toDate()}
                      dateFormat="MMM d, Y"
                      component={RenderDatePicker}
                    />
                    <Field
                      name="dateTo"
                      className="btn btn-block btn-secondary pt-1"
                      // dateRange
                      // multiSelect
                      clearable
                      popperPlacement="auth-right"
                      onClick={async timeStamp => {
                        await this.setState({
                          dateTo: timeStamp,
                        });
                        this.fetchTableRecords();
                      }}
                      minDate={moment.unix(this.state.dateFrom).toDate()}
                      dateFormat="MMM d, Y"
                      component={RenderDatePicker}
                    />
                  </Col>
                  {!this.props.noEmployeeFilter && (
                    <Col
                      xs={12}
                      md={3}
                      className="pl-0 pr-0 pt-3 ml-2 pl-2 align-items-end"
                    >
                      <Select
                        isMulti
                        closeMenuOnSelect={false}
                        options={this.state.listOfAllEmployees.map(el => ({
                          id: el.id,
                          name: el.name,
                        }))}
                        // isSearchable
                        defaultValue={this.state.filters.all.employees}
                        placeholder="Filter Employees"
                        className="basic-multi-select setting-dropdown"
                        onChange={async selected => {
                          await this.setFilter('all', 'employees', selected);
                          this.fetchTableRecords();
                        }}
                      />
                    </Col>
                  )}
                </Row>
              )}
            </CardHeader>
            {this.getFilter('appointments.visibility') && (
              <CardBody>
                <WaitingListTable
                  defaultPageSize={2}
                  expanded={
                    this.getFilter('appointments.expanded') &&
                    this.state.expanded.appointments
                  }
                  listOfEnabledEmployees={this.state.listOfEnabledEmployees}
                  listOfAllEmployees={this.state.listOfAllEmployees}
                  fetchData={this.fetchNewAppointments}
                  toggleProperty={this.toggleProperty}
                  loading={this.state.loading}
                  data={this.state.records.appointments}
                  meta={this.state.recordsMeta.appointments}
                  onEdit={this.onEdit}
                />
              </CardBody>
            )}
          </Card>
          <Card
            key="recent"
            className={this.getFilter('recent.fullscreen') ? 'fullscreen' : ''}
          >
            <CardHeader>
              <h4>Walk-ins</h4>
              <div className="card-header-actions">
                <ButtonDropdown
                  tag="span"
                  isOpen={this.state.actionDropdown.recent}
                  toggle={() => this.toggleTableActionDropdown('recent')}
                >
                  <DropdownToggle className="btn-link" color="">
                    <i className="icon-options" />
                  </DropdownToggle>
                  <DropdownMenu className="actions-column-dropdown" right>
                    <DropdownItem header>Actions</DropdownItem>
                    <DropdownItem
                      name="table-action-fullscreen"
                      onClick={() => this.toggleFullscreen('recent')}
                    >
                      <a
                        className="card-header-action btn-setting"
                        style={this.activeFilter('recent.fullscreen')}
                      >
                        <i className="icon-size-fullscreen" />
                        Maximize table
                      </a>
                    </DropdownItem>
                    <DropdownItem
                      name="table-action-show-details"
                      onClick={() => this.toggleTableVisibility('recent')}
                    >
                      <a
                        href="#"
                        style={this.activeFilter('recent.visibility', true)}
                        className="card-header-action btn-setting"
                      >
                        <i className="icon-eye" />
                        Minimize table
                      </a>
                    </DropdownItem>
                  </DropdownMenu>
                </ButtonDropdown>
              </div>
            </CardHeader>
            {this.getFilter('recent.visibility') && (
              <CardBody>
                <WaitingListTable
                  defaultPageSize={defaultPageSize}
                  expanded={this.state.expanded.recent}
                  listOfEnabledEmployees={this.state.listOfEnabledEmployees}
                  listOfAllEmployees={this.state.listOfAllEmployees}
                  fetchData={this.fetchNewClients}
                  toggleProperty={this.toggleProperty}
                  loading={this.state.loading}
                  data={this.state.records.recent}
                  meta={this.state.recordsMeta.recent}
                  onEdit={this.onEdit}
                />
              </CardBody>
            )}
          </Card>
          <Card
            key="checked"
            className={this.getFilter('checked.fullscreen') ? 'fullscreen' : ''}
          >
            <CardHeader>
              <h4>Done</h4>
              <div className="card-header-actions">
                <ButtonDropdown
                  tag="span"
                  isOpen={this.state.actionDropdown.checked}
                  toggle={() => this.toggleTableActionDropdown('checked')}
                >
                  <DropdownToggle className="btn-link" color="">
                    <i className="icon-options" />
                  </DropdownToggle>
                  <DropdownMenu className="actions-column-dropdown" right>
                    <DropdownItem header>Actions</DropdownItem>
                    <DropdownItem
                      name="table-action-fullscreen"
                      onClick={() => this.toggleFullscreen('checked')}
                    >
                      <a
                        className="card-header-action btn-setting"
                        style={this.activeFilter('checked.fullscreen')}
                      >
                        <i className="icon-size-fullscreen" />
                        Maximize table
                      </a>
                    </DropdownItem>
                    <DropdownItem
                      name="table-action-show-details"
                      onClick={() => this.toggleTableVisibility('checked')}
                    >
                      <a
                        href="#"
                        style={this.activeFilter('checked.visibility', true)}
                        className="card-header-action btn-setting"
                      >
                        <i className="icon-eye" />
                        Minimize table
                      </a>
                    </DropdownItem>
                  </DropdownMenu>
                </ButtonDropdown>
              </div>
            </CardHeader>
            {this.getFilter('checked.visibility') && (
              <CardBody>
                <WaitingListTable
                  defaultPageSize={defaultPageSize}
                  expanded={this.state.expanded.checked}
                  listOfEnabledEmployees={this.state.listOfEnabledEmployees}
                  listOfAllEmployees={this.state.listOfAllEmployees}
                  fetchData={this.fetchCheckedClients}
                  toggleProperty={this.toggleProperty}
                  loading={this.state.loading}
                  data={this.state.records.checked}
                  meta={this.state.recordsMeta.checked}
                  onEdit={this.onEdit}
                />
              </CardBody>
            )}
          </Card>
        </Col>
      </Row>
    );
  }
}

const selector = formValueSelector('waitinglistForm');

let waitingList = connect(state => {
  if (get(state, `form.waitinglistForm`)) {
    const user = selector(state, 'user');
    return {
      user,
    };
  }
  return {};
})(WaitingList);

waitingList = reduxForm({
  form: 'waitinglistTableFilter',
  touchOnChange: true,
  // enableReinitialize: true,
})(waitingList);

export {
  updateRecord,
  onEdit,
  fetchRecord,
  onEmployeeSelect,
  createRecord,
  onUpdate,
};

export { getCalendarEvents };

export default withStyles(s)(waitingList);
