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
  Row,
} from 'reactstrap';
import _ from 'lodash';
import { Views } from 'react-big-calendar';
import history from '../../../history';
import s from './Calendar.css';
import NotFound from '../../../components/NotFound';
import Timeline from '../../../components/Timeline';
import { fetchRecord, getCalendarEvents, onEdit } from './WaitingList';

class Calendar extends React.Component {
  state = {
    view: Views.DAY,
    actionsDropdown: false,
    currentUser: {},
    modals: {
      appointments: {
        isOpen: false,
      },
      user: {},
      employees: [],
    },
    notFound: false,
    calendar: {
      viewDate: new Date(),
      events: [],
      resources: [],
      currentDayHours: {},
    },
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.getCalendarEvents = getCalendarEvents.bind(this);
    this.baseURL = props.baseURL;
  }

  onEdit = id => {
    history.push(`${window.location.pathname}/${id}`);
  };

  refreshView = () => {
    if (this.state.currentUser.id) {
      this.getCalendarEvents(
        this.state.calendar.viewDate / 1000,
        this.state.currentUser.id,
      );
    }
  };

  changeDayStatus = () => {
    const status = _.get(this.state, `calendar.dayStatus.${this.state.currentUser.id}`) !== true;
    this.context.socket.emit(
      'waitingList.calendar.changeOwnDayStatus',
      this.state.calendar.viewDate,
      status,
    );
  };

  setAgendaView = () => {
    this.setState({ view: Views.AGENDA });
  };

  setDayView = () => {
    this.setState({ view: Views.DAY });
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      const currentUser = this.context.store.getState().user;
      this.setState({
        currentUser,
      });
      if (!currentUser.id) {
        this.setState({
          notFound: true,
        });
      }
      // this.getCalendarEvents(new Date().getTime() / 1000, currentUser.id);
      this.context.socket.on('waitingList.setClients', this.refreshView);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.context.socket.off('waitingList.setClients', this.refreshView);
  }

  render() {
    return (
      <React.Fragment>
        <Row>
          <Col>
            <Card className="mb-0">
              <CardHeader className="pb-0 pr-2">
                <h4>{this.props.title}</h4>
                <div className="card-header-actions">
                  <button
                    className="card-header-action btn-setting btn btn-link"
                    onClick={() => {
                      history.push('/profile/appointments/add');
                    }}
                  >
                    <i className="icon-user-follow" />
                  </button>
                  <ButtonDropdown
                    tag="span"
                    isOpen={this.state.actionsDropdown}
                    toggle={() =>
                      this.setState({
                        actionsDropdown: !this.state.actionsDropdown,
                      })
                    }
                  >
                    <DropdownToggle className="btn-link" color="">
                      <i className="icon-options" />
                    </DropdownToggle>
                    <DropdownMenu className="actions-column-dropdown" right>
                      <DropdownItem header>Actions</DropdownItem>
                      <DropdownItem
                        name="table-action-close-day"
                        onClick={() => this.changeDayStatus()}
                      >
                        <a className="card-header-action btn-setting">
                          <i className="icon-rocket" />
                          {_.get(this.state, `calendar.dayStatus.${this.state.currentUser.id}`) ? 'Close this day' : 'Open this day'}
                        </a>
                      </DropdownItem>
                      <DropdownItem
                        name="table-action-close-day"
                        onClick={() => {
                          if (this.state.view === Views.DAY) {
                            return this.setAgendaView();
                          }
                          return this.setDayView();
                        }}
                      >
                        <a className="card-header-action btn-setting">
                          <i className="icon-layers" />
                          {this.state.view === Views.AGENDA
                            ? 'Show Day'
                            : 'Show Agenda'}
                        </a>
                      </DropdownItem>
                    </DropdownMenu>
                  </ButtonDropdown>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {this.state.notFound && (
                  <Row>
                    <Col>
                      <NotFound
                        title="Calendar was not found for this user"
                        doNotShowBackButton
                      />
                    </Col>
                  </Row>
                )}
                {!this.state.notFound && !_.isEmpty(this.state.currentUser) && (
                  <Timeline
                    // doNotScrollToCurrent
                    currentUser={this.state.currentUser}
                    view={this.state.view}
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
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default withStyles(s)(Calendar);
