import React from 'react';
import {
  Col,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Row,
} from 'reactstrap';
import PropTypes from 'prop-types';
import shortId from 'shortid';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { change } from 'redux-form';
import s from './RenderField.css';
import Select from '../../Select';

class Field extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
  };

  render() {
    const {
      id,
      size,
      icon,
      input,
      type,
      inputMode,
      pattern,
      placeholder,
      title,
      description,
      className,
      autoFocus,
      validFeedback,
      switchType,
      disabled,
      prepandText,
      appendText,
      appendIcon,
      append,
      appendOnClick,
      onChange,
      field,
      noFloat,
      labelClassName,
      dataChecked,
      dataUnchecked,
      onClick,
      submitError,
      autoComplete,
      meta: { asyncValidating, touched, form },
    } = this.props;
    let error = this.props.meta.error;
    if (this.props.error) error = this.props.error;
    const errors = error && touched ? 'is-invalid' : '';
    const classes = `${errors} ${className}${validFeedback ? ' is-valid' : ''}`;
    const errorMessage =
      error && error.split(' || ')[0] ? error.split(' || ')[0] : error;
    let value;
    try {
      value = JSON.parse(error.split(' || ')[1]);
    } catch (e) {}

    if (type === 'checkbox') {
      return (
        <React.Fragment>
          {title && (
            <small>
              <b>{title}</b>
            </small>
          )}
          <label
            className={`${switchType || 'switch-success'} ${!noFloat &&
              'float-right'} mb-0 switch switch-label switch-sm switch-pill form-check-label`}
          >
            <input
              {...input}
              id={id}
              type={type}
              disabled={disabled}
              onClick={onChange}
              className={`${
                error ? 'is-invalid' : ''
              } switch-input form-check-input`}
            />
            <span
              onClick={onClick}
              className="switch-slider"
              data-checked={dataChecked || 'Yes'}
              data-unchecked={dataUnchecked || 'No'}
            />
          </label>
          {description && (
            <div>
              <small className="text-muted">{description}</small>
            </div>
          )}
          {error && (
            <small style={{ display: 'block' }} className="invalid-feedback">
              {this.context.translate(errorMessage, value)}
            </small>
          )}
        </React.Fragment>
      );
    }

    if (type === 'select') {
      const values = input.value || [];
      return (
        <React.Fragment>
          <Row>
            <Col xs={8}>
              {title && (
                <small>
                  <b>{title}</b>
                </small>
              )}
              {description && (
                <div>
                  <small className="text-muted">{description}</small>
                </div>
              )}
              {error && (
                <small className="d-block invalid-feedback">
                  {this.context.translate(errorMessage, value)}
                </small>
              )}
            </Col>
            <Col xs={4} className="pl-0 pr-0">
              <Select
                {...this.props}
                value={values}
                isSearchable
                placeholder={placeholder}
                isDisabled={disabled}
                className={`${
                  error ? 'is-invalid' : ''
                } basic-multi-select setting-dropdown mb-2`}
                onChange={selected => {
                  this.context.store.dispatch(
                    change(form, input.name, selected),
                  );
                }}
                instanceId={input.name}
                id={input.name}
              />
            </Col>
          </Row>
        </React.Fragment>
      );
    }

    if (type === 'textarea') {
      return (
        <React.Fragment>
          <textarea
            {...input}
            id={id}
            type={type}
            disabled={disabled}
            placeholder={this.context.translate(placeholder)}
            className={classes}
            autoFocus={autoFocus}
          />
          {error && (
            <small style={{ display: 'block' }} className="invalid-feedback">
              {this.context.translate(errorMessage, value)}
            </small>
          )}
        </React.Fragment>
      );
    }
    return (
      <InputGroup className={size}>
        {icon ? (
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <i className={icon} />
            </InputGroupText>
          </InputGroupAddon>
        ) : null}
        {prepandText ? (
          <InputGroupAddon addonType="prepend">
            <InputGroupText>{prepandText}</InputGroupText>
          </InputGroupAddon>
        ) : null}
        <input
          {...input}
          inputMode={inputMode}
          pattern={pattern}
          autoComplete={autoComplete}
          id={id}
          type={type}
          disabled={disabled}
          placeholder={this.context.translate(placeholder)}
          className={classes}
          autoFocus={autoFocus}
        />
        {append &&
          append.map(el => (
            <InputGroupAddon key={shortId.generate()} addonType="append">
              {el}
            </InputGroupAddon>
          ))}
        {appendText ? (
          <InputGroupAddon addonType="append">
            <InputGroupText onClick={appendOnClick}>
              {appendText}
            </InputGroupText>
          </InputGroupAddon>
        ) : null}
        {appendIcon ? (
          <InputGroupAddon addonType="append">
            <InputGroupText onClick={appendOnClick}>
              <i className={appendIcon} />
            </InputGroupText>
          </InputGroupAddon>
        ) : null}
        {validFeedback && (
          <div className={`${s.validFeedback} valid-feedback`}>
            {validFeedback}
          </div>
        )}
        {error && (
          <small className={`${s.invalidFeedback} invalid-feedback`}>
            {this.context.translate(errorMessage, value)}
          </small>
        )}
      </InputGroup>
    );
  }
}
const RenderField = withStyles(s)(Field);
export { RenderField };
