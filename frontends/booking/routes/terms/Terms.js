import React from 'react';
import PropTypes from 'prop-types';
import {Card, CardBody, Row} from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { setNotification } from '../../../actions/notifications';
import BookingApi from '../../../core/BookingApi';
import ReactHtmlParser from 'react-html-parser';


class Terms extends React.Component {
  state = {
    disabled: false,
    loading: true,
    terms: '',
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    focus: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  componentWillUnmount() {
    this.context.store.dispatch(setNotification({}));
  }

  componentDidMount() {
    if (process.env.BROWSER) {
      this.BookingApi = BookingApi.bind(this);

      this.BookingApi()
        .fetchTerms()
        .then(data => {
            if (data.text) {
              this.setState({
                loading: false,
                terms: data.text,
              });
            }
          }
        );
    }
  }

  render() {
    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            <Row className="justify-content-center text-center">
              <h1>Terms of Service</h1>
            </Row>
            {!this.state.loading && this.state.terms && ReactHtmlParser(this.state.terms) }
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}
export default Terms;
