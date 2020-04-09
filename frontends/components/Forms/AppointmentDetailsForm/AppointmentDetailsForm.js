import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  change,
  Field,
  formValueSelector,
  getFormSubmitErrors,
  reduxForm,
} from 'redux-form';
import get from 'lodash.get';
import { Row, Col } from 'reactstrap';
import _ from 'lodash';
import moment from 'moment';
import shortId from 'shortid';
import ReloadButton from '../../ReloadButton';
import history from '../../../history';
import { RenderField } from '../RenderField';
import { RenderTimeBlocks, RenderServicesField } from '../BookingForm';
import Avatar from '../../Avatar';
import {WAITING_LIST_STATUS_CANCELED} from "../../../constants";

function RenderSelectedServicesField({ input }) {
  return (
    <React.Fragment>
      {input.value.map(el => (
        <Row key={shortId.generate()}>
          <Col xs={12} className="d-table pl-0 pr-0">
            <div className="card card-body d-table-cell align-middle w-100 booking-service">
              <h5>{el.name}</h5>
              <span className="text-muted">{el.time.name}</span>
              <div className="booking-service-price">${el.priceAppt / 100}</div>
            </div>
          </Col>
        </Row>
      ))}
    </React.Fragment>
  );
}

function RenderSelectedEmployee({ input }) {
  const employees = input.value;
  return employees.map(employee => (
    <React.Fragment key={employee.username}>
      <Row>
        <Col xs={12} className="d-table pl-0 pr-0">
          <div className="card card-body d-table-cell align-middle w-100 employee-select">
            <React.Fragment>
              <Avatar
                className="d-inline"
                color="#4285f4"
                size={50}
                src={employee.avatar}
                name={employee.username}
              />
              <div className="ml-3 d-inline">{employee.username}</div>
            </React.Fragment>
            {/* <div className="employee-select-action"> */}
            {/*  <i className="icon-arrow-down"></i> */}
            {/* </div> */}
          </div>
        </Col>
      </Row>
    </React.Fragment>
  ));
}

const WAITING_LIST_STATUS = {
  0: <span className="badge badge-warning font-xl">Not Confirmed</span>,
  1: <span className="badge badge-success font-xl">Confirmed</span>,
  2: <span className="badge badge-danger font-xl">Canceled</span>,
  3: <span className="badge badge-success font-xl">Finished</span>,
  4: <span />,
};

class AppointmentDetailsForm extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.RenderSelectedEmployee = RenderSelectedEmployee.bind(this);
    this.RenderServicesField = RenderServicesField.bind(this);
    this.RenderTimeBlocks = RenderTimeBlocks.bind(this);
    this.RenderSelectedServicesField = RenderSelectedServicesField.bind(this);
  }

  priceToText = price => `$${price / 100}`;

  get totalApptPrice() {
    return (
      Array.isArray(this.props.services) &&
      this.props.services.reduce((acc, curr) => curr.priceAppt + acc, 0)
    );
  }

  status = () => {
    let status = WAITING_LIST_STATUS[4];
    if (this.props.initialValues.status === WAITING_LIST_STATUS_CANCELED) {
      status = WAITING_LIST_STATUS[2];
    } else if (this.props.initialValues.check) {
      status = WAITING_LIST_STATUS[3];
    } else if (this.props.initialValues.status !== null) {
      status = WAITING_LIST_STATUS[this.props.initialValues.status];
    }
    return status;
  };

  render() {
    if (!this.props.initialValues) {
      return <ReloadButton />;
    }

    return (
      <form>
        <Row className="mb-2 justify-content-center">
          <Col xs={12}>
            <Row className="mb-2">
              <h6 className="text-muted">Services</h6>
            </Row>
            <Field
              name="services"
              component={this.RenderSelectedServicesField}
            />
            <Row className="mb-2 mt-3">
              <h6 className="text-muted">Barber</h6>
            </Row>
            <Field
              name="selectedEmployee"
              component={this.RenderSelectedEmployee}
            />
          </Col>
        </Row>
        <Row className="mb-2 mt-3">
          <h6 className="text-muted">Date & Time </h6>
        </Row>
        <Row>
          <Col xs={12} className="d-table pl-0 pr-0">
            <div className="date-card card card-body d-table-cell align-middle w-100 employee-select">
              <React.Fragment>
                <i className="icon-calendar" />
                <h5 className="date-text">
                  <b>
                    {moment.unix(this.props.time).format('dddd, MMMM Do, YYYY')}
                  </b>
                </h5>
                <h5 className="date-text mb-0">
                  at {moment.unix(this.props.time).format('hh:mm a')}
                </h5>
              </React.Fragment>
            </div>
          </Col>
        </Row>
        <Row className="mb-2 mt-3">
          <h6 className="text-muted">Status</h6>
        </Row>
        <Row>
          <Col xs={12} className="d-table pl-0 pr-0">
            <div className="card card-body d-table-cell align-middle w-100 booking-service">
              { this.status() }
            </div>
          </Col>
        </Row>
        {this.props.note && (
          <React.Fragment>
            <Row className="mb-2 mt-3">
              <h6 className="text-muted">Note </h6>
            </Row>
            <Row>
              <Col className="d-table pl-0 pr-0" xs={12}>
                <div className="date-card card card-body d-table-cell align-middle w-100 pr-0 pl-0 employee-select">
                  <Field
                    size="mb-4"
                    name="note"
                    disabled
                    component={RenderField}
                    type="text"
                    className="form-control"
                    placeholder="Note"
                  />
                </div>
              </Col>
            </Row>
          </React.Fragment>
        )}
        <Row className="mb-2 mt-3">
          <h6 className="text-muted">Rules & restrictions</h6>
        </Row>
        <Row>
          <Col xs={12} className="d-table pl-0 pr-0">
            <div className="card card-body d-table-cell align-middle w-100 booking-service">
              <h5>Cancellation policy</h5>
              <span className="text-muted">
                If you made a booking and cannot attend, please cancel your
                booking in advance
              </span>
            </div>
          </Col>
        </Row>
        <Row className="mb-2 mt-3">
          <h6 className="text-muted">Pricing Info</h6>
        </Row>
        <Row>
          <Col xs={12} className="d-table pl-0 pr-0">
            <div className="card card-body d-table-cell align-middle w-100 booking-service">
              <h5>{this.priceToText(this.totalApptPrice)}</h5>
              <span className="text-muted">Pay in person</span>
            </div>
          </Col>
        </Row>
      </form>
    );
  }
}

const FORM_NAME = 'apptDetails';

let apptDetailsForm = reduxForm({
  form: FORM_NAME,
  enableReinitialize: true,
  touchOnChange: true,
})(AppointmentDetailsForm);

const selector = formValueSelector(FORM_NAME);

apptDetailsForm = connect(state => {
  if (get(state, `form.${FORM_NAME}`)) {
    const { note, time, services, employees, selectedEmployee } = selector(
      state,
      'time',
      'services',
      'employees',
      'note',
      'selectedEmployee',
    );

    return {
      submitErrors: getFormSubmitErrors(FORM_NAME)(state),
      employees,
      time,
      note,
      selectedEmployee,
      services,
    };
  }
  return {};
})(apptDetailsForm);

export default apptDetailsForm;
