import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Col, Row } from 'reactstrap';
import {Field, formValueSelector, getFormSubmitErrors, reduxForm} from 'redux-form';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../../history';
import { RenderField } from '../RenderField';
import { emailValidator } from '../../../core/formValidators';
import SendSMSButton from '../../SendSMSButton';
import {normalizePhone} from "../../../core/utils";
import _ from "lodash";
import {connect} from "react-redux";
import get from "lodash.get";


const messages = defineMessages({
  'Please enter verification code': {
    id: 'Please enter verification code',
    defaultMessage: 'Please enter verification code',
  },
  'Submit': {
    id: 'Submit',
    defaultMessage: 'Submit',
  },
  'Send code': {
    id: 'Send code',
    defaultMessage: 'Send code',
  },
  'Back to login': {
    id: 'Back to login',
    defaultMessage: 'Back to login',
  },
  'Please enter your mobile phone number': {
    id: 'Please enter your mobile phone number',
    defaultMessage: 'Please enter your mobile phone number',
  },
  'Mobile phone verification required': {
    id: 'Mobile phone verification required',
    defaultMessage: 'Mobile phone verification required',
  }
});

class VerifyMobilePhoneForm extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };

  componentDidMount() {

  }

  render() {
    const {
      error,
      handleSubmit,
      pristine,
      reset,
      submitting,
      invalid,
      notifications,
      disabled,
      submitErrors,
      meta,
    } = this.props;

    const mobilePhoneVerification = _.get(this.props, 'meta.mobilePhoneVerification');

    return (
      <form onSubmit={handleSubmit}>
        <Row className="mt-2 justify-content-center">
          <h1 className="text-center">
            <FormattedMessage {...messages['Mobile phone verification required']} />
          </h1>
        </Row>
        <Row className="mb-2 justify-content-center">
          <p className="text-muted text-center">
            {this.props.showVerificationCodeInput ? (
              <FormattedMessage
                {...messages[
                  'Please enter verification code'
                  ]}
              />
            ) : (
              <FormattedMessage
                {...messages[
                  'Please enter your mobile phone number'
                  ]}
              />
            )}
          </p>
        </Row>
        {_.get(submitErrors, 'form') && (
          <Alert color="danger">
            {this.context.translate(submitErrors.form)}
          </Alert>
        )}
        {
          !this.props.loading && (
            <>
              {
                !this.props.showVerificationCodeInput && (
                  <>
                    <Field
                      size="mb-4"
                      type="text"
                      inputMode="numeric"
                      pattern="\+[0-9 ]*"
                      icon="icon-phone"
                      name="mobilePhone"
                      onChange={e => {
                        this.props.change(
                          'mobilePhone',
                          normalizePhone(e.target.value),
                        );
                        e.preventDefault();
                      }}
                      component={RenderField}
                      className="form-control"
                      placeholder="Mobile Phone"
                      autoComplete="new-password"
                    />
                    {
                      mobilePhoneVerification && !this.props.loading && (
                        <SendSMSButton
                          id="submitForm"
                          submit={this.props.sendSMS}
                          phoneNumber={this.props.mobilePhone}
                        />
                      )
                    }
                  </>
                )
              }
              {this.props.showVerificationCodeInput && (
                <Field
                  size="mb-4"
                  icon="icon-lock"
                  name="verificationCode"
                  component={RenderField}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-control"
                  autoComplete="new-password"
                  placeholder="Verification Code"
                />
              )}
              <Row className="mt-2 justify-content-center">
                <Col xs={12} md={6}>
                  {this.props.showVerificationCodeInput && (
                    <Button
                      className="pt-2 w-100"
                      tabIndex={-1}
                      disabled={submitting || disabled}
                      color="success"
                    >
                      <FormattedMessage {...messages['Submit']} />
                    </Button>
                  )}
                  {!this.props.showVerificationCodeInput && (
                    <Button
                      id="submitForm"
                      color="success"
                      className="px-0 w-100"
                      disabled={submitting || invalid}
                    >
                      <FormattedMessage {...messages['Send code']} />
                    </Button>
                  )}
                </Col>
              </Row>
            </>
          )
        }
        <Row className="mt-2 justify-content-center">
          <Col xs={12} md={6}>
            <Button
              onClick={() => {
                history.push('/login');
              }}
              color="link"
              className="px-0 w-100"
              disabled={submitting}
            >
              <FormattedMessage {...messages['Back to login']} />
            </Button>
          </Col>
        </Row>
      </form>
    );
  }
}
const FORM_NAME = 'verifyMobilePhone';

let verifyMobilePhoneForm = reduxForm({
  form: FORM_NAME,
  touchOnChange: true,
})(VerifyMobilePhoneForm);

const selector = formValueSelector(FORM_NAME);

verifyMobilePhoneForm = connect(state => {
  if (get(state, `form.${FORM_NAME}`)) {
    const mobilePhone = selector(state, 'mobilePhone');

    return {
      submitErrors: getFormSubmitErrors(FORM_NAME)(state),
      mobilePhone
    };
  }
  return {};
})(verifyMobilePhoneForm);

export default verifyMobilePhoneForm;
