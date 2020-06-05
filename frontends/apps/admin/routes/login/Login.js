import React from 'react';
import PropTypes from 'prop-types';
import {Card, CardBody, Button, Row, Col} from 'reactstrap';
import {
  SubmissionError,
  change,
  clearSubmitErrors, stopSubmit,
} from 'redux-form';
import { connect } from 'react-redux';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import decode from 'jwt-decode';
import cookies from 'browser-cookies';
import _ from 'lodash';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../../../history';
import LoginDemoForm from '../../../../components/Forms/LoginDemoForm';
import { setUser } from '../../../../actions/user';
import { setNotification } from '../../../../actions/notifications';
import AuthApi from '../../../../core/AuthApi';

const messages = defineMessages({
  'Sign Up': {
    id: 'Sign Up',
    defaultMessage: 'Sign Up',
  },
  'Create an Account': {
    id: 'Create an Account',
    defaultMessage: 'Create an Account',
  },
});

// Credentials is used for demo
const initialValuesAdmin = {
  identifier: "admin@demo.org",
  password: "demodemo",
};

const initialValuesEmployee = {
  identifier: "employee@demo.org",
  password: "demodemo",
};


class Login extends React.Component {
  state = {
    loading: true,
    disabled: false,
    // cacheToken: '',
    formNotifications: {},
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    focus: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
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

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.AuthApi = AuthApi.bind(this);
      this.setState({
        loading: false
      });
    }
  }

  componentWillUnmount() {
    this.context.store.dispatch(setNotification({}));
  }

  submit = values => {
    this.context.store.dispatch(clearSubmitErrors('login'));
    return this.AuthApi()
      .authLocal(values)
      .then(res => {
        this.context.store.dispatch(setNotification({}));
        if (!res.jwt) throw new Error('Token was not found in response');
        // decode jwt token
        const decoded = decode(res.jwt);
        this.setState({ disabled: !!decoded });
        if (decoded) {
          let isLocalhost = false;
          if (process.env.BROWSER && window.location.href.match(/^http:\/\/localhost/)) {
            isLocalhost = true;
          }

          cookies.set(window.App.tokenId, res.jwt, {
            secure: true,
            ...isLocalhost && { samesite: 'None', secure: false },
            expires: 3000,
          });
          // set decoded user information
          this.context.store.dispatch(setUser({ ...decoded, ...res.user }));
          return decoded;
        }
        throw new Error('Unhandled rejection: Login failed');
      })
      .then(() => {
        // redirect
        this.context.showNotification('Successfully logged in', 'success', 5000);
        history.push('/');
        return true;
      })
      .catch(e => {
        if (e instanceof TypeError) {
          return Promise.reject(
            new SubmissionError({
              form: e.message,
            }),
          );
        }
        this.context.store.dispatch(change('login', 'password', ''));
        this.context.focus('loginFormPassowrdInput');
        if (_.get(e, 'message.errors')) {
          return Promise.reject(new SubmissionError(e.message.errors));
        }
        return Promise.reject(
          new SubmissionError({
            form: 'Unexpected response from the server',
          }),
        );
      });
  };

  render() {
    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            {/* {this.state.cacheToken} */}
            {!this.state.loading && (
              <LoginDemoForm
                headerText="Sign in as Administrator"
                form="adminForm"
                initialValues={initialValuesAdmin}
                formNotifications={this.state.formNotifications}
                meta={this.props.meta}
                disabled={this.state.disabled}
                onSubmit={this.submit}
              />
            )}
          </CardBody>
        </Card>
        <Card className="ml-sm-4 p-4">
          <CardBody>
            {/* {this.state.cacheToken} */}
            {!this.state.loading && (
              <LoginDemoForm
                headerText="Sign in as Employee"
                form="employeeForm"
                initialValues={initialValuesEmployee}
                formNotifications={this.state.formNotifications}
                meta={this.props.meta}
                disabled={this.state.disabled}
                onSubmit={this.submit}
              />
            )}
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}

const mapState = state => ({
  meta: state.layoutBooking,
});

export default connect(mapState)(Login);
