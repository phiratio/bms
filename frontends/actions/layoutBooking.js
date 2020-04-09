import { SET_LAYOUT_BOOKING, UNSET_LAYOUT_BOOKING } from '../constants';

export function setLayoutBooking(layout) {
  return {
    type: SET_LAYOUT_BOOKING,
    payload: layout,
  };
}
export function unsetLayoutBooking() {
  return {
    type: UNSET_LAYOUT_BOOKING,
  };
}
