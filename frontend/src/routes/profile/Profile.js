import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Modal,
  ModalHeader,
  ModalFooter,
} from 'reactstrap';
import { SubmissionError, reset } from 'redux-form';
import Avatar from '../../components/Avatar';
import ReloadButton from '../../components/ReloadButton';
import history from '../../history';
import s from './Profile.css';
import AccountForm from '../../components/Forms/AccountForm';
import ProfileForm from '../../components/Forms/ProfileForm/ProfileForm';
import { validate } from '../../core/httpClient';

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
    this.context.httpClient
      .getData(`/accounts/profile`)
      .then(validate.bind(this))
      .then(data => {
        this.setState({ initialProfileValues: data });
        return true;
      })
      .catch(e => {
        this.setState({ disabled: true });
        e._error && this.context.showNotification(e._error, 'error');
      });
  }

  submitProfile = values =>
    this.context.httpClient
      .sendData(`/accounts/profile`, 'PUT', values)
      .then(validate.bind(this))
      .then(res => {
        // Re-Set profile values
        this.setState({ initialProfileValues: res });
        history.push('/profile');
      })
      .catch(e => Promise.reject(new SubmissionError(e)));

  submitAccount = values =>
    this.context.httpClient
      .sendData(`/accounts/profile/changePassword`, 'PUT', values)
      .then(validate.bind(this))
      .then(() => {
        this.context.store.dispatch(reset('accountForm'));
      })
      .catch(e => Promise.reject(new SubmissionError(e)));

  deleteAccount = () =>
    this.context.httpClient
      .sendData(`/accounts/profile`, 'DELETE')
      .then(validate.bind(this))
      .then(data => {
        if (data.success) return history.push('/logout');
        return this.context.showNotification(
          'Empty response from the server',
          'error',
        );
      })
      .catch(e => {
        if (e._error) this.context.showNotification(e._error, 'error');
      });

  onDeleteButtonClick = () => {
    this.setState({ deleteProfileModal: !this.state.deleteProfileModal });
  };

  render() {
    if (!this.state.initialProfileValues) {
      return <ReloadButton />;
    }

    return (
      <Row>
        <Col>
          <Card>
            <Modal
              className="modal-danger"
              isOpen={this.state.deleteProfileModal}
              toggle={this.onDeleteButtonClick}
            >
              <ModalHeader>
                Are you sure you want to delete your account ?
              </ModalHeader>
              <ModalFooter>
                <Button
                  color="secondary"
                  onClick={() => {
                    this.onDeleteButtonClick();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onClick={() => {
                    this.deleteAccount();
                  }}
                  disabled={this.state.disabled}
                >
                  Delete
                </Button>
              </ModalFooter>
            </Modal>
            <CardHeader>
              <h4>Public profile</h4>
            </CardHeader>
            <CardBody>
              <br />
              <Row>
                <Col
                  xs={{ order: 2, size: 12 }}
                  sm={{ order: 2, size: 12 }}
                  lg={{ order: 1, size: 7, offset: 2 }}
                >
                  <Row>
                    <Col>
                      <ProfileForm
                        initialValues={this.state.initialProfileValues}
                        disabled={this.state.disabled}
                        onSubmit={this.submitProfile}
                      />
                      <br />
                    </Col>
                  </Row>
                </Col>
                <Col
                  xs={{ order: 1, size: 12 }}
                  sm={{ order: 1, size: 12 }}
                  lg={{ order: 2, size: 3 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingBottom: '32px',
                  }}
                >
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
              </Row>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h4>Change password</h4>
            </CardHeader>
            <CardBody>
              <br />
              <Row>
                <Col
                  xs={{ order: 2, size: 12 }}
                  sm={{ order: 2, size: 12 }}
                  lg={{ order: 1, size: 7, offset: 2 }}
                >
                  <Row>
                    <Col>
                      <AccountForm
                        disabled={this.state.disabled}
                        onSubmit={this.submitAccount}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default withStyles(s)(Profile);
