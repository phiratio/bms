import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  ButtonDropdown,
  Card,
  CardBody,
  CardHeader,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Modal,
  ModalHeader,
  Row,
} from 'reactstrap';
import _ from 'lodash';
import { change, SubmissionError } from 'redux-form';
import moment from 'moment';
import WaitingListTable from '../../components/Tables/WaitingListTable';
import s from './WaitingList.css';
import { validate } from '../../core/httpClient';
import { setEmployees } from '../../core/socketEvents';
import ReloadButton from '../../components/ReloadButton';
import Timeline from '../../components/Timeline';
import WaitinglistForm from '../../components/Forms/WaitinglistForm';
import Select from '../../components/Select';

const defaultPageSize = 8;

const localStorageForEach = callback => {
  for (let i = 0; i < localStorage.length; i++) {
    callback(localStorage.key(i));
  }
};

class WaitingList extends React.Component {
  state = {
    listOfAllEmployees: [],
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
    clients: {
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
      currentDayHours: {},
    },
    expanded: {
      checked: {},
      recent: {},
      appointments: {},
    },
    clientsMeta: {
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
  }

  toggleFullscreen = el => {
    if (!this.getFilter(`${el}.fullscreen`)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = null;
    }
    this.toggleFilter(el, 'fullscreen');
  };

  updateRecord = (id, formData) => {
    this.setState({ loading: true });
    return this.context.httpClient
      .sendData(`/waitingLists/${id}`, 'PUT', formData)
      .then(validate.bind(this))
      .then(data => {
        this.setState({ loading: false });
        return data;
      })
      .catch(e => {
        this.setState({ loading: false });
        return Promise.reject(e);
      });
  };

  createRecord = formData => {
    this.setState({ loading: true });
    return this.context.httpClient
      .sendData(`/waitingLists/new`, 'POST', formData)
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
  };

  fetchRecord = id => {
    this.setState({ loading: true });
    return this.context.httpClient
      .getData(`/waitingLists/${id}`)
      .then(validate.bind(this))
      .then(data => {
        this.setState({ loading: false });
        return data;
      })
      .catch(err => {
        this.setState({ loading: false });
        if (typeof err === 'object')
          Object.keys(err).forEach(key =>
            this.context.showNotification(err[key], 'error'),
          );
        else if (err._error) this.context.showNotification(err._error, 'error');
        else this.context.showNotification('Unhandled error', 'error');
      });
  };

  fetchNewClients = page => {
    this.fetchTableRecords(page, 'recent');
  };

  fetchNewAppointments = (page) => {
    this.fetchTableRecords(page, 'appointments');
  };

  fetchCheckedClients = page => {
    this.fetchTableRecords(page, 'checked');
  };

  fetchTableRecords = (page, listType = false) => {
    this.setState({ loading: true });
    const tableFilters = {
      appointments: {
        employees: this.state.filters.appointments.employees,
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
      .getData(`/waitingLists/${query && `?${query}`}`)
      .then(validate.bind(this))
      .then(data => {
        if (listType) {
          const expanded = {};
          if (Array.isArray(data[listType].clients)) {
            data[listType].clients.forEach((el, i) => {
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
            clients: {
              ...this.state.clients,
              ...(Array.isArray(data[listType].clients) && {
                [listType]: data[listType].clients,
              }),
            },
            clientsMeta: {
              ...this.state.clientsMeta,
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
          if (Array.isArray(data.appointments.clients)) {
            data.appointments.clients.forEach((el, i) => {
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
          if (Array.isArray(data.recent.clients)) {
            data.recent.clients.forEach((el, i) => {
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
          if (Array.isArray(data.checked.clients)) {
            data.checked.clients.forEach((el, i) => {
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
            clients: {
              ...(data.recent &&
                Array.isArray(data.recent.clients) && {
                  recent: data.recent.clients,
                }),
              ...(data.checked &&
                Array.isArray(data.checked.clients) && {
                  checked: data.checked.clients,
                }),
              ...(data.appointments &&
                Array.isArray(data.appointments.clients) && {
                  appointments: data.appointments.clients,
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
              ...(data.calendar.currentDayHours && {
                currentDayHours: {
                  start: moment()
                    .startOf('day')
                    .add(data.calendar.currentDayHours.start, 'seconds')
                    .toDate(),
                  end: moment()
                    .startOf('day')
                    .add(data.calendar.currentDayHours.end, 'seconds')
                    .toDate(),
                },
              }),
            },
            clientsMeta: {
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
      .sendData(`/waitinglists/${id}/${property}`, 'PUT')
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
        clients: this.state.clients,
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
    }
  }

  onEmployeeSelect = (employee, singleSelect) => {
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
  };

  onUpdate = async (id, formData) =>
    this.updateRecord(id, formData)
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

  onEdit = async client => {
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
            date: new Date().getTime() / 1000,
            ...data,
          },
        });
      }
    }
    this.setState({
      clientUpdateModal: !this.state.clientUpdateModal,
    });
  };

  toggleTableActionDropdown = id => {
    this.setState({
      actionDropdown: {
        ...this.state.actionDropdown,
        ...{ [id]: !this.state.actionDropdown[id] },
      },
    });
  };

  getCalendarEvents = (timeStamp, employee) => {
    this.context.socket.emit(
      'waitingList.calendar.events',
      timeStamp,
      employee,
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
              currentDayHours: {
                start: moment()
                  .startOf('day')
                  .add(data.currentDayHours.start, 'seconds')
                  .toDate(),
                end: moment()
                  .startOf('day')
                  .add(data.currentDayHours.end, 'seconds')
                  .toDate(),
              },
            },
          });
        }

        if (data.message)
          this.context.showNotification(data.message, 'warning');
      },
    );
  };

  componentWillUnmount() {
    if (process.env.BROWSER) {
      this.context.socket.off('waitingList.setClients', this.fetchTableRecords);
      this.context.socket.off('queue.setEmployees', this.setEmployees);
      clearInterval(this.updateInterval);
    }
  }

  render() {
    if (this.state.fetchFailed) {
      return <ReloadButton />;
    }
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
            <Timeline
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
            <WaitinglistForm
              initialValues={this.state.modals}
              clientUpdateModal={this.state.clientUpdateModal}
              selectedEmployees={this.state.modals.employees}
              listOfEnabledEmployees={this.state.listOfEnabledEmployees}
              listOfAllEmployees={this.state.listOfAllEmployees}
              onEmployeeSelect={this.onEmployeeSelect}
              onUpdate={this.onUpdate}
              onEdit={this.onEdit}
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
              <h4>Appointments</h4>
              <div className="card-header-actions">
                <a
                  className="card-header-action btn-setting btn"
                  onClick={() => this.onEdit('new')}
                >
                  <i className="icon-user-follow" />
                </a>
                <a
                  className="card-header-action btn-setting btn"
                  onClick={() => this.showAppointmentsModal()}
                >
                  <i className="icon-calendar" />
                </a>
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
                  toggle={() => this.toggleTableActionDropdown('appointments')}
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
                      onClick={() => this.toggleTableVisibility('appointments')}
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
              {this.getFilter('appointments.showFilter') && (
                <Row className="justify-content-end">
                  <Col
                    xs={12}
                    md={3}
                    className="pl-0 pr-0 pt-3 ml-2 pl-2 align-items-center"
                  >
                    <Select
                      isMulti
                      closeMenuOnSelect={false}
                      options={this.state.listOfAllEmployees.map(el => ({
                        id: el.id,
                        name: el.name,
                      }))}
                      // isSearchable
                      defaultValue={this.state.filters.appointments.employees}
                      placeholder="Filter Employees"
                      className="basic-multi-select setting-dropdown"
                      onChange={async selected => {
                        console.log('selc', selected);
                        await this.setFilter('appointments', 'employees', selected);
                        this.fetchTableRecords();
                      }}
                    />
                  </Col>
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
                  data={this.state.clients.appointments}
                  meta={this.state.clientsMeta.appointments}
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
                  data={this.state.clients.recent}
                  meta={this.state.clientsMeta.recent}
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
                  data={this.state.clients.checked}
                  meta={this.state.clientsMeta.checked}
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

export default withStyles(s)(WaitingList);
