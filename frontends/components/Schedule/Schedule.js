import React, { Component } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

const localizer = momentLocalizer(moment);

const events = [
  {
    id: 0,
    title: 'Alex Kulikovskikh',
    start: new Date(2019, 6, 20, 8, 0, 0),
    end: new Date(2019, 6, 20, 8, 15, 0),
    resourceId: 1,
  },
  {
    id: 0,
    title: 'John Doe',
    start: new Date(2019, 6, 20, 8, 15, 0),
    end: new Date(2019, 6, 20, 8, 35, 0),
    resourceId: 1,
  },
  {
    id: 0,
    title: 'Steve Doe',
    start: new Date(2019, 6, 20, 8, 45, 0),
    end: new Date(2019, 6, 20, 9, 0, 0),
    resourceId: 1,
  },
  // {
  //   id: 1,
  //   title: 'MS training',
  //   allDay: true,
  //   start: new Date(2018, 0, 29, 14, 0, 0),
  //   end: new Date(2018, 0, 29, 16, 30, 0),
  //   resourceId: 2,
  // },
  {
    id: 2,
    title: 'Jim Doe',
    start: new Date(2019, 6, 20, 8, 15, 0),
    end: new Date(2019, 6, 20, 8, 30, 0),
    resourceId: 3,
  },
  {
    id: 11,
    title: 'Mike Doe',
    start: new Date(2018, 6, 30, 7, 0, 0),
    end: new Date(2018, 6, 30, 10, 30, 0),
    resourceId: 4,
  },
];

const resourceMap = [
  { resourceId: 1, resourceTitle: 'Sam' },
  { resourceId: 2, resourceTitle: 'Farukh' },
  { resourceId: 3, resourceTitle: 'Barber 3' },
];

class Schedule extends React.Component {
  state = {
    minutes: 1,
    scrollTime: new Date(2019, 6, 20, 2, 0, 0),
  };

  // componentDidMount(){
  //   setInterval(() => {
  //     console.log('timeout')
  //     this.setState({
  //       minutes: this.state.minutes + 1,
  //       scrollTime: new Date(2019, 6, 20, 1,this.state.minutes,0),
  //     });
  //   }, 2000);
  // }

  render() {
    return (
      <Calendar
        events={events}
        localizer={localizer}
        toolbar={false}
        defaultView={Views.DAY}
        views={['day', 'work_week']}
        showMultiDayTimes={false}
        step={2}
        timeslots={5}
        // scrollToTime={this.state.scrollTime}
        min={new Date(2019, 6, 20, 8, 0, 0)}
        max={new Date(2019, 6, 20, 20, 0, 0)}
        defaultDate={new Date(2019, 6, 20)}
        resources={resourceMap}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="resourceTitle"
      />
    );
  }
}

export default Schedule;
