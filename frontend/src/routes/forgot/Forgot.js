import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody } from 'reactstrap';
import { SubmissionError } from 'redux-form';
import ForgotForm from '../../components/Forms/ForgotForm/ForgotForm';
import { validate } from '../../core/httpClient';
import withStyles from "isomorphic-style-loader/lib/withStyles";
import s from "./Forgot.css";

class Forgot extends React.Component {
  state = {
    formNotifications: {},
  };

  static contextTypes = {
    httpClient: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  submit = values =>
    this.context.httpClient
      .sendData(`/auth/forgot`, 'POST', values)
      .then(validate.bind(this))
      .catch(e => Promise.reject(new SubmissionError(e)));

  render() {
    return (
      <Card className="p-4 authForm">
        <CardBody>
          <ForgotForm
            notifications={this.state.formNotifications}
            onSubmit={this.submit}
          />
        </CardBody>
      </Card>
    );
  }
}

export default  withStyles(s)(Forgot);
