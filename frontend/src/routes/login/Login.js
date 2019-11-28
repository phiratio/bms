import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody } from 'reactstrap';
import { SubmissionError, change } from 'redux-form';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import decode from 'jwt-decode';
import { defineMessages } from 'react-intl';
import cookies from 'browser-cookies';
import history from '../../history';
import LoginForm from '../../components/Forms/LoginForm/LoginForm';
import s from './Login.css';
import { setUser } from '../../actions/user';
import { setNotification } from '../../actions/notifications';
import { validate } from '../../core/httpClient';

const messages = defineMessages({
  'Sign Up': {
    id: 'Sign Up',
    defaultMessage: 'Sign Up',
  },
  'Register Now': {
    id: 'Register Now',
    defaultMessage: 'Register Now',
  },
});

class Login extends React.Component {
  state = {
    disabled: false,
    // cacheToken: '',
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
            <LoginForm disabled={this.state.disabled} onSubmit={this.submit} />
            {/*<div className="d-block d-lg-none d-sm-block">*/}
              {/*<p className={s.or}>or</p>*/}
              {/*<Button*/}
                {/*onClick={() => {*/}
                  {/*history.push('/signup');*/}
                {/*}}*/}
                {/*color="primary"*/}
                {/*className="px-4 w-100"*/}
                {/*disabled={this.state.disabled}*/}
              {/*>*/}
                {/*<FormattedMessage {...messages['Register Now']} />*/}
              {/*</Button>*/}
            {/*</div>*/}
          </CardBody>
        </Card>
        {/*<Card*/}
          {/*className="text-white bg-primary py-5 d-md-down-none"*/}
          {/*style={{ width: `${44}%` }}*/}
        {/*>*/}
          {/*<CardBody className="text-center">*/}
            {/*<div className={s.signUpPadding}>*/}
              {/*<h2>*/}
                {/*<FormattedMessage {...messages['Sign Up']} />*/}
              {/*</h2>*/}
              {/*<Button*/}
                {/*onClick={() => {*/}
                  {/*history.push('/signup');*/}
                {/*}}*/}
                {/*color="primary"*/}
                {/*className="mt-3"*/}
                {/*disabled={this.state.disabled}*/}
                {/*active*/}
              {/*>*/}
                {/*<FormattedMessage {...messages['Register Now']} />*/}
              {/*</Button>*/}
            {/*</div>*/}
          {/*</CardBody>*/}
        {/*</Card>*/}
      </React.Fragment>
    );
  }
}
export default withStyles(s)(Login);
