import React from 'react';

export default class RegisterLine extends React.Component {
  render() {
    const { extraLeft } = this.props;
    const { extraRight } = this.props;
    const { left } = this.props;
    const { right } = this.props;

    const leftClassName = `register_line_left ${extraLeft}`;
    const rightClassName = `register_line_right ${extraRight}`;

    return (
      <div className="register_line">
        <div className={leftClassName}>{left}</div>
        <div className={rightClassName}>{right}</div>
      </div>
    );
  }
}
