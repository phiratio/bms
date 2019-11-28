import { hideLoading, showLoading } from 'react-redux-loading-bar';
import openSocket from 'socket.io-client';
import cookies from 'browser-cookies';
import { actions as notifActions } from 'redux-notification-center';
import history from '../../history';
import { setNotification } from '../../actions/notifications';
import createFetch from '../../createFetch';
import { unsetUser } from '../../actions/user';

const { notifClear } = notifActions;

class HttpClient {
  constructor(store, fetch, intl, showNotification) {
    this.store = store;
    this.fetch = fetch;
    this.intl = intl;
    this.showNotification = showNotification;
    this.history = history;
    if (process.env.BROWSER) {
      this.app = window.App;
    }
  }

  callApi = async (url, method = 'GET', body) => {
    this.store.dispatch(hideLoading());
    this.store.dispatch(showLoading());
    const token = cookies.get(window.App.tokenId);
    // if (!token) history.push('/logout');
    return new Promise((resolve, reject) => {
      let didTimeout = false;
      const timeout = setTimeout(() => {
        didTimeout = true;
        this.store.dispatch(hideLoading());
        reject(new Error('Request timed out'));
      }, 8000);
      return this.fetch(url, {
        method,
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
      })
        .then(response => {
          clearTimeout(timeout);
          if (!didTimeout) return resolve(response);
        })
        .catch(e => reject(e));
    }).catch(e => e);
  };

  uploadFile = async (url, body) => {
    this.store.dispatch(hideLoading());
    this.store.dispatch(showLoading());
    const token = cookies.get(window.App.tokenId);
    // if (!token) history.push('/logout');
    return new Promise((resolve, reject) => {
      let didTimeout = false;
      const timeout = setTimeout(() => {
        didTimeout = true;
        this.store.dispatch(hideLoading());
        reject(new Error('Request timed out'));
      }, 8000);
      return fetch(`${window.App.apiUrl}${url}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          Accept: '*/*',
        },
        body,
      })
        .then(response => {
          clearTimeout(timeout);
          if (!didTimeout) return resolve(response);
        })
        .catch(e => reject(e));
    }).catch(e => e);
  };

  getData = (url, method = 'GET', body = null) =>
    this.callApi(url, method, body);

  sendData = (url, method = 'POST', body) => this.callApi(url, method, body);

  openSocket = options => {
    const { host } = this.app.socket;
    return openSocket(`${host}`, options);
  };
  // translate = item => this.intl.formatMessage({ id: item, defaultMessage: item });
}

function validate(res) {
  const { store, showNotification } = this.context;
  if (!store) console.error('Store was not provided');
  if (!res) return;
  if (res instanceof TypeError) {
    return Promise.reject(res);
  }
  return res
    .json()
    .then(result => {
      const responseStatus = result.statusCode || res.status;
      store.dispatch(hideLoading());
      if (responseStatus === 401) {
        if (result.errors) {
          store.dispatch(
            setNotification({ type: 'danger', msg: result.errors }),
          );
        }
        if (process.env.BROWSER) {
          store.dispatch(notifClear());
          store.dispatch(unsetUser());
          cookies.erase(window.App.tokenId);
          history.push('/login');
        }
      }
      // show notifications if it in response from server
      if (result.notifications) {
        const { flash, form } = result.notifications;
        if (flash) {
          // showNotification(el.msg, el.type)
          // show one notification
          if (flash.length > 1)
            flash.map(el => showNotification(el.msg, el.type));
          // show multiple notifications
          else showNotification(flash.msg, flash.type);
        }
        if (form) {
          this.setState({ formNotifications: form });
        }
      }
      // show errors
      if (result.message && result.error) {
        const response = {};
        // if we have data that comes with errors
        // if (result.error && typeof result.message === 'string')
        // showNotification(result.message, 'error');
        if (responseStatus === 401) {
          response._error = `Provided username or password is incorrect`;
        }

        if (result.error && typeof result.message === 'object') {
          if (result.message.name)
            response._error = `${result.error}: ${result.message.name}`;

          if (Object.keys(result.message) === 0)
            response._error = `${result.statusCode} ${result.error}`;
        }

        if (result.message.errors) {
          Object.keys(result.message.errors).forEach(
            key => (response[key] = result.message.errors[key].msg),
          );
        }
        if (Object.keys(response).length > 0) return Promise.reject(response);
        return Promise.reject(result);
      }
      if (responseStatus != 200) {
        return Promise.reject({
          msg: 'Unknown response from the server',
          _error: 'Action Failed',
        }); // Return error if something unexpected happened
      }
      return Promise.resolve(result);
    })
    .catch(e => {
      store.dispatch(hideLoading());
      if (typeof e.message === 'string') showNotification(e.message, 'error');
      if (e instanceof SyntaxError) {
        showNotification(
          'Syntax error: Unexpected response from server',
          'error',
        );
        // Disable every action
        this.setState({ disabled: true });
        // Enable actions after period of time
        setTimeout(() => {
          this.setState({ disabled: false });
        }, 8000);
        return false;
      }
      return Promise.reject(e);
    });
  // .finally(() => this.store.dispatch(hideLoading()));
}

export { validate };
export default HttpClient;
