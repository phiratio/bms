import { hideLoading, showLoading } from 'react-redux-loading-bar';
import BackendApi, { validate, validateFailure } from './BackendApi';
import cookies from 'browser-cookies';
import jwt from 'jsonwebtoken';
const backendApi = new BackendApi();

function AuthApi() {
  this.context.store.dispatch(hideLoading());
  this.context.store.dispatch(showLoading());
  return {
    fetchMeta: () =>
      backendApi
        .get('/appointments/meta/')
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    fetchResetToken: (token) =>
      backendApi
        .get(`/auth/reset/${token}`)
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    getProfile: () =>
      backendApi
        .get('/accounts/profile/')
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    signUpLocal: (values) =>
      backendApi
        .post('/auth/local/register', values)
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    signUpFacebook: ({ accessToken, verificationCode, mobilePhone }) => {
      const query = new URLSearchParams({
        ...(accessToken && { access_token: accessToken }),
        ...(verificationCode && { verificationCode }),
        ...(mobilePhone && { mobilePhone }),
      });
      return backendApi
        .get(`/auth/facebook/callback?${query}`)
        .then((response) => validate.call(this, response));
      // .catch(e => validateFailure.call(this, e));
    },

    forgotPassword: (values) =>
      backendApi
        .post('/auth/forgot-password', values)
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    resetPassword: (values) =>
      backendApi
        .post('/auth/reset-password', values)
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    authLocal: ({ identifier, password }) =>
      backendApi
        .post('/auth/local/', { identifier, password })
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    sendSMS: ({ phoneNumber, recaptchaToken }) =>
      backendApi
        .post('/auth/local/sendSMS/', {
          mobilePhone: phoneNumber,
          recaptchaToken,
        })
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),

    isExists: ({ email }) =>
      backendApi
        .post('/auth/local/isExists', {
          email,
        })
        .then((response) => validate.call(this, response))
        .catch((e) => validateFailure.call(this, e)),
  };
}

const getToken = () => {
  try {
    return cookies.get('id_token') || localStorage.getItem('id_token');
  } catch (e) {
    console.error(
      'Unable to get token from cookies or local storage',
      e.message,
    );
  }
};

const getDecodedToken = () => {
  try {
    const userCookie = getToken();
    let decoded = {};
    if (userCookie) {
      decoded = jwt.decode(userCookie);
    }
    return decoded;
  } catch (e) {
    return {};
  }
};

export default AuthApi;

export { getToken, getDecodedToken };
