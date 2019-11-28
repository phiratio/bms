import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import { Button } from 'reactstrap';
import moment from 'moment';
import get from 'lodash.get';
import classNames from 'classnames';

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

export default class RenderTimePicker extends React.Component {
  state = {
    from: null,
    to: null,
  };

  render() {
    const {
      input,
      label,
      timeRange,
      dateFormat,
      timeIntervals,
      meta: { touched, error },
      ...custom
    } = this.props;

    let props = {};
    props = {
      ...props,
      ...{
        showTimeSelect: true,
        showTimeSelectOnly: true,
        timeIntervals: timeIntervals || 10,
        dateFormat: dateFormat || 'h:mm aa',
      },
    };

    const defaultMinMax = this.props.defaultMinMax || [0, 85800];
    const defaultMin = get(defaultMinMax, '[0]') || null;
    const defaultMax = get(defaultMinMax, '[1]') || null;
    const value = input.value || [];

    props = { ...props, ...custom };

    if (timeRange) {
      return (
        value && (
          <React.Fragment>
            {value.map((el, index, arr) => {
              let startOfDayDate = moment()
                .startOf('day')
                .add(defaultMin, 'seconds')
                .toDate();

              const startSeconds = get(el, '[0]') || null;
              const endSeconds = get(el, '[1]') || null;
              const previousEndDate =
                Array.isArray(arr[index - 1]) && arr[index - 1][1]
                  ? arr[index - 1][1]
                  : null;
              const nextStartDate =
                Array.isArray(arr[index + 1]) && arr[index + 1][0]
                  ? arr[index + 1][0]
                  : null;

              let endOfDayDate = moment()
                .startOf('day')
                .add(defaultMax, 'seconds')
                .toDate();
              const startDate = startSeconds
                ? moment()
                    .startOf('day')
                    .add(startSeconds, 'seconds')
                    .toDate()
                : null;

              const secondStartDate = startSeconds
                ? moment()
                    .startOf('day')
                    .add(10, 'minutes')
                    .add(startSeconds, 'seconds')
                    .toDate()
                : null;

              if (previousEndDate) {
                startOfDayDate = moment()
                  .startOf('day')
                  .add(previousEndDate, 'seconds')
                  .add(10, 'minutes')
                  .toDate();
              }

              const endDate = endSeconds
                ? moment()
                    .startOf('day')
                    .add(endSeconds, 'seconds')
                    .toDate()
                : null;

              if (nextStartDate) {
                endOfDayDate = moment()
                  .startOf('day')
                  .subtract(10, 'minutes')
                  .add(nextStartDate, 'seconds')
                  .toDate();
              }

              const clearValues = e => {
                e.preventDefault();
                const timeRanges = input.value;
                input.onChange(timeRanges.filter((el, i) => index !== i));
              };

              return (
                <div>
                  <DatePicker
                    {...input}
                    {...props}
                    selected={startDate}
                    timeIntervals={10}
                    customInput={
                      <InputComponent labelText={this.props.labelText} />
                    }
                    autoOk
                    minTime={startOfDayDate}
                    maxTime={endSeconds ? endDate : endOfDayDate}
                    onChange={(value, e) => {
                      let seconds = null;
                      const timeRanges = input.value;
                      if (value !== null) {
                        const time = moment(value.getTime());
                        seconds = time.hour() * 60 * 60 + time.minutes() * 60;
                        timeRanges[index] = [seconds, endSeconds];
                      }
                      input.onChange(timeRanges);
                    }}
                  />
                  <DatePicker
                    {...input}
                    {...props}
                    selected={endDate}
                    timeIntervals={10}
                    minTime={secondStartDate || startOfDayDate}
                    maxTime={endOfDayDate}
                    customInput={
                      <InputComponent labelText={this.props.labelText} />
                    }
                    autoOk
                    onChange={value => {
                      let seconds = null;
                      const timeRanges = input.value;
                      if (value !== null) {
                        const time = moment(value.getTime());
                        seconds = time.hour() * 60 * 60 + time.minutes() * 60;
                        timeRanges[index] = [startSeconds, seconds];
                      }
                      input.onChange(timeRanges);
                    }}
                  />
                  {this.props.clearable && (
                    <div
                      className={classNames({
                        'react-datepicker-wrapper': true,
                        'd-block': this.props.clearLabelText,
                      })}
                    >
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
                  )}
                </div>
              );
            })}
            {input.value.length === 0 ||
            (this.props.multiSelect &&
              get(input.value[input.value.length - 1], '[0]') &&
              get(input.value[input.value.length - 1], '[1]') &&
              this.props.multiSelect &&
              get(input.value[input.value.length - 1], '[1]') !==
                get(defaultMinMax, '[1]')) ? (
              <a
                href="#"
                className="mt-2"
                style={{ display: 'inherit' }}
                onClick={e => {
                  e.preventDefault();
                  input.onChange(
                    Array.isArray(input.value) ? [...value, []] : [[...value]],
                  );
                }}
              >
                Add
              </a>
            ) : null}
          </React.Fragment>
        )
      );
    }
    const inputValue =
      moment()
        .startOf('day')
        .add(input.value, 'seconds')
        .toDate() || null;
    return (
      <DatePicker
        {...input}
        {...props}
        selected={inputValue}
        customInput={<InputComponent />}
        autoOk
        onChange={value => {
          const time = moment(value.getTime());
          const seconds = time.hour() * 60 * 60 + time.minutes() * 60;
          input.onChange(seconds);
        }}
      />
    );
  }
}
