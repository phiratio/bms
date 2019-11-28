import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap';
import WaitingListTable from '../../components/Tables/WaitingListTable';
import s from './WaitingList.css';
import { validate } from '../../core/httpClient';
import { setEmployees } from '../../core/socketEvents';
import ReloadButton from '../../components/ReloadButton';
import Timeline from '../../components/Timeline';
import Schedule from '../../components/Schedule';
import {
  WAITING_LIST_TYPE_APPOINTMENT,
  WAITING_LIST_TYPE_WALK_IN,
  WAITING_LIST_TYPE_RESERVED,
} from '../../constants';

const defaultLayout = ['timeline', 'waitingList', 'done'];

class WaitingList extends React.Component {
  state = {
    fetchFailed: false,
    fullscreen: { registration: false, done: false },
    clients: {
      recent: [],
      checked: [],
    },
    appointments: {
      events: [],
      resources: [],
    },
    expanded: {
      checked: {},
      recent: {},
    },
    clientsMeta: {
      recent: {},
      checked: {},
    },
    employees: {
      enabled: [],
      disabled: [],
    },
    loading: false,
    layout: [],
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
    if (!this.state.fullscreen[el]) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = null;
    }
    this.setState({
      fullscreen: {
        [el]: !this.state.fullscreen[el],
      },
    });
  };

  updateClient = (id, employees) => {
    this.setState({ loading: true });
    return this.context.httpClient
      .sendData(`/waitingLists/${id}`, 'PUT', {
        employees: JSON.stringify(employees),
      })
      .then(validate.bind(this))
      .then(data => {
        this.setState({ loading: false });
      })
      .catch(e => {
        this.setState({ loading: false });
        this.context.showNotification('Unable to update client', 'error');
      });
  };

  fetchClient = id => {
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
    this.fetchClients(page, 'recent');
  };

  fetchCheckedClients = page => {
    this.fetchClients(page, 'checked');
  };

  fetchClients = (page, listType = false) => {
    this.setState({ loading: true });
    const params = {
      ...(page && { page: Number(page) }),
      ...(listType && { listType }),
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
              if (el.apptStartTime || el.apptEndTime  || el.note || (Array.isArray(el.services) && el.services.length > 0)) {
                expanded[i] = true;
              }
            });
          }
          this.setState({
            expanded: {
              [listType]: expanded,
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
          };
          if (Array.isArray(data.recent.clients)) {
            data.recent.clients.forEach((el, i) => {
              if (el.apptStartTime || el.apptEndTime || el.note || (Array.isArray(el.services) && el.services.length > 0)) {
                expanded.recent[i] = true;
              }
            });
          }
          if (Array.isArray(data.checked.clients)) {
            data.checked.clients.forEach((el, i) => {
              if (el.apptStartTime || el.apptEndTime || el.note || (Array.isArray(el.services) && el.services.length > 0)) {
                expanded.checked[i] = true;
              }
            });
          }

          this.setState({
            expanded,
            clients: {
              ...(data.recent &&
                Array.isArray(data.recent.clients) && {
                  recent: data.recent.clients,
                }),
              ...(data.checked &&
                Array.isArray(data.checked.clients) && {
                  checked: data.checked.clients,
                }),
            },
            appointments: {
              events: data.appointments.events.map(el => ({
                ...el,
                ...{
                  start: new Date(el.start),
                  end: new Date(el.end),
                },
              })),
              ...(data.appointments.resources && { resources: data.appointments.resources }),
            },
            clientsMeta: {
              ...(data.recent.meta && {
                recent: data.recent.meta,
              }),
              ...(data.checked.meta && {
                checked: data.checked.meta,
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

  moveComponent = (direction, componentName) => {
    const index = this.state.layout.indexOf(componentName);
    if (index > -1) {
      const nextIndex = direction === 'up' ? -1 : +1;
      const { layout } = this.state;
      const item = layout.splice(index, 1)[0];
      layout.splice(index + nextIndex, 0, item);
      this.setState({ layout });
      localStorage.setItem('waitinList/layout', JSON.stringify(layout));
    }
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
        this.context.showNotification(
          'Error occured while changing clients status',
          'error',
        );
      });
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.context.socket.on('waitingList.setClients', this.fetchClients);
      this.context.socket.on('queue.setEmployees', this.setEmployees);
      this.fetchClients();
      // Interval needed for moment.js, so it can dynamically present dates
      // Dates will be reRendered every 90 seconds
      this.updateInterval = setInterval(() => {
        this.setState({
          clients: this.state.clients,
        });
      }, 90000);
      const waitingListLayout = localStorage.getItem('waitinList/layout');
      if (waitingListLayout) {
        try {
          const parsedLayout = JSON.parse(waitingListLayout);
          this.setState({ layout: parsedLayout });
        } catch (e) {
          this.setState({ layout: defaultLayout });
        }
      } else {
        this.setState({ layout: defaultLayout });
      }
    }
  }

  componentWillUnmount() {
    if (process.env.BROWSER) {
      this.context.socket.off('waitingList.setClients', this.fetchClients);
      this.context.socket.off('queue.setEmployees', this.setEmployees);
      clearInterval(this.updateInterval);
    }
  }

  render() {
    if (this.state.fetchFailed) {
      return <ReloadButton />;
    }
    const layout = {
      timeline: (
        <Card key="timeline" style={{ overflow: 'auto' }}>
          <CardHeader>
            <h4>Upcoming Appointments</h4>
            <div className="card-header-actions">
              <a
                className="card-header-action btn-setting btn"
                onClick={() => this.moveComponent('up', 'timeline')}
              >
                <i className="icon-arrow-up" />
              </a>
              <a
                className="card-header-action btn-setting btn"
                onClick={() => this.moveComponent('down', 'timeline')}
              >
                <i className="icon-arrow-down" />
              </a>
            </div>
          </CardHeader>
          <CardBody>
            {/* <Col style={{ height: !this.state.fullscreen.appointments  ? '400px' : '100%' }}> */}
            {/*  <Schedule /> */}
            {/* </Col> */}
            <Timeline
              appointments={this.state.appointments}
            />
          </CardBody>
        </Card>
      ),
      waitingList: (
        <Card
          key="waitingList"
          className={this.state.fullscreen.registration ? 'fullscreen' : ''}
        >
          <CardHeader>
            <h4>Walk-ins</h4>
            <div className="card-header-actions">
              <a
                className="card-header-action btn-setting btn"
                style={
                  this.state.fullscreen.registration ? { color: '#20a8d8' } : {}
                }
                onClick={() => this.toggleFullscreen('registration')}
              >
                <i className="icon-size-fullscreen" />
              </a>
            </div>
          </CardHeader>
          <CardBody>
            <WaitingListTable
              expanded={this.state.expanded.recent}
              listOfEnabledEmployees={this.state.listOfEnabledEmployees}
              listOfAllEmployees={this.state.listOfAllEmployees}
              fetchClient={this.fetchClient}
              updateClient={this.updateClient}
              fetchData={this.fetchNewClients}
              toggleProperty={this.toggleProperty}
              loading={this.state.loading}
              data={this.state.clients.recent}
              meta={this.state.clientsMeta.recent}
            />
          </CardBody>
        </Card>
      ),
      done: (
        <Card
          key="done"
          className={this.state.fullscreen.done ? 'fullscreen' : ''}
        >
          <CardHeader>
            <h4>Done</h4>
            <div className="card-header-actions">
              <a
                className="card-header-action btn-setting btn"
                style={
                  this.state.fullscreen.done
                    ? { color: '#20a8d8' }
                    : { color: '#73818f' }
                }
                onClick={() => {
                  this.toggleFullscreen('done');
                }}
              >
                <i className="icon-size-fullscreen" />
              </a>
            </div>
          </CardHeader>
          <CardBody>
            <WaitingListTable
              expanded={this.state.expanded.checked}
              listOfEnabledEmployees={this.state.listOfEnabledEmployees}
              listOfAllEmployees={this.state.listOfAllEmployees}
              fetchClient={this.fetchClient}
              updateClient={this.updateClient}
              fetchData={this.fetchCheckedClients}
              toggleProperty={this.toggleProperty}
              loading={this.state.loading}
              data={this.state.clients.checked}
              meta={this.state.clientsMeta.checked}
            />
          </CardBody>
        </Card>
      ),
    };

    return (
      <Row>
        <Col xs={{ size: 12 }} sm={{ size: 12 }} lg={{ size: 12 }}>
          {this.state.layout.map(el => layout[el])}
        </Col>
      </Row>
    );
  }
}

export default withStyles(s)(WaitingList);
