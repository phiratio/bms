import React, { Component } from 'react';
import moment from 'moment';
import get from 'lodash.get';
import { Col, Row, ButtonGroup, Button } from 'reactstrap';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import shortId from 'shortid';
import Avatar from '../Avatar';
import {WAITING_LIST_TYPE_RESERVED} from "../../constants";

function Event({ event }) {
  return (
    <span>
      <strong>{event.title}</strong>
      {event.desc && `:  ${event.desc}`}
    </span>
  );
}

export default class AppTimeline extends Component {
  state = {
    scrollToTime: new Date(),
  };

  onPrevClick = () => {
    this.animateScroll(true);
  };

  onNextClick = () => {
    this.animateScroll(false);
  };

  nextStepScroll = () => {
    this.setTimeline(
      {
        startTime: moment().add(this.state.showInWaitingListTime.id, 'second'),
        endTime: moment()
          .add(this.state.showInWaitingListTime.id, 'second')
          .add(1, 'hour'),
      },
      this.timelineHour,
    );
  };

  animateScroll = invert => {
    const timelineWidth = parseFloat(this.scrollRef.style.width);
    const width = (invert ? -1 : 1) * timelineWidth; // cos curve in both directions
    const duration = 500;

    const startTime = performance.now();
    let lastWidth = 0;
    const animate = () => {
      let normalizedTime = (performance.now() - startTime) / duration;
      if (normalizedTime > 1) {
        // not overanimate
        normalizedTime = 1;
      }

      // http://www.wolframalpha.com/input/?i=plot+0.5+(1%2Bcos(%CF%80+(x-1)))*1000+from+0+to+1 --> 1000 is the simulated width
      const calculatedWidth = Math.floor(
        width * 0.5 * (1 + Math.cos(Math.PI * (normalizedTime - 1))),
      );
      this.scrollRef.scrollLeft += calculatedWidth - lastWidth;
      lastWidth = calculatedWidth;

      if (normalizedTime < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  componentDidMount() {
    // this.showUpcoming();
    // this.setTimelineUpdateInterval();
  }

  render() {
    return (
      <React.Fragment>
        <Row className="mb-3">
          <Col xs={12} className="text-right">
            <ButtonGroup>
              <Button className="btn-square btn-outline-primary">
                Show Upcoming
              </Button>
              <Button
                className="btn-square btn-outline-primary"
                onClick={() =>
                  this.setState({ scrollToTime: new Date(2018, 0, 29, 6, 15) })
                }
              >
                Log
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col xs={1}>
            <i className="icon-arrow-left" />
          </Col>
          <Col xs={10} className="text-center">
            <h4 className="mb-3">%date%</h4>
          </Col>
          <Col xs={1} className="text-right">
            <i className="icon-arrow-right" />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            {console.log('this.props.appointments', this.props.appointments)}
            <Calendar
              selectable
              localizer={momentLocalizer(moment)}
              events={this.props.appointments.events}
              step={5}
              views={['day']}
              defaultDate={new Date()}
              resources={this.props.appointments.resources}
              resourceIdAccessor="resourceId"
              components={{
                toolbar: () => null,
                event: Event,
              }}
              eventPropGetter={(event, start, end, isSelected) => {
                // const newStyle = {
                //   // backgroundColor: 'lightgrey',
                //   // color: 'black',
                //   // borderRadius: '0px',
                //   // border: 'none',
                // };
                //
                // if (event.type === WAITING_LIST_TYPE_RESERVED) {
                //   newStyle.backgroundColor = '#ccc';
                // }
                //
                // return {
                //   className: '',
                //   style: newStyle,
                // };
              }}
              resourceTitleAccessor="resourceTitle"
              defaultView={Views.DAY}
              style={{ height: 500 }}
              scrollToTime={new Date()}
              // onSelectEvent={event => alert(event.title)}
              // onSelectSlot={this.handleSelect}
              onNavigate={date => console.log('onNavigate', date)}
              onView={view => console.log('onView', view)}
              onRangeChange={date => console.log('onRangeChange', date)}
            />
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}
