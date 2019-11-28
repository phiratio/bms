import { SET_NOTIFICATION } from '../constants';

export function setNotification(msg) {
  return {
    type: SET_NOTIFICATION,
    payload: msg,
  };
}
