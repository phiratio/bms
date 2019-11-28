import React from 'react';

export default class RegisterLineItem extends React.Component {
  render() {
    const { price } = this.props;
    const { quantity } = this.props;
    const { title } = this.props;

    return (
      <div className="space_between_row">
        <div>{quantity}</div>
        <div className="register_item_title">{title}</div>
        <div>{price}</div>
      </div>
    );
  }
}
