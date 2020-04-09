import { SET_BREADCRUMBS } from '../constants';

export default function breadcrumbs(state = {}, action) {
  switch (action.type) {
    case SET_BREADCRUMBS: {
      return action.payload;
    }
    default:
      return state;
  }
}
