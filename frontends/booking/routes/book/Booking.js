import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody } from 'reactstrap';
import _ from 'lodash';
import { stopSubmit, change, formValueSelector } from 'redux-form';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import BookingForm from '../../../components/Forms/BookingForm/BookingForm';
import s from './Booking.css';
import { setNotification } from '../../../actions/notifications';
import BookingApi from '../../../core/BookingApi';

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
    focus: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
    translate: PropTypes.func.isRequired,
  };

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
      });
    }
    return response;
  };

  storeValues() {
    const selector = formValueSelector('booking');
    const storeValues = selector(
      this.context.store.getState(),
      'services',
      'employees',
      'schedule',
      'time',
      'selectedEmployee',
    );

    if (!_.isEmpty(storeValues)) return storeValues;
    return null;
  }

  sessionValues = () => {
    if (process.env.BROWSER && typeof Storage !== 'undefined') {
      let sessionValues = sessionStorage.getItem('appointment');
      if (sessionValues) {
        try {
          sessionValues = JSON.parse(sessionValues);
        } catch (e) {
          console.error('Unable to parse cached session values');
        }

        return sessionValues;
      }
    }

    return null;
  };

  submitBooking = formData =>
    this.BookingApi()
      .submitAppointment(formData)
      .then(data => {
        this.setState({
          loading: false,
        });
        return data;
      });

  fetchServices = () =>
    this.BookingApi()
      .fetchServices()
      .then(this.redirectValidation)
      .then(data =>
        this.setState({
          loading: false,
          initialValues: data,
        }),
      );

  componentWillUnmount() {
    this.context.store.dispatch(setNotification({}));
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.BookingApi = BookingApi.bind(this);

      let formValues = this.storeValues();

      if (!formValues) {
        const sessionValues = this.sessionValues();
        const timestamp = _.get(sessionValues, 'timestamp');
        const currentTimeStamp = Math.floor(new Date().getTime() / 1000);
        if (!timestamp || currentTimeStamp - timestamp > 60 * 9) {
          sessionStorage.removeItem('appointment');
        } else {
          formValues = sessionValues;
        }
      }

      if (formValues && this.props.route.path === '/summary') {
        return this.setState({
          loading: false,
          initialValues: formValues,
        });
      }
      this.fetchServices();
    }
  }

  fetchSchedule = (employee, selectedServices) =>
    this.BookingApi()
      .fetchSchedule(employee, selectedServices)
      .then(this.redirectValidation)
      .then(schedule => {
        if (_.isEmpty(schedule)) {
          this.context.store.dispatch(
            stopSubmit('booking', {
              formInfo: "Selected employee doesn't have available hours",
            }),
          );
        }
        this.setState({
          schedule: {
            ...this.state.schedule,
            [employee.id]: { ...schedule },
          },
        });
      })
      .catch(e => {
        if (_.get(e, 'message.errors')) {
          this.context.store.dispatch(stopSubmit('booking', e.message.errors));
        }
        this.setState({
          schedule: {
            ...this.state.schedule,
            [employee.id]: {},
          },
        });
      });

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
                loading={this.state.loading}
                resetSchedule={this.resetSchedule}
                route={this.props.route}
                schedule={this.state.schedule}
                listOfEmployees={this.state.employees}
                fetchSchedule={this.fetchSchedule}
                fetchServices={this.fetchServices}
                fetchEmployees={this.fetchEmployees}
                initialValues={this.state.initialValues}
                disabled={this.state.disabled}
                onSubmit={this.submitBooking}
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
