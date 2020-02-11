import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Button, Card, CardBody, CardHeader, Col, Row } from 'reactstrap';
import { SubmissionError, touch } from 'redux-form';
import AvatarEditor from 'react-avatar-editor';
import history from '../../history';
import AccountForm from '../../components/Forms/UserForm';
import s from './Accounts.css';
import { validate } from '../../core/httpClient';
import { setBreadcrumbs } from '../../actions/breadcrumbs';
import Avatar from '../../components/Avatar';
import NotFound from '../../components/NotFound';
import WalkInsTable from '../../components/Tables/WalkInsTable';
import ClientsTable from '../../components/Tables/ClientsTable';
import {b64toBlob, normalizePhone} from '../../core/utils';

class AddUpdateAccounts extends React.Component {
  _isMounted = false;

  state = {
    roles: [],
    items: [],
    initialUserFormValues: {
      role: {
        name: '',
      },
      schedule: {},
    },
    timeRanges: {},
    tables: {
      clients: false,
      visits: false,
    },
    notFound: false,
    image: null,
    allowZoomOut: false,
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    rotate: 0,
    borderRadius: 100,
    preview: null,
    width: 200,
    height: 200,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
  };

  fetchUser = id => {
    if (this._isMounted) this.setState({ loading: true });
    this.context.httpClient
      .getData(`/accounts/${id}`)
      .then(validate.bind(this))
      .then(user => {
        if (this._isMounted) {
          this.setState({
            initialUserFormValues: {
              ...user,
              ...{ mobilePhone: normalizePhone(user.mobilePhone) },
            },
          });
          this.context.store.dispatch(
            setBreadcrumbs(this.props.route, this.props.params, {
              user: `${user.firstName} ${user.lastName}`,
            }),
          );
        }
      })
      .then(() => {
        if (this._isMounted) return this.setState({ loading: false });
      })
      .catch(() => {
        if (this._isMounted) {
          this.context.store.dispatch(
            setBreadcrumbs(this.props.route, this.props.params, {
              user: 'Not Found',
            }),
          );
          this.setState({ notFound: true });
        }
      });
  };

  submitUser = values => {
    this.context.store.dispatch(
      touch('userForm', 'firstName', 'lastName', 'email'),
    );
    const apiUrl = values.id ? `/accounts/${values.id}` : `/accounts`;
    let role;
    let items;
    if (values.role) role = values.role.id;
    if (Array.isArray(values.items)) items = values.items.map(el => el.id);
    return this.context.httpClient
      .sendData(apiUrl, values.id ? 'PUT' : 'POST', { ...values, role, items })
      .then(validate.bind(this))
      .then(user => {
        if (user.id) history.push(`/accounts/${user.id}`);
        else throw new Error('Error occurred while submitting user data');
      })
      .catch(e => Promise.reject(new SubmissionError(e)));
  };

  deleteUser = () => {
    const id = this.props.userId;
    this.context.httpClient
      .sendData(`/accounts/${id}`, 'DELETE')
      // .then(validate.bind(this))
      .then(() => {
        this.context.showNotification('Successfully deleted');
        history.push('/accounts/');
      })
      .catch(e => {
        if (e._error) this.context.showNotification(e._error, 'error');
      });
  };

  fetchMeta = () => {
    if (this._isMounted) this.setState({ loading: true });
    this.context.httpClient
      .getData(`/accounts/meta`)
      .then(validate.bind(this))
      .then(meta => {
        if (this._isMounted) {
          this.setState({ ...meta });
        }
      })
      .catch(e =>
        this.context.showNotification('Unable to fetch meta data', 'error'),
      );
  };

  clearAvatar = () => {
    if (this._isMounted) {
      const id = this.props.userId;
      this.context.httpClient
        .sendData(`/accounts/avatar/${id}`, 'DELETE')
        // .then(validate.bind(this))
        .then(() => {
          this.context.showNotification('Successfully cleared');
          this.fetchUser(id);
        })
        .catch(e => {
          if (e._error) this.context.showNotification(e._error, 'error');
        });
    }
  };

