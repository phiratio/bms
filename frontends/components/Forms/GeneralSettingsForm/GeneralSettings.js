import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import { Field, reduxForm, FormSection } from 'redux-form';
import _ from 'lodash';
import startCase from 'lodash.startcase';
import RenderTimePicker from '../RenderTimePicker';
import RenderDatePicker from '../RenderDatePicker';
import ToggleSettingText from '../../ToggleSettingText';

class GeneralSettings extends React.Component {
  static contextTypes = {
    intl: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };

  render() {
    const {
      error,
      handleSubmit,
      pristine,
      reset,
      submitting,
      invalid,
      initialValues,
      disabled,
    } = this.props;
    return (
      <React.Fragment>
        <h6 className="pl-3 pt-2">Store Working Hours</h6>
        <hr />
        <form onSubmit={handleSubmit}>
          <fieldset disabled={submitting || disabled}>
            {error && (
              <Alert color="danger">{this.context.translate(error)}</Alert>
            )}
            <FormSection name="workingHours">
              <Row>
                {[
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                  'sunday',
                ].map(el => (
                  <Col
                    key={el}
                    xs={12}
                    sm={4}
                    md={4}
                    lg={3}
                    className="react-datepicker-multi text-center"
                  >
                    <div className="label">{startCase(el)}</div>
                    <Field
                      name={el}
                      clearLabelText="Clear"
                      timeRange
                      clearable
                      component={RenderTimePicker}
                    />
                  </Col>
                ))}
              </Row>
            </FormSection>
            <h6 className="mt-3 pl-3">Closed dates</h6>
            <hr />
            <Row>
              <Field
                name="closedDates"
                dateRange
                multiSelect
                dateFormat="MMM d"
                component={RenderDatePicker}
              />
            </Row>
            <Row>
              <Col xs="6" className="mt-3">
                <Button color="primary" className="px-4" disabled={submitting}>
                  Save
                </Button>
              </Col>
            </Row>
          </fieldset>
        </form>
      </React.Fragment>
    );
  }
}
export default reduxForm({
  form: 'generalSettingsForm',
  // need to be set for `confirm password` field to work, otherwise if password != passwordConfirm error does not show
  touchOnChange: true,
  enableReinitialize: true,
})(GeneralSettings);
