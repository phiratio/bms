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
} from 'reactstrap';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import shortId from 'shortid';
import Avatar from '../Avatar';
import {
  WAITING_LIST_STATUS_CANCELED,
  WAITING_LIST_STATUS_CONFIRMED,
  WAITING_LIST_STATUS_NOT_CONFIRMED,
  WAITING_LIST_TYPE_RESERVED
} from '../../constants';
import _ from "lodash";
import RenderDatePicker from "../Forms/RenderDatePicker";
import {Field, formValueSelector, getFormSubmitErrors, reduxForm, change} from "redux-form";
import PropTypes from "prop-types";
import waitinglistForm from "../Forms/WaitinglistForm";

const FORM_NAME = 'timelineForm';

function Event({ event }) {
  return (
    <span>
      <strong>{event.title}</strong>
      {event.desc && `:  ${event.desc}`}
    </span>
  );
}

class AppTimeline extends Component {

  static contextTypes = {
    store: PropTypes.object.isRequired,
  };

  // onPrevClick = () => {
  //   this.animateScroll(true);
  // };
  //
  // onNextClick = () => {
  //   this.animateScroll(false);
  // };
  //
  // nextStepScroll = () => {
  //   this.setTimeline(
  //     {
  //       startTime: moment().add(this.state.showInWaitingListTime.id, 'second'),
  //       endTime: moment()
  //         .add(this.state.showInWaitingListTime.id, 'second')
  //         .add(1, 'hour'),
  //     },
  //     this.timelineHour,
  //   );
  // };
  //
  // animateScroll = invert => {
  //   const timelineWidth = parseFloat(this.scrollRef.style.width);
  //   const width = (invert ? -1 : 1) * timelineWidth; // cos curve in both directions
  //   const duration = 500;
  //
  //   const startTime = performance.now();
  //   let lastWidth = 0;
  //   const animate = () => {
  //     let normalizedTime = (performance.now() - startTime) / duration;
  //     if (normalizedTime > 1) {
  //       // not overanimate
  //       normalizedTime = 1;
  //     }
  //
  //     // http://www.wolframalpha.com/input/?i=plot+0.5+(1%2Bcos(%CF%80+(x-1)))*1000+from+0+to+1 --> 1000 is the simulated width
  //     const calculatedWidth = Math.floor(
  //       width * 0.5 * (1 + Math.cos(Math.PI * (normalizedTime - 1))),
  //     );
  //     this.scrollRef.scrollLeft += calculatedWidth - lastWidth;
  //     lastWidth = calculatedWidth;
  //
  //     if (normalizedTime < 1) {
  //       requestAnimationFrame(animate);
  //     }
  //   };
  //   requestAnimationFrame(animate);
  // };

  setCalendar = date => {
      this.props.getCalendarEvents(date);
      this.scrollToCurrentTime();
      this.context.store.dispatch(change(FORM_NAME, 'date', date))
  };

  scrollToCurrentTime = () => {
    setTimeout(() => {
      const currentTimeIndicatorElements = document.getElementsByClassName('rbc-current-time-indicator');
      if (currentTimeIndicatorElements[0]) currentTimeIndicatorElements[0].scrollIntoView();
    }, 430);
  };


  componentDidMount() {
    // this.showUpcoming();
    // this.setTimelineUpdateInterval();
    if (process.env.BROWSER) {
      this.scrollToCurrentTime();
    }
  }

  render() {

    const today = moment().unix();
    const nextDay = moment(this.props.viewDate).add(1, 'day').unix();
    const previousDay = moment(this.props.viewDate).subtract(1, 'day').unix();

    return (
      <React.Fragment>
        <div className="modal-header">
          <Col xs={6} className="mt-1">
            <h4 className="mb-0">Appointments</h4>
          </Col>
          <Col xs={5} className="text-right mt-1 pr-0" onClick={() => this.setCalendar(today)}>
            <a className="modal-actions btn-setting btn">
              <i className="icon-clock" />
            </a>
            <a className="modal-actions btn-setting btn" onClick={this.props.toggle}>
              <i className="icon-close" />
            </a>
          </Col>
        </div>
        <Card key="timeline" style={{ overflow: 'auto' }}>
          <CardBody>
            <Row className="mb-2">
              <Col xs={1} className="mt-1">
                <i className="icon-arrow-left" onClick={() => this.setCalendar(previousDay)} />
              </Col>
              <Col xs={10} className="text-center mt-1">
                <form>
                  <Field
                    name="date"
                    className="btn btn-block btn-secondary"
                    // dateRange
                    // multiSelect
                    onClick={timeStamp => {
                      this.props.getCalendarEvents(timeStamp);
                      this.scrollToCurrentTime();
                    }}
                    value={this.props.viewDate}
                    // minDate={moment().toDate()}
                    dateFormat="eeee, MMM d, Y"
                    component={RenderDatePicker}
                  />
                </form>
              </Col>
              <Col xs={1} className="text-right mt-1" onClick={() => this.setCalendar(nextDay)}>
                <i className="icon-arrow-right" />
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <Calendar
                  selectable
                  localizer={momentLocalizer(moment)}
                  events={this.props.appointments.events}
                  step={5}
                  views={['day']}
                  min={this.props.min}
                  max={this.props.max}
                  date={this.props.viewDate}
                  defaultDate={this.props.viewDate}
                  // scrollToTime={moment(this.props.min).isSame(moment(this.props.viewDate), 'day' ) ? moment().toDate() : new Date(0,0,0,0) }
                  resources={this.props.appointments.resources}
                  resourceIdAccessor="resourceId"
                  components={{
                    toolbar: () => null,
                    event: Event,
                  }}
                  eventPropGetter={(event, start, end, isSelected) => {
                    let className = '';
                    // const newStyle = {
                    //   // backgroundColor: 'lightgrey',
                    //   // color: 'black',
                    //   // borderRadius: '0px',
                    //   // border: 'none',
                    // };
                    //
                    if (event.check && event.status === WAITING_LIST_STATUS_CONFIRMED) {
                      className = 'rbc-event-success';
                    } else if (event.status === WAITING_LIST_STATUS_NOT_CONFIRMED) {
                      className = 'rbc-event-warning';
                    } else if (event.status === WAITING_LIST_STATUS_CANCELED) {
                      className = 'rbc-event-danger';
                    }
                    //
                    return {
                      className,
                      // style: newStyle,
                    };
                  }}
                  resourceTitleAccessor="resourceTitle"
                  defaultView={Views.DAY}
                  style={{ height: 500 }}
                  onSelectEvent={event => this.props.onEdit(event.id)}
                  // onSelectSlot={this.handleSelect}
                  onNavigate={date => console.log('onNavigate', date)}
                  onView={view => console.log('onView', view)}
                  onRangeChange={date => console.log('onRangeChange', date)}
                />
              </Col>
            </Row>
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}


export default reduxForm({
  form: FORM_NAME,
  touchOnChange: true,
})(AppTimeline);