  uploadAvatar = () => {
    if (this._isMounted) {
      const img = this.editor.getImageScaledToCanvas().toDataURL();
      const rect = this.editor.getCroppingRect();

      this.setState({
        preview: {
          img,
          rect,
          scale: this.state.scale,
          width: this.state.width,
          height: this.state.height,
          borderRadius: this.state.borderRadius,
        },
      });

      // Split the base64 string in data and contentType
      const block = img.split(';');
      // Get the content type of the image
      const contentType = block[0].split(':')[1];
      // get the real base64 content of the file
      const realData = block[1].split(',')[1];

      // Convert it to a blob to upload
      const blob = b64toBlob(realData, contentType);
      let filename = `${this.props.userId}.png`;

      const { firstName, lastName } = this.state.initialUserFormValues;
      if (firstName && lastName) {
        filename = `${firstName}-${lastName}.png`;
      }

      const formData = new FormData();
      formData.append('path', 'avatar');
      formData.append('refId', this.props.userId);
      formData.append('ref', 'user');
      formData.append('source', 'users-permissions');
      formData.append('field', 'avatar');
      formData.append('files', blob, filename);
      this.context.httpClient
        .uploadFile(`/accounts/avatar`, formData)
        .then(validate.bind(this))
        .then(data => {
          if (this._isMounted) this.setState({ loading: false });
          if (Array.isArray(data)) {
            if (data[0].url) {
              this.context.showNotification('Successfully saved');
              this.fetchUser(this.props.userId);
              this.setState({ image: null });
            }
          } else {
            this.context.showNotification('Unidentified response');
          }
        })
        .catch(e => {
          if (e.error) this.context.showNotification(e.error, 'error');
        });
      const fileInput = document.getElementById('avatarUpload');
      fileInput.value = fileInput.defaultValue;
    }
  };

  cancelUpload = () => {
    this.setState({ image: null });
    // Clear the value of <input type='file' /> otherwise while selecting same file multiple times will result in no action
    const fileInput = document.getElementById('avatarUpload');
    fileInput.value = fileInput.defaultValue;
  };

