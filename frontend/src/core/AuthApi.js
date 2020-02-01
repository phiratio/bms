import { hideLoading, showLoading } from 'react-redux-loading-bar';
import BackendApi, { validate, validateFailure } from './BackendApi';

const backendApi = new BackendApi();

function AuthApi() {
  this.context.store.dispatch(hideLoading());
  this.context.store.dispatch(showLoading());
  return {
    sendSMS: ({ phoneNumber, recaptchaToken }) =>
      backendApi
        .post('/auth/local/sendSMS/', {
          mobilePhone: phoneNumber,
          recaptchaToken,
        })
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    isExists: ({ email }) =>
      backendApi
        .post('/auth/local/isExists', {
          email,
        })
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),
  };
}

export default AuthApi;
