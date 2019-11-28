import React from 'react';
import CurrencyFormatter from '../../utils/CurrencyFormatter';

export default class AvailableItem extends React.Component {
  constructor(props) {
    super(props);
    this.formatter = new CurrencyFormatter();
    this.item = this.props.item;
  }

  render() {
    const { id } = this.item;
    const { title } = this.item;
    const itemPrice = this.formatter.formatCurrency(this.item.itemPrice);
    const { tippable } = this.item;
    const { taxable } = this.item;
    const { onClick } = this.props;
    return (
      <div
        className="available_item"
        onClick={() => {
          onClick(id, title, this.item.itemPrice, tippable, taxable);
        }}
      >
        <div className="item_title">
          <span>{title}</span>
        </div>
        <div className="item_price">{itemPrice}</div>
      </div>
    );
  }
}
