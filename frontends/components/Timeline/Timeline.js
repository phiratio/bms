import React, { Component } from 'react';
import moment from 'moment';
import get from 'lodash.get';
import {
  Col,
  Row,
  ButtonGroup,
  Button,
  ModalHeader,
  Modal,
  Card,
  CardBody,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ButtonDropdown,
  ModalBody,
} from 'reactstrap';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import shortId from 'shortid';
import _ from 'lodash';
import {
  Field,
  formValueSelector,
  getFormSubmitErrors,
  reduxForm,
  change,
} from 'redux-form';
import PropTypes from 'prop-types';
import Avatar from '../Avatar';
import {
  WAITING_LIST_STATUS_CANCELED,
  WAITING_LIST_STATUS_CONFIRMED,
  WAITING_LIST_STATUS_NOT_CONFIRMED,
  WAITING_LIST_TYPE_APPOINTMENT,
  WAITING_LIST_TYPE_RESERVED,
} from '../../constants';
import RenderDatePicker from '../Forms/RenderDatePicker';

const FORM_NAME = 'timelineForm';

function Event({ event }) {
  return (
    <span>
      <strong>{event.title}</strong>
      {event.desc && `:  ${event.desc}`}
    </span>
  );
}

const EmployeeModal = ({ modal = {}, toggle, changeDayStatus, calendar }) => (
  <Modal
    size="lg"
    fade={false}
    className="modal-primary"
    isOpen={modal.open}
    toggle={() =>
      toggle({
        open: !modal.open,
        data: modal.open && null,
      })
    }
  >
    <div className="modal-header">
      <Col xs={6} className="mt-1">
        <h4 className="mb-0">Actions</h4>
      </Col>
      <Col xs={5} className="text-right mt-1 pr-0">
        <a
          className="modal-actions btn-setting btn"
          onClick={() =>
            toggle({
              open: !modal.open,
              data: modal.open && null,
            })
          }
        >
          <i className="icon-close" />
        </a>
      </Col>
    </div>
    <ModalBody>
      <Row>
        <Col className="mt-1" xs={6}>
          Day Status
        </Col>
        <Col xs={6}>
          {_.get(calendar, `dayStatus.${_.get(modal, 'data.resourceId')}`) ===
          false ? (
            <Button
              onClick={() => changeDayStatus(_.get(modal, 'data.resourceId'))}
              className="btn-danger float-right"
            >
              Closed
            </Button>
          ) : (
            <Button
              onClick={() => changeDayStatus(_.get(modal, 'data.resourceId'))}
              className="btn-success float-right"
            >
              Open
            </Button>
          )}
        </Col>
      </Row>
    </ModalBody>
  </Modal>
);

function ResourceHeader({ label, resource, index }) {
  return (
    <React.Fragment>
      {label}
      <Button
        className="btn-link"
        color=""
        onClick={() => this.toggleModal({ open: true, data: resource })}
      >
        <i className="icon-options" />
      </Button>
    </React.Fragment>
  );
}

