import React from 'react';

export default class ButtonNormal extends React.Component {

  render() {
    const { color } = this.props;
    const extraClassNames = this.props.extra;
    const { onClick } = this.props;
    const { title } = this.props;

    let disabled = false;
    if (this.props.disabled !== undefined) {
      disabled = this.props.disabled;
    }

    let className = 'normal_button button_white';
    if (color === 'green') {
      className = 'normal_button button_green';
    } else if (color === 'red') {
      className = 'normal_button button_red';
    }
    className += ` ${extraClassNames}`;

    return (
      <button className={className} onClick={onClick} disabled={disabled}>
        {title}
      </button>
    );
  }
}