  componentDidMount() {
    this._isMounted = true;
    this.fetchMeta();
    const { userId } = this.props;
    if (userId) {
      this.fetchUser(userId);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  showTable = name => {
    if (this._isMounted) {
      this.setState({
        tables: {
          ...this.state.tables,
          [name]: true,
        },
      });
    }
  };

  handleNewImage = e => {
    this.setState({ image: e.target.files[0] });
  };

  handleScale = e => {
    const scale = parseFloat(e.target.value);
    this.setState({ scale });
  };

  handleAllowZoomOut = ({ target: { checked: allowZoomOut } }) => {
    this.setState({ allowZoomOut });
  };

  rotateLeft = e => {
    e.preventDefault();

    this.setState({
      rotate: this.state.rotate - 90,
    });
  };

  rotateRight = e => {
    e.preventDefault();
    this.setState({
      rotate: this.state.rotate + 90,
    });
  };

  handleXPosition = e => {
    const x = parseFloat(e.target.value);
    this.setState({ position: { ...this.state.position, x } });
  };

  handleYPosition = e => {
    const y = parseFloat(e.target.value);
    this.setState({ position: { ...this.state.position, y } });
  };

  handleWidth = e => {
    const width = parseInt(e.target.value);
    this.setState({ width });
  };

  handleHeight = e => {
    const height = parseInt(e.target.value);
    this.setState({ height });
  };

  setEditorRef = editor => {
    if (editor) this.editor = editor;
  };

  handlePositionChange = position => {
    this.setState({ position });
  };

  handleDrop = acceptedFiles => {
    this.setState({ image: acceptedFiles[0] });
  };

  render() {
    return (
      <React.Fragment>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <h4>{this.props.title}</h4>
                {this.props.userId && (
                  <div className="card-header-actions">
                    <button
                      className="card-header-action btn-setting btn btn-link"
                      onClick={() => {
                        history.push('/accounts/add');
                      }}
                    >
                      <i className="icon-user-follow" />
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardBody>
                {this.state.notFound ? (
                  <Col>
                    <NotFound title="User was not found" />
                  </Col>
                ) : (
                  <Row>
                    <Col
                      xs={{ order: 2, size: 12 }}
                      sm={{ order: 2, size: 12 }}
                      lg={{ order: 1, size: 8, offset: 1 }}
                    >
                      <Row>
                        <Col>
                          <AccountForm
                            userId={this.props.userId}
                            employeeRoles={this.state.employeeRoles}
                            initialValues={this.state.initialUserFormValues}
                            onSubmit={this.submitUser}
                            onDelete={this.deleteUser}
                            allUserRoles={this.state.roles}
                            items={this.state.items}
                            timeRanges={this.state.timeRanges}
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
                        paddingBottom: '60px',
                      }}
                    >
                      <div
                        className="text-center"
                        style={{ display: this.state.image ? 'block' : 'none' }}
                      >
                        <div>
                          <AvatarEditor
                            ref={this.setEditorRef}
                            scale={parseFloat(this.state.scale)}
                            width={this.state.width}
                            height={this.state.height}
                            position={this.state.position}
                            onPositionChange={this.handlePositionChange}
                            rotate={parseFloat(this.state.rotate)}
                            borderRadius={
                              this.state.width / (100 / this.state.borderRadius)
                            }
                            image={this.state.image}
                            className="editor-canvas"
                          />
                        </div>
                        <br />
                        <div style={{ display: 'none' }}>
                          <input
                            name="avatarUpload"
                            id="avatarUpload"
                            type="file"
                            onChange={this.handleNewImage}
                          />
                        </div>
                        <br />
                        <input
                          name="scale"
                          type="range"
                          onChange={this.handleScale}
                          min={this.state.allowZoomOut ? '0.1' : '1'}
                          max="2"
                          step="0.01"
                          defaultValue="1"
                        />
                        <br />
                        <div className="position-relative form-check">
                          <input
                            name="allowZoomOut"
                            id="allowZoomOut"
                            type="checkbox"
                            className="form-check-input"
                            onChange={this.handleAllowZoomOut}
                            checked={this.state.allowZoomOut}
                          />
                          <label
                            htmlFor="allowZoomOut"
                            className="form-check-label"
                          >
                            Allow Scaling
                          </label>
                        </div>
                        <Button color="link" onClick={this.rotateRight}>
                          Rotate
                        </Button>
                        <br />
                        <br />
                        <Button color="primary" onClick={this.uploadAvatar}>
                          Upload
                        </Button>
                        <br />
                        <Button color="link" onClick={this.cancelUpload}>
                          Cancel
                        </Button>
                      </div>
                      {this.props.userId && !this.state.image && (
                        <React.Fragment>
                          <Avatar
                            size={110}
                            facebookId={this.state.initialUserFormValues.facebookId}
                            email={this.state.initialUserFormValues.email}
                            src={this.state.initialUserFormValues.avatar}
                            name={`${
                              this.state.initialUserFormValues.firstName
                            } ${this.state.initialUserFormValues.lastName}`}
                          />
                          {this.state.initialUserFormValues.avatar && (
                            <React.Fragment>
                              <Button
                                style={{ position: 'absolute', top: '120px' }}
                                color="link"
                                onClick={this.clearAvatar}
                              >
                                Clear
                              </Button>
                            </React.Fragment>
                          )}
                          {!this.state.initialUserFormValues.avatar && (
                            <React.Fragment>
                              <label
                                htmlFor="avatarUpload"
                                style={{ position: 'absolute', top: '120px' }}
                                className="btn btn-link"
                              >
                                Change
                              </label>
                            </React.Fragment>
                          )}
                        </React.Fragment>
                      )}
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
        {this.props.userId && (
          <Row
            style={{ display: this.state.tables.clients ? 'block' : 'none' }}
          >
            <Col xs={{ size: 12 }} sm={{ size: 12 }} lg={{ size: 12 }}>
              <Card>
                <CardHeader>
                  <h4>Clients</h4>
                </CardHeader>
                <CardBody>
                  <ClientsTable
                    userId={this.props.userId}
                    showTable={this.showTable}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
        {this.props.userId && (
          <Row style={{ display: this.state.tables.visits ? 'block' : 'none' }}>
            <Col xs={{ size: 12 }} sm={{ size: 12 }} lg={{ size: 12 }}>
              <Card>
                <CardHeader>
                  <h4>Walk-Ins</h4>
                </CardHeader>
                <CardBody>
                  <WalkInsTable
                    userId={this.props.userId}
                    showTable={this.showTable}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </React.Fragment>
    );
  }
}

export default withStyles(s)(AddUpdateAccounts);
