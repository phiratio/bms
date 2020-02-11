import { hideLoading, showLoading } from 'react-redux-loading-bar';
import BackendApi, { validate, validateFailure } from './BackendApi';

const backendApi = new BackendApi();

function AuthApi() {
  this.context.store.dispatch(hideLoading());
  this.context.store.dispatch(showLoading());
  return {
    fetchMeta: () =>
      backendApi
        .get('/appointments/meta/')
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    fetchResetToken: token =>
      backendApi
        .get(`/auth/reset/${token}`)
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    getProfile: () =>
      backendApi
        .get('/accounts/profile/')
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    signUpLocal: values =>
      backendApi
        .post('/auth/local/register', values)
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    signUpFacebook: accessToken =>
      backendApi
        .get(`/auth/facebook/callback?access_token=${accessToken}`)
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    forgotPassword: values =>
      backendApi
        .post('/auth/forgot-password', values)
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    resetPassword: values =>
      backendApi
        .post('/auth/reset-password', values)
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    authLocal: ({ identifier, password }) =>
      backendApi
        .post('/auth/local/', { identifier, password })
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

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
