import React from 'react';
import history from '../../../../history';
import PropTypes from 'prop-types';

class Logout extends React.Component {
  static contextTypes = {
    showNotification: PropTypes.func.isRequired,
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.context.showNotification('Successfully logged out', 'success', 5000);
      history.push('/login');
    }
  }

  render() {
    return null;
  }
}
export default Logout;
