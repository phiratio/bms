import React from 'react';
import { Button, Col, FormGroup, Row } from 'reactstrap';
import { Field } from 'redux-form';
import { RenderField } from '../RenderField';

const renderServicesAndPrices = ({
  submitting,
  pristine,
  timeForService,
  fields,
  meta: { error, submitFailed },
}) => (
  <div>
    {fields.map((service, index) => (
      <Row key={index}>
        <Col xs={12} md={6}>
          <FormGroup>
            <Field
              size="mb-4"
              name={`${service}.name`}
              component={RenderField}
              type="text"
              className="form-control"
              placeholder="Name"
            />
          </FormGroup>
        </Col>
        <Col xs={12} md={3}>
          <Field
            size="mb-4"
            name={`${service}.price`}
            component={RenderField}
            type="text"
            prepandText="$"
            appendText="Walk-In"
            className="form-control"
            type="number"
            placeholder="Price"
          />
        </Col>
        <Col xs={12} md={3}>
          <Field
            size="mb-3"
            name={`${service}.priceAppt`}
            component={RenderField}
            type="text"
            className="form-control"
            prepandText="$"
            appendText="Appoint."
            type="number"
            placeholder="Appointment Price"
          />
        </Col>
        <Col xs={12} md={6}>
          <Field
            size="mb-3"
            name={`${service}.description`}
            component={RenderField}
            type="text"
            className="form-control"
            placeholder="Description"
          />
        </Col>
        <Col xs={12} md={6}>
          <Field
            isMulti={false}
            options={timeForService}
            name={`${service}.time`}
            component={RenderField}
            placeholder="Select time required for the service"
            type="select"
          />
        </Col>
        <Col xs={12}>
          <Field
            component={RenderField}
            name={`${service}.showInPos`}
            type="checkbox"
            title="Show in POS"
            description="Show in point of sale"
          />
        </Col>
        <Col xs={12}>
          <Field
            component={RenderField}
            name={`${service}.showInAppt`}
            type="checkbox"
            title="Show in Apoointments"
            description="Show this service in appointments"
          />
        </Col>
        <Col xs={12}>
          <Button
            className="px-4 mr-3 mt-3"
            disabled={submitting || pristine}
            onClick={() => fields.move(index, index - 1)}
          >
            <i className="icon-arrow-up" />
          </Button>
          <Button
            className="px-4 mr-3 mt-3"
            disabled={submitting || pristine}
            onClick={() => fields.move(index, index + 1)}
          >
            <i className="icon-arrow-down" />
          </Button>
          <Button
            color="danger"
            className="px-4 mt-3"
            disabled={submitting || pristine}
            onClick={() => fields.remove(index)}
          >
            <i className="icon-trash" />
          </Button>
        </Col>
        <Col xs={12}>
          <hr />
        </Col>
      </Row>
    ))}
    <Row>
      <Col xs={12}>
        <Button
          color="primary"
          className="px-4 mr-3"
          disabled={submitting || pristine}
        >
          Save
        </Button>
        <Button
          color="success"
          className="px-4"
          disabled={submitting || pristine}
          onClick={() => fields.push({})}
        >
          Add
        </Button>
      </Col>
    </Row>
  </div>
);

export { renderServicesAndPrices };
