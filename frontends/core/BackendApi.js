import cookies from "browser-cookies";
import axios from "axios";
import {hideLoading} from "react-redux-loading-bar";
import get from 'lodash.get';
import {setNotification} from "../actions/notifications";
import {unsetUser} from "../actions/user";
import history from "../history";

export const Response = function(response) {
  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data || {},
  };
};

export default class BackendApi {

  constructor(token) {
    this.token = token;
  }

  get options() {
    if (process.env.BROWSER) {
      const API_BASE_URL = window.App.apiUrl;
      const token = this.token || cookies.get(window.App.tokenId);
      return {
        baseURL: API_BASE_URL,
        timeout: 13000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    }
    return {};
  }

  send(url, data, config, method) {
    return axios.create(this.options)[method](url, data, config)
      .then(response => new Response(response))
      .catch(e => {
        if (get(e, 'response.data')) {
          return Promise.reject(e.response.data);
        }
        return Promise.reject(e);
      });
  }

  post(url, data, config,) {
    return this.send(url, data, config, 'post')
  }

  put(url, data, config) {
    return this.send(url, data, config, 'put')
  }

  get(url, config) {
    return axios.create(this.options)
      .get(url, config)
      .then(response => new Response(response))
      .catch(e => {
        if (get(e, 'response.data')) {
          return Promise.reject(e.response.data);
        }
        return Promise.reject(e);
      });
  }
}

export const validate = async function(res) {
  this.context.store.dispatch(hideLoading());
  const result = res.data;
  if (res.status === 401) {
    if (res.data.errors) {
      this.context.store.dispatch(
        setNotification({ type: 'danger', msg: res.data.errors }),
      );
    }
    if (process.env.BROWSER) {
      this.context.store.dispatch(notifClear());
      this.context.store.dispatch(unsetUser());
      cookies.erase(window.App.tokenId);
      history.push('/login');
    }
  }

  // show notifications if it in response from server
  if (result.notifications) {
    const { flash } = res.data.notifications;
    if (flash) {
      // showNotification(el.msg, el.type)
      // show one notification
      if (flash.length > 1)
        flash.map(el => this.context.showNotification(el.msg, el.type));
      // show multiple notifications
      else this.context.showNotification(flash.msg, flash.type);
    }
  }

  // show errors
  if (result.message && result.error) {
    const response = {};

    if (res.status === 401) {
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
  if (res.status !== 200) {
    return Promise.reject({
      msg: 'Unknown response from the server',
      _error: 'Action Failed',
    }); // Return error if something unexpected happened
  }
  return result;
};

export const validateFailure = function(e) {
  this.context.store.dispatch(hideLoading());
  if (typeof e.message === 'string')
    this.context.showNotification(e.message, 'error');
  if (e instanceof SyntaxError) {
    this.context.showNotification(
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
};
