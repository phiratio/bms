import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row, FormGroup } from 'reactstrap';
import { Field, reduxForm, FieldArray } from 'redux-form';
import { renderServicesAndPrices } from '../RenderServicesAndPrices';

class ServicesAndPrices extends React.Component {
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
      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting || disabled}>
          <FieldArray
            submitting={submitting}
            pristine={pristine}
            name="servicesAndPrices"
            component={renderServicesAndPrices}
            timeForService={this.props.timeForService}
          />
          {error && (
            <Alert color="danger">{this.context.translate(error)}</Alert>
          )}
        </fieldset>
      </form>
    );
  }
}

export default reduxForm({
  form: 'servicesAndPrices',
  // touchOnChange: true,
  enableReinitialize: true,
})(ServicesAndPrices);
