import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, Button} from 'reactstrap';
import { SubmissionError, change } from 'redux-form';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import decode from 'jwt-decode';
import cookies from 'browser-cookies';
import { FormattedMessage, defineMessages } from 'react-intl';
import history from '../../history';
import LoginForm from '../../components/Forms/LoginForm/LoginForm';
import s from './Login.css';
import { setUser } from '../../actions/user';
import { setNotification } from '../../actions/notifications';
import { validate } from '../../core/httpClient';
import BookingApi from "../book/BookingApi";

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

class Login extends React.Component {
  state = {
    loading: true,
    disabled: false,
    // cacheToken: '',
    meta: {},
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    focus: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
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
    this.BookingApi = BookingApi.bind(this);
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.BookingApi()
        .fetchMeta()
        .then(data =>
          this.setState({
            loading: false,
            meta: data,
          }),
        );
    }
  }

  componentWillUnmount() {
    this.context.store.dispatch(setNotification({}));
  }

  submit = values =>
    this.context.httpClient
      .sendData(`/auth/local`, 'POST', values)
      .then(validate.bind(this))
      .then(res => {
        this.context.store.dispatch(setNotification({}));
        if (!res.jwt) throw new Error('Token was not found in response');
        // decode jwt token
        const decoded = decode(res.jwt);
        this.setState({ disabled: !!decoded });
        if (decoded) {
          cookies.set(window.App.tokenId, res.jwt, { expires: 3000 });
          // set decoded user information
          this.context.store.dispatch(setUser(decoded));
          return decoded;
        }
        throw new Error('Unhandled rejection: Login failed');
      })
      .then(() => {
        // redirect
        history.push('/');
        return true;
      })
      .catch(e => {
        if (e instanceof TypeError) {
          this.context.showNotification(e.message, 'error');
        }
        this.context.store.dispatch(change('login', 'password', ''));
        this.context.focus('loginFormPassowrdInput');
        return Promise.reject(new SubmissionError(e));
      });

  render() {
    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            {/*{this.state.cacheToken}*/}
            { !this.state.loading && <LoginForm meta={this.state.meta} disabled={this.state.disabled} onSubmit={this.submit} /> }
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}
export default withStyles(s)(Login);
