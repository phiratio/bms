import React from 'react';
import PropTypes from 'prop-types';
import {Card, CardBody, Row, Col} from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import shortId from 'shortid';
import { setNotification } from '../../actions/notifications';
import BookingApi from '../../core/BookingApi';

class Contacts extends React.Component {
  state = {
    disabled: false,
    loading: true,
    contacts: {
      address: {},
      storeHours: {},
    },
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
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
        .fetchContacts()
        .then(data => {
            this.setState({
              loading: false,
              contacts: data,
            });
          }
        );
    }
  }

  render() {
    const contacts = this.state.contacts;
    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            <Row className="justify-content-center text-center">
              <h1>Contacts</h1>
            </Row>
            {!this.state.loading && (
              <Row>
                {
                  !_.isEmpty(contacts.address) && (
                    <Col xs={12} sm={6} className="mb-4">
                      <h4>Address</h4>
                      <a href={contacts.gMaps}>
                        { contacts.name } <br/>
                        { contacts.address.streetAddress } <br/>
                        { contacts.address.addressLocality } <br/>
                        { contacts.address.addressRegion } <br/>
                        { contacts.address.postalCode } <br/>
                      </a>
                    </Col>
                  )
                }
                {
                  !_.isEmpty(contacts.storeHours) && (
                    <Col xs={12} sm={6} className="mb-4">
                      <h4>Store Hours</h4>
                      {
                        contacts.storeHours.map(el => <div key={shortId.generate()}>{ el }</div>)
                      }
                    </Col>
                  )
                }
                {
                  contacts.phoneNumber && (
                    <Col xs={12} sm={6} className="mb-4">
                      <h4>Phone Number</h4>
                      <a href={`tel:${contacts.phoneNumber}`}>{ contacts.phoneNumber }</a>
                    </Col>
                  )
                }
                {
                  contacts.email && (
                    <Col xs={12} sm={6} className="mb-4">
                      <h4>Email</h4>
                      <a href={`mailto:${contacts.email}`}>{ contacts.email }</a>
                    </Col>
                  )
                }
                {
                  contacts.website && (
                    <Col xs={12} sm={6} className="mb-4">
                      <h4>Website</h4>
                      <a href={contacts.website}>{ contacts.website.split('://')[1] }</a>
                    </Col>
                  )
                }
              </Row>
            ) }
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}
export default Contacts;
