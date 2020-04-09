import {
  SET_NOTIFICATION,
  CLEAR_NOTIFICATION_ON_FORM_CHANGE,
} from '../constants';

export default function formNotifications(state = {}, action) {
  switch (action.type) {
    case SET_NOTIFICATION: {
      return action.payload;
    }
    // Clear notification store if redux-form/change action has been dispatched
    case CLEAR_NOTIFICATION_ON_FORM_CHANGE: {
      return {};
    }
    default:
      return state;
  }
}