class AppTimeline extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    socket: PropTypes.object.isRequired,
  };

  state = {
    employeeModal: {
      open: false,
      data: null,
    },
  };

  constructor(props) {
    super(props);
    this.ResourceHeader = ResourceHeader.bind(this);
  }

  toggleModal = ({ open = !this.state.employeeModal.open, data = null }) =>
    this.setState({
      employeeModal: {
        open,
        data,
      },
    });

  changeDayStatus = accountId => {
    const status =
      _.get(this.props, `appointments.dayStatus.${accountId}`) !== true;
    this.context.socket.emit(
      'waitingList.calendar.changeDayStatus',
      accountId,
      this.props.viewDate,
      status,
    );
  };

  setCalendar = (date = new Date().getTime() / 1000) => {
    const userId = _.get(this.props, 'currentUser.id') || false;
    this.props.getCalendarEvents(date, userId);
    if (!this.props.doNotScrollToCurrent) {
      this.scrollToCurrentTime();
    }
    this.context.store.dispatch(change(FORM_NAME, 'date', date));
  };

  scrollToCurrentTime = () => {
    setTimeout(() => {
      const currentTimeIndicatorElements = document.getElementsByClassName(
        'rbc-current-time-indicator',
      );
      if (currentTimeIndicatorElements[0])
        currentTimeIndicatorElements[0].scrollIntoView();
    }, 430);
  };

  slotPropGetter = (date, resourceId) => {
    if (
      resourceId &&
      _.get(this.props, `appointments.dayStatus.${resourceId}`, undefined) ===
        false
    ) {
      return {
        className: 'calendar-closed-day',
      };
    }
  };

  eventPropGetter = (event, start, end, isSelected) => {
    let className = '';

    if (
      event.type === WAITING_LIST_TYPE_RESERVED &&
      event.status !== WAITING_LIST_STATUS_CANCELED
    ) {
      className = 'rbc-event-unavailable';
    } else if (event.check && event.status === WAITING_LIST_STATUS_CONFIRMED) {
      className = 'rbc-event-success';
    } else if (event.status === WAITING_LIST_STATUS_NOT_CONFIRMED) {
      className = 'rbc-event-warning';
    } else if (event.status === WAITING_LIST_STATUS_CANCELED) {
      className = 'rbc-event-danger';
    }

    return {
      className,
    };
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.setCalendar();
    }
  }

  render() {
    const nextDay = moment(this.props.viewDate)
      .add(1, 'day')
      .unix();
    const previousDay = moment(this.props.viewDate)
      .subtract(1, 'day')
      .unix();

    return (
      <Card key="timeline" style={{ overflow: 'auto' }} className="mb-0">
        <EmployeeModal
          modal={this.state.employeeModal}
          toggle={this.toggleModal}
          calendar={this.props.appointments}
          changeDayStatus={this.changeDayStatus}
        />
        <CardBody>
          <Row className="mb-2 justify-content-center text-center">
            <Col xs={1} className="mt-1 pt-2">
              <i
                className="icon-arrow-left"
                onClick={() => this.setCalendar(previousDay)}
              />
            </Col>
            <Col xs={9} className="text-center">
              <form>
                <Field
                  name="date"
                  className="btn btn-block btn-secondary w-100"
                  // dateRange
                  // multiSelect
                  onClick={timeStamp => {
                    this.props.getCalendarEvents(timeStamp);
                    this.scrollToCurrentTime();
                  }}
                  value={this.props.viewDate}
                  // minDate={moment().toDate()}
                  dateFormat="eee, MMM d, Y"
                  component={RenderDatePicker}
                />
              </form>
            </Col>
            <Col
              xs={1}
              className="text-right mt-1 pt-2"
              onClick={() => this.setCalendar(nextDay)}
            >
              <i className="icon-arrow-right" />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              {this.props.view === Views.AGENDA && (
                <Calendar
                  localizer={momentLocalizer(moment)}
                  events={this.props.appointments.events}
                  views={['agenda']}
                  min={this.props.min}
                  max={this.props.max}
                  // scrollToTime={ moment().toDate()  }
                  resources={this.props.appointments.resources}
                  resourceIdAccessor="resourceId"
                  components={{
                    toolbar: () => null,
                    event: Event,
                  }}
                  eventPropGetter={this.eventPropGetter}
                  resourceTitleAccessor="resourceTitle"
                  defaultView={Views.AGENDA}
                  style={{ height: 500 }}
                />
              )}
              {this.props.view === Views.DAY && (
                <Calendar
                  // selectable
                  localizer={momentLocalizer(moment)}
                  events={this.props.appointments.events}
                  views={['day']}
                  min={this.props.min}
                  max={this.props.max}
                  date={this.props.viewDate}
                  defaultDate={this.props.viewDate}
                  // scrollToTime={ moment().toDate()  }
                  resources={this.props.appointments.resources}
                  resourceIdAccessor="resourceId"
                  components={{
                    toolbar: () => null,
                    event: Event,
                    resourceHeader: this.ResourceHeader,
                  }}
                  slotPropGetter={this.slotPropGetter}
                  eventPropGetter={this.eventPropGetter}
                  resourceTitleAccessor="resourceTitle"
                  step={5}
                  defaultView={Views.DAY}
                  style={{ height: 500 }}
                  onSelectEvent={event => this.props.onEdit(event.id)}
                  onSelectSlot={date => console.log('onSelectSlot', date)}
                  onNavigate={date => console.log('onNavigate', date)}
                  onView={view => console.log('onView', view)}
                  onRangeChange={date => console.log('onRangeChange', date)}
                />
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>
    );
  }
}

export default reduxForm({
  form: FORM_NAME,
  touchOnChange: true,
})(AppTimeline);
