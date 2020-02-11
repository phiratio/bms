import { SET_LAYOUT_BOOKING, UNSET_LAYOUT_BOOKING } from '../constants';

export default function layoutBooking(state = {}, action) {
  switch (action.type) {
    case SET_LAYOUT_BOOKING: {
      return action.payload;
    }
    case UNSET_LAYOUT_BOOKING: {
      return null;
    }
    default:
      return state;
  }
}
