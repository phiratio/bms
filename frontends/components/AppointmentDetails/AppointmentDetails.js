import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Modal,
  ModalHeader,
  ModalFooter,
} from 'reactstrap';
import _ from 'lodash';
import ReloadButton from '../ReloadButton';
import history from '../../history';
import s from './AppointmentDetails.css';
import BookingApi from '../../core/BookingApi';
import AppointmentDetailsForm from '../Forms/AppointmentDetailsForm';
import { WAITING_LIST_STATUS_CANCELED } from '../../constants';

class AppointmentDetails extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  state = {
    cancelAppointmentModal: false,
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.BookinApi = BookingApi.bind(this);
      if (!this.props.id) history.push('/appointments');
      this.BookinApi()
        .fetchAppointment(this.props.id)
        .then(data => {
          this.setState({ initialValues: data });
          return true;
        });
    }
  }

  toggleCancelAppointmentModal = () => {
    this.setState({
      cancelAppointmentModal: !this.state.cancelAppointmentModal,
    });
  };

  cancelAppointment = id =>
    this.BookinApi()
      .cancelAppointment(id)
      .then(() => history.push('/appointments'))
      .catch(e => {
        const notification = _.get(e, 'message.notifications.flash.msg');
        if (notification) {
          this.context.showNotification(notification, 'error');
        }
        this.toggleCancelAppointmentModal();
      });

  render() {
    if (!this.state.initialValues) {
      return <ReloadButton />;
    }

    return (
      <Row>
        <Col>
          <Card className="p-4">
            <Modal
              className="modal-danger"
              isOpen={this.state.cancelAppointmentModal}
              toggle={this.toggleCancelAppointmentModal}
            >
              <ModalHeader>
                Are you sure you want to cancel this appointment ?
              </ModalHeader>
              <ModalFooter>
                <Button
                  color="secondary"
                  onClick={() => this.toggleCancelAppointmentModal()}
                >
                  No
                </Button>
                <Button
                  color="danger"
                  onClick={() => this.cancelAppointment(this.props.id)}
                  disabled={this.state.disabled}
                >
                  Yes
                </Button>
              </ModalFooter>
            </Modal>
            <CardBody>
              <Row className="justify-content-center text-center">
                <h1>Appointment</h1>
              </Row>
              <AppointmentDetailsForm
                initialValues={this.state.initialValues}
              />
              {!_.get(this.state, 'initialValues.check') &&
                _.get(this.state, 'initialValues.status') !==
                  WAITING_LIST_STATUS_CANCELED && (
                  <Row className="mt-4 justify-content-center">
                    <Col xs={12} md={6}>
                      <Button
                        className="btn-danger w-100"
                        onClick={() => this.toggleCancelAppointmentModal()}
                      >
                        Cancel
                      </Button>
                    </Col>
                  </Row>
                )}
              <Row className="mt-4 justify-content-center">
                <Col xs={12} md={6}>
                  <Button
                    className="btn-light w-100"
                    onClick={() => history.push('/appointments')}
                  >
                    Go Back
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default withStyles(s)(AppointmentDetails);
