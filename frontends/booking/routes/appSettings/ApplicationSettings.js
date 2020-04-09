import React from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardBody, Row } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import ReactHtmlParser from 'react-html-parser';
import { setNotification } from '../../../actions/notifications';
import BookingApi from '../../../core/BookingApi';
import { clearCacheStorage, uninstallServiceWorker } from '../../../core/utils';

class ApplicationSettings extends React.Component {
  state = {
    disabled: false,
    loading: true,
    terms: '',
  };

  static contextTypes = {
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.uninstallServiceWorker = uninstallServiceWorker.bind(this);
    this.clearCacheStorage = clearCacheStorage.bind(this);
  }

  update = () => {
    this.uninstallServiceWorker();
    this.clearCacheStorage();
  };

  render() {
    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            <Row className="justify-content-center text-center">
              <h1>Application Settings</h1>
            </Row>
            <Row>
              <div className="col-12 mb-3">
                Clear & Refresh
                <Button
                  color="link"
                  onClick={this.update}
                  className="float-right"
                >
                  Update
                </Button>
                <div>
                  <small className="text-muted">
                    Uninstalls Service Worker registered for this application
                    and clears Cache Storage of the application
                  </small>
                </div>
              </div>
              <div className="col-12">
                Version
                <span className="text-muted float-right p-3">
                  {process.env.BROWSER && window.App.version}
                </span>
                <div>
                  <small className="text-muted">
                    Version of currently running application
                  </small>
                </div>
              </div>
            </Row>
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}
export default ApplicationSettings;
