import { SET_USER, UNSET_USER } from '../constants';

export function setUser(user) {
  return {
    type: SET_USER,
    payload: user,
  };
}
export function unsetUser() {
  return {
    type: UNSET_USER,
  };
}
