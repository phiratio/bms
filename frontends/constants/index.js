/* eslint-disable import/prefer-default-export */

export const SET_RUNTIME_VARIABLE = 'SET_RUNTIME_VARIABLE';
export const SET_LOCALE_START = 'SET_LOCALE_START';
export const SET_LOCALE_SUCCESS = 'SET_LOCALE_SUCCESS';
export const SET_LOCALE_ERROR = 'SET_LOCALE_ERROR';

export const SET_USER = 'SET_USER';
export const UNSET_USER = 'UNSET_USER';

export const SET_LAYOUT_BOOKING = 'SET_LAYOUT_BOOKING';
export const UNSET_LAYOUT_BOOKING = 'UNSET_LAYOUT_BOOKING';

export const SET_NOTIFICATION = 'SET_NOTIFICATION';
export const CLEAR_NOTIFICATION_ON_FORM_CHANGE = '@@redux-form/CHANGE';
export const SET_BREADCRUMBS = 'SET_BREADCRUMBS';

/**
 * ^             # Anchor at start of string
 * (?!-)         # Assert that the first character isn't a -
 * (?!.*--)      # Assert that there are no -- present anywhere
 * [a-zA-Z -]+    # Match one or more allowed characters
 * (?<!-)        # Assert that the last one isn't a -
 * $             # Anchor at end of string
 */
export const REGEX_A_Z_SPACE_DASH = /^[a-zA-Z -]+$/;
export const REGEX_A_Z_0_9 = /^[A-Za-z0-9.]+$/;
export const REGEX_A_Z_0_9_EMPTY = /^\s*$|[A-Za-z0-9.]/;
export const REGEX_NO_DOUBLE_SPACE = /^.*\s{2,}.*$/;

export const WAITING_LIST_TYPE_WALK_IN = 1;
export const WAITING_LIST_TYPE_APPOINTMENT = 2;
export const WAITING_LIST_TYPE_RESERVED = 3;
export const WAITING_LIST_TYPE_UNAVAILABLE = 4;

export const WAITING_LIST_STATUS_NOT_CONFIRMED = 0;
export const WAITING_LIST_STATUS_CONFIRMED = 1;
export const WAITING_LIST_STATUS_CANCELED = 2;
export const OFFLINE_CACHE_NAME = 'webpack-offline:app-cache';
