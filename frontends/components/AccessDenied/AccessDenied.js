import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { FormattedMessage, defineMessages } from 'react-intl';
import s from './AccessDenied.css';

const messages = defineMessages({
  accessDeniedText: {
    id: 'Access denied',
    defaultMessage: 'Access denied',
  },
});

class AccessDenied extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
  };

  render() {
    return (
      <div className={s.root}>
        <div className={s.container}>
          <h1>{this.props.title}</h1>
          <p>
            <FormattedMessage {...messages.accessDeniedText} />
          </p>
        </div>
      </div>
    );
  }
}

export default withStyles(s)(AccessDenied);
