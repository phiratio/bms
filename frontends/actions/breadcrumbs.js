import { SET_BREADCRUMBS } from '../constants';
import { getBreadcrumbs } from '../core/utils';

export function setBreadcrumbs(route, params, payload) {
  const breadcrumbs = getBreadcrumbs(route, params, payload);
  return {
    type: SET_BREADCRUMBS,
    payload: breadcrumbs,
  };
}
