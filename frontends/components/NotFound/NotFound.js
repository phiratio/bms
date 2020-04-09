import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { FormattedMessage, defineMessages } from 'react-intl';
import { Col, Row } from 'reactstrap';
import s from './NotFound.css';
import history from '../../history';

const messages = defineMessages({
  pageNotFoundText: {
    id: 'Sorry, the page you were trying to view does not exist',
    defaultMessage: 'Sorry, the page you were trying to view does not exist',
  },
});

class NotFound extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
  };

  render() {
    return (
      <React.Fragment>
        <h1>{this.props.title}</h1>
        <p>
          <FormattedMessage {...messages.pageNotFoundText} />
        </p>
        <Row>
          {!this.props.doNotShowBackButton && (
            <Col xs={12} className="text-center mt-2">
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  history.push('/');
                }}
              >
                Go back
              </a>
            </Col>
          )}
        </Row>
      </React.Fragment>
    );
  }
}

export default withStyles(s)(NotFound);
