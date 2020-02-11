import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody } from 'reactstrap';
import { SubmissionError } from 'redux-form';
import { connect } from 'react-redux';
import ForgotForm from '../../components/Forms/ForgotForm/ForgotForm';
import AuthApi from '../../core/AuthApi';
import history from "../../history";
import _ from "lodash";

class Forgot extends React.Component {
  state = {
    formNotifications: {},
  };

  static contextTypes = {
    httpClient: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props){
    super(props);
    this.AuthApi = AuthApi.bind(this);
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.setState({
        loading: false,
      });
    }
  }

  submit = values =>
    this.AuthApi()
      .forgotPassword(values)
      .then(() => {
        history.push('/login');
        return true;
      }).catch(e => {
      if (e instanceof TypeError) {
        return Promise.reject(
          new SubmissionError({
            form: e.message,
          }),
        );
      }
      if (_.get(e, 'message.errors')) {
        const { errors } = e.message;
        const mappedErrors = Object.keys(errors).reduce((acc, curr) => {
          acc[curr] = errors[curr].msg;
          return acc;
        }, {});

        return Promise.reject(new SubmissionError(mappedErrors));
      }
      return Promise.reject(
        new SubmissionError({
          form: 'Unexpected response from the server',
        }),
      );
    });

  render() {
    return (
      <Card className="p-4 authForm">
        <CardBody>
          <ForgotForm
            meta={this.props.meta}
            disabled={this.state.disabled}
            notifications={this.state.formNotifications}
            onSubmit={this.submit}
          />
        </CardBody>
      </Card>
    );
  }
}

const mapState = state => ({
  meta: state.layoutBooking,
});

export default connect(mapState)(Forgot);
