import React from 'react';
import CurrencyFormatter from '../../utils/CurrencyFormatter';

export default class AvailableDiscount extends React.Component {
  constructor(props) {
    super(props);
    this.discount = this.props.discount;
    this.formatter = new CurrencyFormatter();
  }

  render() {
    const { name } = this.discount;
    const { onClick } = this.props;

    return (
      <div
        className="available_item"
        onClick={() => {
          onClick(this.discount);
        }}
      >
        <div className="item_title">
          <span>{name}</span>
        </div>
        <div className="discount_bottom" />
      </div>
    );
  }
}
