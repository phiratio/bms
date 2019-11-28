export default class CurrencyFormatter {
  formatCurrency(currency) {
    if (currency === 0) {
      return '$0.00';
    }
    const number = currency.toString();
    let first = number.substr(0, number.length - 2);
    if (first.length < 1) {
      first = '0';
    }
    const last = number.substr(number.length - 2);
    return `$${first}.${last}`;
  }

  convertStringToFloat(currency) {
    const float = currency.substr(1, currency.length);
    return parseFloat(float);
  }

  convertToFloat(currency) {
    if (currency === null || currency === undefined) {
      return '';
    }
    if (currency === '0' || currency === '$0' || currency === '') {
      return `$${parseFloat(0.0).toFixed(2)}`;
    }
    let number = currency.toString();
    let negative = '';
    if (number.includes('-')) {
      negative = '-';
    }
    number = number.replace('-', '');
    number = number.replace('.', '');
    number = number.replace('$', '');
    number = number.replace(/\D/g, '');

    const first = number.substr(0, number.length - 2);
    let last = number.substr(number.length - 2);
    if (last.length == 1) {
      last = `0${last}`;
    }
    const float = `${first}.${last}`;
    return negative + parseFloat(float).toFixed(2);
  }

  convertToFloatDisplay(currency) {
    return `$${this.convertToFloat(currency)}`;
  }

  convertFromFloat(currency) {
    currency = currency.replace('$', '');
    currency = currency.replace(/\D/g, '');
    const parts = currency.toString().split('.');
    if (parts.length > 1) {
      return parts[0] + parts[1];
    }
    return parts[0];
  }
}
