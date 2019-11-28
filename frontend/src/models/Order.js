import clover from 'remote-pay-cloud';
import CurrencyFormatter from '../utils/CurrencyFormatter';
import Item from './Item';

export default class Order {
  constructor(id) {
    this.cloverOrderId = '';
    this.date = new Date();
    this.discount = null;
    this.displayItems = [];
    this.formatter = new CurrencyFormatter();
    this.id = id;
    this.items = [];
    this.orderPayments = [];
    this.pendingPaymentId = null;
    this.refunds = [];
    this.status = 'OPEN';
    this.manualTransaction = false;
    this.taxRemoved = false;
    this.serviceChargePercentage = 4;
  }

  getId() {
    return this.id;
  }

  setPendingPaymentId(id) {
    this.pendingPaymentId = id;
  }

  getPendingPaymentId() {
    return this.pendingPaymentId;
  }

  getStatus() {
    return this.status;
  }

  setStatus(status) {
    this.status = status;
  }

  addItem(id, title, price, tippable, taxable) {
    const orderItem = this.getOrderItemById(id);
    const item = this.getItemById(id);
    if (item == null) {
      this.items.push(new Item(id, title, price, tippable, taxable));
    }
    if (orderItem == null) {
      const lineItem = new clover.sdk.order.DisplayLineItem();
      lineItem.setId(id);
      lineItem.setName(title);
      lineItem.setPrice(this.formatter.formatCurrency(price));
      lineItem.setQuantity(1);
      this.displayItems.push(lineItem);
    } else {
      orderItem.setQuantity(orderItem.quantity + 1);
    }
  }

  removeItem(id, title) {
    const orderItem = this.getOrderItemById(id);
    if (orderItem === null) return;
    if (orderItem.quantity === 1) {
      this.removeItemBy(orderItem.id);
    } else {
      orderItem.setQuantity(orderItem.quantity - 1);
    }
  }

  getItems() {
    return this.items;
  }

  getDisplayItems() {
    return this.displayItems;
  }

  getItemById(id) {
    let orderItem = null;
    this.items.filter(obj => {
      if (obj.id == id) {
        orderItem = obj;
      }
    });
    return orderItem;
  }

  removeItemBy(id) {
    this.displayItems = this.displayItems.filter(obj => obj.id !== id);
    // console.log('this.items.filter(obj => obj.id !== id);',this.items.filter(obj => obj.id !== id) );
    return;
  }

  getOrderItemById(id) {
    let orderItem = null;
    this.displayItems.filter(obj => {
      if (obj.id == id) {
        orderItem = obj;
      }
    });
    return orderItem;
  }

  getPaymentById(id) {
    let payment = null;
    this.payments.filter(obj => {
      if (obj.id == id) {
        payment = obj;
      }
    });
    return payment;
  }

  getTotal() {
    const total =
      parseFloat(this.getPreTaxSubTotal()) + parseFloat(this.getTaxAmount()) + parseFloat(this.getServiceChargeAmount());
    return parseFloat(total).toFixed(2);
  }

  getDate() {
    return this.date;
  }

  addOrderPayment(orderPayment) {
    this.orderPayments.push(orderPayment);
  }

  getOrderPayments() {
    return this.orderPayments;
  }

  getRefunds() {
    return this.refunds;
  }

  addRefund(refund) {
    this.refunds.push(refund);
  }

  addDiscount(discount) {
    this.discount = discount;
  }

  getDiscount() {
    return this.discount;
  }

  getTaxableSubtotal() {
    let sub = 0;
    this.displayItems.forEach(function(item) {
      const _item = this.getItemById(item.id);
      if (_item.getTaxable()) {
        sub = parseFloat(
          parseFloat(sub) +
            this.formatter.convertFromFloat(item.price) * item.quantity,
        );
      }
    }, this);
    if (this.discount != null) {
      sub = this.discount.appliedTo(sub);
    }
    return this.formatter.convertToFloat(sub);
  }

  getServiceChargeAmount = () => {
    return (
      (parseFloat(this.getPreTaxSubTotal()) / 100) *
      this.serviceChargePercentage
    ).toFixed(2);
  };

  getPreTaxSubTotal() {
    let sub = 0;
    this.displayItems.forEach(function(item) {
      sub = parseFloat(
        parseFloat(sub) +
          this.formatter.convertFromFloat(item.price) * item.quantity,
      );
    }, this);
    if (this.discount != null) {
      sub = this.discount.appliedTo(sub);
    }
    return this.formatter.convertToFloat(sub);
  }

  getTaxAmount() {
    let taxable = this.getTaxableSubtotal();
    taxable = taxable.replace('$', '');
    const taxAmount = parseFloat(taxable * 0.0452).toFixed(2);
    return taxAmount;
  }

  getTippableAmount() {
    let tippableAmount = 0;
    this.displayItems.forEach(function(item) {
      const _item = this.getItemById(item.id);
      if (_item.getTippable()) {
        tippableAmount = parseFloat(
          parseFloat(tippableAmount) +
            this.formatter.convertToFloat(_item.price) * item.quantity,
        );
      }
    }, this);
    if (this.discount != null) {
      tippableAmount = this.discount.appliedTo(tippableAmount);
    }
    return parseFloat(tippableAmount + parseFloat(this.getTaxAmount())).toFixed(
      2,
    ); // should match Total if there aren't any "non-tippable" items
  }

  getCloverOrderId() {
    return this.cloverOrderId;
  }

  setCloverOrderId(id) {
    this.cloverOrderId = id;
  }
}
