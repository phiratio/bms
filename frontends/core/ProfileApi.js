import { hideLoading, showLoading } from 'react-redux-loading-bar';
import BackendApi, { validate, validateFailure } from './BackendApi';

const backendApi = new BackendApi();

function ProfileApi() {
  this.context.store.dispatch(hideLoading());
  this.context.store.dispatch(showLoading());
  return {
    fetchProfile: () =>
      backendApi
        .get('/accounts/profile')
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    submitProfile: values =>
      backendApi
        .put('/accounts/profile', values)
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    submitAccount: values =>
      backendApi
        .put('/accounts/profile/changePassword', values)
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),
  };
}

export default ProfileApi;
