import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody } from 'reactstrap';
import _ from 'lodash';
import { SubmissionError, change } from 'redux-form';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import BookingForm from '../../components/Forms/BookingForm/BookingForm';
import s from './Booking.css';
import { setNotification } from '../../actions/notifications';
import BookingApi from './BookingApi';


class Booking extends React.Component {
  state = {
    disabled: false,
    loading: true,
    employees: [],
    schedule: {
      hours: {},
      meta: {},
    },
    initialValues: {
      services: [],
    },
    meta: {},
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    focus: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.BookingApi = BookingApi.bind(this);
  }

  // WIP iOS PWA Save to Home screen share token
  // componentDidMount() {
  //   if ('caches' in window) {
  //     const cacheName = 'my-cache';
  //     caches.open(cacheName).then(cache => {
  //       cache.put('/token', new Response(JSON.stringify({ token: 'asd' })));
  //
  //       cache.match('/token').then(res => res.json()).then(el => this.setState({ cacheToken: JSON.stringify(el) }));
  //     });
  //   }
  // }
  redirectValidation = async response => {
    if (_.get(response, 'meta.redirect')) {
      const redirectCfg = _.get(response, 'meta.redirectCfg');
      if (redirectCfg.url) {
        window.location.replace(redirectCfg.url);
      }
    }
    if (response.meta) {
      this.setState({
        loading: false,
        meta: response.meta,
      })
    }
    return response
  };

  componentWillUnmount() {
    this.context.store.dispatch(setNotification({}));
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.BookingApi()
        .fetchServices()
        .then(this.redirectValidation)
        .then(data =>
          this.setState({
            initialValues: data,
          }),
        );
    }
  }

  fetchSchedule = (employee, selectedServices) => {
    return this.BookingApi()
      .fetchSchedule(employee, selectedServices)
      .then(this.redirectValidation)
      .then(schedule => {
        this.setState({
          schedule: {
            ...this.state.schedule,
            [employee.id]: { ...schedule },
          },
        });
      });
  };

  resetSchedule = () => {
    this.setState({ schedule: {} });
    this.context.store.dispatch(change('booking', 'time', null));
  };

  fetchEmployees = selectedServices =>
    this.BookingApi()
      .fetchEmployees(selectedServices)
      .then(this.redirectValidation)
      .then(data => this.setState({ employees: data }));

  render() {
    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            {!this.state.loading && (
              <BookingForm
                resetSchedule={this.resetSchedule}
                route={this.props.route}
                schedule={this.state.schedule}
                listOfEmployees={this.state.employees}
                fetchSchedule={this.fetchSchedule}
                fetchEmployees={this.fetchEmployees}
                initialValues={this.state.initialValues}
                disabled={this.state.disabled}
                onSubmit={this.submit}
                sendSMS={this.sendSMS}
                meta={this.state.meta}
              />
            )}
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}
export default withStyles(s)(Booking);
