import React from 'react';
import { DayPickerSingleDateController } from 'react-dates';
import s from './DatePicker.css';
import withStyles from "isomorphic-style-loader/lib/withStyles";

export default  withStyles(s)(props => (
  <DayPickerSingleDateController
    { ...props }
  />
));
