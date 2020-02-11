import { hideLoading, showLoading } from 'react-redux-loading-bar';
import BackendApi, { validate, validateFailure } from './BackendApi';

const backendApi = new BackendApi();

function BookingApi() {
  this.context.store.dispatch(hideLoading());
  this.context.store.dispatch(showLoading());
  return {
    fetchContacts: () =>
      backendApi
        .get('/appointments/contacts/')
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),
    fetchTerms: () =>
      backendApi
        .get('/appointments/terms/')
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    fetchMeta: () =>
      backendApi
        .get('/appointments/meta/')
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    fetchServices: () =>
      backendApi
        .get('/appointments/services/?' + new Date().getTime())
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e)),

    fetchSchedule: (employee, selectedServices) => {
      const selectedServicesIds = selectedServices.map(el => el.id);
      const employeeId = employee.id;
      return backendApi
        .get(`/appointments/schedule/${employeeId}`, {
          params: {
            ...(selectedServicesIds.length > 0 && {
              services: selectedServicesIds,
            }),
          },
        })
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e));
    },

    fetchEmployees: selectedServices => {
      const selectedServicesIds = selectedServices.map(el => el.id);
      return backendApi
        .get('/appointments/employees/', {
          params: {
            ...(selectedServicesIds.length > 0 && {
              services: selectedServicesIds,
            }),
          },
        })
        .then(response => validate.call(this, response))
        .catch(e => validateFailure.call(this, e));
    },
  };
}

export default BookingApi;
