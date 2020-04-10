import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Button, Card, CardBody, Col, Row } from 'reactstrap';
import moment from 'moment';
import AppointmentsClientTable from '../../../../components/Tables/AppointmentsClientTable';
import s from './Appointments.css';
import ReloadButton from '../../../../components/ReloadButton';
import BookingApi from '../../../../core/BookingApi';
import history from '../../../../history';

const defaultPageSize = 5;

class Appointments extends React.Component {
  state = {
    fetchFailed: false,
    records: [],
    recordsMeta: {},
    loading: false,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
  }

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

  fetchTableRecords = (page, listType = false) => {
    this.setState({ loading: true });
    const params = {
      ...(page && { page: Number(page) }),
    };
    this.BookingApi()
      .fetchAppointments(params)
      .then(data => {
        this.setState({
          fetchFailed: false,
          records: data.records || [],
          recordsMeta: data.meta || {},
        });
        return data;
      })
      .then(() => this.setState({ loading: false }))
      .catch(err => {
        if (err instanceof TypeError) {
          this.setState({ fetchFailed: true });
        }
        this.setState({ loading: false });
        // if (typeof err === 'object')
        //   Object.keys(err).forEach(key =>
        //     this.context.showNotification(err[key], 'error'),
        //   );
        // else if (err._error) this.context.showNotification(err._error, 'error');
        // else this.context.showNotification('Unhandled error', 'error');
      });
  };

  updateIntervalFunction = () =>
    setInterval(() => {
      this.setState({
        records: this.state.records,
      });
    }, 90000);

  componentDidMount() {
    if (process.env.BROWSER) {
      this.BookingApi = BookingApi.bind(this);
      setTimeout(() => this.fetchTableRecords(), 0);
      // Interval needed for moment.js, so it can dynamically present dates
      // Dates will be reRendered every 90 seconds
      this.updateInterval = this.updateIntervalFunction();
    }
  }

  componentWillUnmount() {
    if (process.env.BROWSER) {
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
          <Card className="p-4" key="appointments">
            <CardBody>
              <Row className="justify-content-center text-center">
                <h1>Appointments</h1>
              </Row>
              <AppointmentsClientTable
                defaultPageSize={defaultPageSize}
                fetchData={this.fetchTableRecords}
                loading={this.state.loading}
                data={this.state.records}
                meta={this.state.recordsMeta}
              />
            </CardBody>
            <Row className="justify-content-center">
              <Col xs={12} md={6}>
                <Button
                  className="btn-success w-100"
                  onClick={() => history.push('/book')}
                >
                  Book Now
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default withStyles(s)(Appointments);
