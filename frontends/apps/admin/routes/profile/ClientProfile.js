import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  Row,
  Col,
  Card,
  CardBody,
} from 'reactstrap';
import { SubmissionError, reset } from 'redux-form';
import Avatar from '../../../../components/Avatar';
import ReloadButton from '../../components/ReloadButton';
import history from '../../../../history';
import s from './Profile.css';
import AccountFormClient from '../../../../components/Forms/AccountFormClient';
import ProfileFormClient from '../../../../components/Forms/ProfileFormClient';
import ProfileApi from '../../../../core/ProfileApi';

class Profile extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    translate: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  state = {
    deleteProfileModal: false,
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      this.ProfileApi = ProfileApi.bind(this);
      this.ProfileApi().fetchProfile().then( data => {
        return this.setState({
          initialProfileValues: data,
        });
      })
    }
  }

  submitProfile = values =>
    this.ProfileApi()
      .submitProfile(values)
      .then(res => {
        // Re-Set profile values
        this.setState({ initialProfileValues: res });
        history.push('/profile');
      })
      .catch(e => Promise.reject(new SubmissionError(e)));

  submitAccount = values =>
    this.ProfileApi()
      .submitAccount(values)
      .then(() => {
        this.context.store.dispatch(reset('accountForm'));
      })
      .catch(e => Promise.reject(new SubmissionError(e)));


  render() {
    if (!this.state.initialProfileValues) {
      return <ReloadButton />;
    }

    return (
      <React.Fragment>
        <Card className="p-4">
          <CardBody>
            <Row className="justify-content-center text-center">
              <h1>Profile</h1>
            </Row>
            <Row>
              <Col xs={12} className="mb-4 text-center">
                <Avatar
                  size={110}
                  facebookId={this.state.initialProfileValues.facebookId}
                  email={this.state.initialProfileValues.email}
                  src={this.state.initialProfileValues.avatar}
                  name={`${this.state.initialProfileValues.firstName} ${
                    this.state.initialProfileValues.lastName
                    }`}
                />
              </Col>
              <Col xs={12}>
                <Row>
                  <Col>
                    <ProfileFormClient
                      initialValues={this.state.initialProfileValues}
                      disabled={this.state.disabled}
                      onSubmit={this.submitProfile}
                    />
                    <br />
                  </Col>
                </Row>
              </Col>
            </Row>
          </CardBody>
        </Card>
        <Card className="p-4">
          <CardBody>
            <Row className="justify-content-center text-center">
              <h1>Change password</h1>
            </Row>
            <Row>
              <Col xs={12}>
                <AccountFormClient
                  disabled={this.state.disabled}
                  onSubmit={this.submitAccount}
                />
              </Col>
            </Row>
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}

export default withStyles(s)(Profile);
