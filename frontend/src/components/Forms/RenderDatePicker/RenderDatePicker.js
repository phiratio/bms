import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import { Button, Col, Row } from 'reactstrap';
import moment from 'moment';
import get from 'lodash.get';

class InputComponent extends React.Component {
  render() {
    return (
      <Button color="light" className="mt-1 w-100" onClick={this.props.onClick}>
        {this.props.value || this.props.labelText || '-'}
      </Button>
    );
  }
}

InputComponent.propTypes = {
  onClick: PropTypes.func,
  value: PropTypes.string,
};

export default class RenderDatePicker extends React.Component {
  render() {
    const {
      input,
      label,
      addLabel,
      dateRange,
      dateFormat,
      multiSelect,
      meta: { touched, error },
      ...custom
    } = this.props;

    let props = {};
    props = {
      ...props,
      ...{
        dateFormat: dateFormat || 'dd/MM/yyyy',
      },
    };
    props = { ...props, ...custom };
    const inputValue = input.value || [];

    if (multiSelect) {
      return (
        <React.Fragment>
          {inputValue.map((el, index) => {
            const from = el[0] ? moment.unix(el[0]).toDate() : null;
            const to = el[1] ? moment.unix(el[1]).toDate() : null;
            const clearValues = e => {
              e.preventDefault();
              const dateRanges = input.value;
              input.onChange(dateRanges.filter((el, i) => index !== i));
            };
            return (
              <Col
                key={index}
                xs={12}
                md={6}
                className="react-datepicker-multi text-center"
              >
                <DatePicker
                  {...input}
                  {...props}
                  selected={from}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  selectsStart
                  startDate={from}
                  endDate={to}
                  customInput={<InputComponent />}
                  autoOk
                  onChange={value => {
                    if (value !== null) {
                      const dates = input.value;
                      const stamp = value.getTime() / 1000;
                      let to = dates[index][1] ? dates[index][1] : stamp;
                      to = value > to ? stamp : to;
                      dates[index] = [stamp, to];
                      input.onChange(dates);
                    }
                  }}
                />
                <DatePicker
                  {...input}
                  {...props}
                  selected={to}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  selectsStart
                  selectsEnd
                  startDate={from}
                  endDate={to}
                  minDate={from}
                  customInput={<InputComponent />}
                  autoOk
                  onChange={value => {
                    if (value !== null) {
                      const dates = input.value;
                      const from = dates[index][0] ? dates[index][0] : value;
                      dates[index] = [from, value.getTime() / 1000];
                      input.onChange(dates);
                    }
                  }}
                />
                <div className="react-datepicker-wrapper mr-2">
                  <div className="react-datepicker__input-container">
                    {!this.props.clearLabelText ? (
                      <button
                        type="button"
                        className="mt-1 btn btn-danger"
                        onClick={clearValues}
                      >
                        X
                      </button>
                    ) : (
                      <a href="#" className="ml-2" onClick={clearValues}>
                        <span>{this.props.clearLabelText}</span>
                      </a>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
          <Col xs={12} className="text-center">
            {input.value.length === 0 ||
            (multiSelect &&
              get(input.value[input.value.length - 1], '[0]') &&
              get(input.value[input.value.length - 1], '[1]')) ? (
              <a
                href="#"
                className="mt-2 text-center"
                style={{ display: 'inherit' }}
                onClick={e => {
                  e.preventDefault();
                  input.onChange(
                    Array.isArray(input.value)
                      ? [...inputValue, []]
                      : [[...inputValue]],
                  );
                }}
              >
                {addLabel || 'Add'}
              </a>
            ) : null}
          </Col>
        </React.Fragment>
      );
    }

    if (dateRange) {
      const from = inputValue[0]
        ? moment(inputValue[0]).toDate()
        : moment().toDate();
      const to = inputValue[1]
        ? moment(inputValue[1]).toDate()
        : moment().toDate();

      return (
        <React.Fragment>
          <DatePicker
            {...input}
            {...props}
            selected={from}
            selectsStart
            startDate={from}
            endDate={to}
            customInput={<InputComponent />}
            autoOk
            onChange={value => {
              if (value !== null) {
                const to = input.value[1] ? input.value[1] : value;
                input.onChange([value, value > to ? value : to]);
              }
            }}
          />
          <DatePicker
            {...input}
            {...props}
            selected={to}
            selectsStart
            selectsEnd
            startDate={from}
            endDate={to}
            minDate={from}
            customInput={<InputComponent />}
            autoOk
            onChange={value => {
              if (value !== null) {
                const from = input.value[0] ? input.value[0] : value;
                input.onChange([from, value]);
              }
            }}
          />
        </React.Fragment>
      );
    }
    const from = input.value
      ? moment.unix(input.value).toDate()
      : moment().toDate();

    return (
      <React.Fragment>
        <DatePicker
          {...input}
          {...props}
          selected={from}
          customInput={<InputComponent />}
          autoOk
          onChange={value => {
            console.log('value', value);
            if (value !== null) {
              input.onChange(value.getTime() / 1000);
              if (this.props.onClick) this.props.onClick(value.getTime() / 1000);
            }
          }}
        />
      </React.Fragment>
    );
  }
}
