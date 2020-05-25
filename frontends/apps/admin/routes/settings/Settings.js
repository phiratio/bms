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
  ModalFooter,
  ModalBody,
  ModalHeader,
  Alert,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'reactstrap';
import s from './Settings.css';
import ScrollingEmployees from '../../../../components/ScrollingEmployees';
import { validate } from '../../../../core/httpClient';
import ToggleSetting from '../../../../components/ToggleSetting';
import ToggleSettingDropdown from '../../../../components/ToggleSettingDropdown';
import ReloadButton from '../../../../components/ReloadButton';
import GeneralSettings from '../../../../components/Forms/GeneralSettingsForm';
import ToggleSettingText from '../../../../components/ToggleSettingText';
import EditorModal from '../../../../components/EditorModal';

const FlicAction = ({ actionText, url, token }) => (
  <InputGroup className="mb-2">
    <InputGroupAddon addonType="prepend">
      <InputGroupText>{actionText}</InputGroupText>
    </InputGroupAddon>
    <input
      disabled
      className="form-control"
      value={`${window.App.apiUrl}${url}/?token=${token}`}
    />
    <InputGroupAddon
      addonType="append"
      onClick={() =>
        navigator.clipboard.writeText(
          `${window.App.apiUrl}${url}/?token=${token}`,
        )
      }
    >
      <InputGroupText>
        <i className="icon-docs" />
      </InputGroupText>
    </InputGroupAddon>
  </InputGroup>
);

class Settings extends React.Component {
  state = {
    terms: '',
    loading: false,
    fatchFailed: false,
    modal: {
      employees: [],
      token: '',
      selectedEmployee: [],
      originalEmployee: '',
      error: '',
      id: '',
    },
    employeeUpdateModal: false,
    settings: {
      slack: {
        config: {},
      },
      queue: {},
      timeRanges: {
        from_5min_to_20min: [],
        from_5min_to_1hour: [],
        from_1hour_to_12hour: [],
        from_1hour_to_6hour: [],
        from_1day_to_7day: [],
      },
      appointments: {},
      accounts: {},
      general: {},
      waitinglist: {},
      generalSettings: {
        workingHours: {},
        storeInfo: {},
        socials: {},
        address: {},
        terms: '',
      },
      buttons: {
        data: [],
      },
    },
  };

  static contextTypes = {
    fetch: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    translate: PropTypes.func.isRequired,
  };

  getSettings = () =>
    this.context.httpClient
      .getData(`/settings`)
      .then(validate.bind(this))
      .then(data => {
        this.setState({
          settings: data,
          modal: {
            ...this.state.modal,
            employees: data.employees.map(el => ({
              name: el.name,
              avatar: el.avatar,
            })),
          },
        });
        return true;
      })
      .catch(e => {
        if (e instanceof TypeError) {
          this.setState({ fetchFailed: true });
        }
        this.setState({ disabled: true });
        e._error && this.context.showNotification(e._error, 'error');
      });

  addFlicButton = () =>
    this.context.httpClient
      .sendData('/buttons/', 'POST')
      .then(validate.bind(this))
      .then(() => this.getSettings());

  deleteFlic = id =>
    this.context.httpClient
      .sendData(`/buttons/${id}`, 'DELETE')
      .then(validate.bind(this))
      .then(() => {
        this.setState({
          employeeUpdateModal: !this.state.employeeUpdateModal,
        });
        this.getSettings();
      });

  saveSettings = (values, route = `/settings`) =>
    this.context.httpClient
      .sendData(route, 'PUT', values)
      .then(validate.bind(this))
      .then(() => this.getSettings())
      .catch(e => {
        if (Object.keys(e).length > 0 && typeof e.message !== 'string') {
          Object.keys(e).forEach(key => {
            this.context.showNotification(e[key], 'error');
          });
        }
      });

  saveGeneralSettings = values =>
    this.saveSettings(values, `/settings/general`);

  saveTerms = values =>
    this.saveSettings(values, `/settings/terms`);

  toggleSetting = (settingName, settingKey, value = false) =>
    this.context.httpClient
      .sendData(`/settings`, 'PUT', {
        [`${settingName}.${settingKey}`]:
          value || !this.state.settings[settingName][settingKey],
      })
      .then(validate.bind(this))
      .then(data => {
        this.getSettings();
      })
      .catch(e => {
        if (Object.keys(e).length > 0 && typeof e.message !== 'string') {
          Object.keys(e).forEach(key => {
            this.context.showNotification(e[key], 'error');
          });
        }
      });

  onFlicTileClick = props => {
    this.setState({
      employeeUpdateModal: !this.state.employeeUpdateModal,
    });
    if (props) {
      setTimeout(() => {
        if (this.state.employeeUpdateModal) {
          const selectedEmployee = document.getElementById(
            this.state.modal.selectedEmployee,
          );
          if (selectedEmployee)
            document.getElementById('scrolling-wrapper').scrollLeft =
              selectedEmployee.offsetLeft - 200;
        }
      }, 800);
      this.setState({
        modal: {
          ...this.state.modal,
          error: '',
          token: props.token,
          ...(props.name && { header: props.name }),
          ...(props.username && { id: props.username }),
          ...(props.id && { id: props.id }),
          ...(props.username
            ? { selectedEmployee: props.username }
            : { selectedEmployee: '' }),
          ...(props.username
            ? { originalEmployee: props.username }
            : { originalEmployee: '' }),
        },
      });
    }
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      // Get data from server
      this.getSettings();
    }
  }

  updateFlicButton = props => {
    this.context.httpClient
      .sendData(`/settings/buttons`, 'PUT', {
        'button.data': {
          buttonId: props.id,
          employee: props.selectedEmployee,
        },
      })
      .then(validate.bind(this))
      .then(data => {
        if (data.success) {
          this.setState({
            employeeUpdateModal: !this.state.employeeUpdateModal,
          });
          this.getSettings();
        }
      })
      .catch(e => {
        if (e.tokenToEmployee) {
          this.setState({
            modal: {
              ...this.state.modal,
              error: e.tokenToEmployee,
            },
          });
        }
      });
  };

  onEmployeeSelect = employee => {
    const employees = this.state.modal.employees.map(el => el.name);
    if (employees.indexOf(employee) > -1) {
      this.setState({
        modal: {
          ...this.state.modal,
          selectedEmployee:
            this.state.modal.selectedEmployee === employee ? '' : employee,
        },
      });
    }
  };

  uninstallServiceWorker = () => {
    if (window.navigator && navigator.serviceWorker) {
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
          for (const registration of registrations) {
            registration.unregister();
          }
          this.context.showNotification('Service Worker uninstalled');
        })
        .catch(e => {
          this.context.showNotification(e.message, 'error');
        });
    } else {
      this.context.showNotification('Service Worker is not supported', 'error');
    }
  };

  clearCacheStorage = () => {
    caches
      .delete('webpack-offline:app-cache')
      .then(() => {
        this.context.showNotification('Cache cleared');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      })
      .catch(e => {
        this.context.showNotification(e.message, 'error');
      });
  };

  render() {
    const Employee = props => (
      <div
        className="text-white bg-primary card"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          this.onFlicTileClick(props);
        }}
      >
        <div className="card-body">
          <div className="h4 mb-0 text-overflow">
            {props.username ? props.username : 'Not set'}
          </div>
          <small className="text-muted text-uppercase font-weight-bold">
            {props.name}
          </small>
        </div>
      </div>
    );
    if (this.state.fetchFailed) {
      return <ReloadButton />;
    }
    return (
      <Row>
        <Modal
          fade={false}
          className="modal-primary"
          isOpen={this.state.employeeUpdateModal}
          toggle={this.onFlicTileClick}
        >
          <ModalHeader toggle={this.toggle}>
            {this.state.modal.header}
          </ModalHeader>
          <ModalBody>
            {this.state.modal.error && (
              <Alert color="danger">
                {this.context.translate(this.state.modal.error)}
              </Alert>
            )}
            <FlicAction
              url="/buttons/onClick"
              actionText="On Click"
              token={this.state.modal.token}
            />
            <FlicAction
              url="/buttons/onDoubleClick"
              actionText="On Hold"
              token={this.state.modal.token}
            />
            <FlicAction
              url="/buttons/onHold"
              actionText="On Double Click"
              token={this.state.modal.token}
            />

            <Row>
              <Col className="text-center mb-2 mt-2">
                <span className="btn-link">
                  <a
                    href="https://start.flic.io/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    How to configure Flic Hub
                  </a>
                </span>
              </Col>
            </Row>
            <Row>
              <Col className="mb-2 mt-2">
                <small>
                  <b>Assign Flic button</b>
                </small>
              </Col>
            </Row>
            <ScrollingEmployees
              size={80}
              list={this.state.modal.employees}
              onClick={this.onEmployeeSelect}
              selected={this.state.modal.selectedEmployee}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-auto"
              color="danger"
              onClick={() => this.deleteFlic(this.state.modal.id)}
            >
              Delete
            </Button>
            <Button color="secondary" onClick={this.onFlicTileClick}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={() => this.updateFlicButton(this.state.modal)}
              disabled={
                this.state.modal.selectedEmployee ===
                this.state.modal.originalEmployee
              }
            >
              Update
            </Button>
          </ModalFooter>
        </Modal>
        <Col xs={{ size: 12 }}>
          <Card>
            <CardHeader>
              <i className="icon-settings" />
              General
            </CardHeader>
            <CardBody>
              <br />
              <Row>
                <Col xs={12} className="mb-3">
                  <ToggleSettingText
                    settingName="general"
                    settingKey="storeInfo"
                    header="Store settings"
                    description="Provide store information"
                    value={this.state.settings.generalSettings.storeInfo}
                    toggleSetting={(name, key, value) =>
                      this.saveGeneralSettings({ storeInfo: value })
                    }
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={12} className="mb-3">
                  <ToggleSettingText
                    settingName="general"
                    settingKey="address"
                    header="Address"
                    description="Location address"
                    value={this.state.settings.generalSettings.address}
                    toggleSetting={(name, key, value) =>
                      this.saveGeneralSettings({ address: value })
                    }
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={12} className="mb-3">
                  <ToggleSettingText
                    settingName="general"
                    settingKey="socials"
                    header="Socials"
                    description="Links to social networks"
                    value={this.state.settings.generalSettings.socials}
                    toggleSetting={(name, key, value) =>
                      this.saveGeneralSettings({ socials: value })
                    }
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={12} className="mb-3">
                  {process.env.BROWSER && (
                    <EditorModal
                      header="Terms & Conditions"
                      description="Edit Terms and Conditions"
                      value={this.state.settings.generalSettings.terms}
                      savedState={this.state.terms}
                      onChange={editorState =>
                        this.setState({ terms: editorState })
                      }
                      save={() => this.saveTerms({ terms: this.state.terms })}
                    />
                  )}
                </Col>
              </Row>
              <Row>
                <Col xs={{ size: 12 }}>
                  <GeneralSettings
                    onSubmit={this.saveGeneralSettings}
                    initialValues={this.state.settings.generalSettings}
                  />
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xs={{ size: 12 }}>
          <Card>
            <CardHeader>
              <i className="icon-shuffle" />
              Queue
            </CardHeader>
            <CardBody>
              <Row>
                <Col xs={{ size: 12 }}>
                  <Row>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="queue"
                        settingKey="scheduleClearQueue"
                        description="Clear employees queue every day in midnight"
                        header="Clear queue every day"
                        checked={this.state.settings.queue.scheduleClearQueue}
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                  </Row>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xs={{ size: 12 }}>
          <Card>
            <CardHeader>
              <i className="icon-user" />
              Accounts
            </CardHeader>
            <CardBody>
              <Row>
                <Col>
                  <Row>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="accounts"
                        settingKey="signIn"
                        header="Allow clients to Sign-In"
                        description="Clients can login using there email address or social accounts"
                        checked={this.state.settings.accounts.signIn}
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="accounts"
                        settingKey="signUp"
                        description="Clients can register using there email address or social accounts"
                        header="Allow clients to Sign-Up"
                        checked={this.state.settings.accounts.signUp}
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="accounts"
                        settingKey="mobilePhoneVerification"
                        description="Client must verify there mobile phone"
                        header="Require mobile phone verification"
                        checked={
                          this.state.settings.accounts.mobilePhoneVerification
                        }
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="accounts"
                        settingKey="forgotPassword"
                        description="Allow clients restore passwords using email"
                        header="Account password recovery"
                        checked={this.state.settings.accounts.forgotPassword}
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="accounts"
                        settingKey="deleteUnusedAccounts"
                        description="Automatically delete unused client accounts"
                        header="Delete unused client accounts"
                        checked={
                          this.state.settings.accounts.deleteUnusedAccounts
                        }
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                  </Row>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xs={{ size: 12 }}>
          <Card>
            <CardHeader>
              <i className="icon-user" />
              Walk-ins Registration
            </CardHeader>
            <CardBody>
              <Row>
                <Col>
                  <Row>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="waitinglist"
                        settingKey="askEmail"
                        description="Require clients to enter email address during registration"
                        header="Ask email address"
                        checked={this.state.settings.waitinglist.askEmail}
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="waitinglist"
                        settingKey="allowSelectEmployee"
                        header="Allow clients select employees"
                        description="Show menu where client can select employees"
                        checked={
                          this.state.settings.waitinglist.allowSelectEmployee
                        }
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="waitinglist"
                        settingKey="preSelectEmployees"
                        header="Preselect employees"
                        description="Preselect employees from previous visit"
                        checked={
                          this.state.settings.waitinglist.preSelectEmployees
                        }
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <ToggleSetting
                        settingName="waitinglist"
                        settingKey="showTimeoutModal"
                        header="Show timeout modal"
                        description="Shows modal window with countdown. Clears the form if client does not interact for a period of time"
                        checked={
                          this.state.settings.waitinglist.showTimeoutModal
                        }
                        toggleSetting={this.toggleSetting}
                      />
                    </div>
                  </Row>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xs={{ size: 12 }}>
          <Card>
            <CardHeader>
              <i className="icon-people" />
              Appointments
              <ToggleSetting
                settingName="appointments"
                settingKey="enabled"
                checked={this.state.settings.appointments.enabled}
                toggleSetting={this.toggleSetting}
              />
            </CardHeader>
            <CardBody>
              <Row>
                <Col xs={12} className="mb-3">
                  <ToggleSetting
                    settingName="appointments"
                    settingKey="redirect"
                    header="Redirect"
                    description="If enabled clients will be redirected to URL specified below"
                    checked={this.state.settings.appointments.redirect}
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
                <Col xs={12} className="mb-3">
                  <ToggleSettingText
                    settingName="appointments"
                    settingKey="redirectCfg"
                    header="Redirect settings"
                    description="Provide redirect settings"
                    value={this.state.settings.appointments.redirectCfg}
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
                <Col xs={12} className="mb-3">
                  <ToggleSettingDropdown
                    options={
                      this.state.settings.timeRanges.from_1hour_to_12hour
                    }
                    settingName="appointments"
                    settingKey="priorTime"
                    header="Prior time booking"
                    description="Client can make an appointment prior selected time"
                    value={this.state.settings.appointments.priorTime}
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
                <Col xs={12} className="mb-3">
                  <ToggleSettingDropdown
                    options={this.state.settings.timeRanges.from_1day_to_7day}
                    settingName="appointments"
                    settingKey="futureBooking"
                    header="Future booking"
                    description="Clients can choose dates for future appointments"
                    value={this.state.settings.appointments.futureBooking}
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
                {/* <Col xs={12} className="mb-3"> */}
                {/*  <ToggleSetting */}
                {/*    settingName="appointments" */}
                {/*    settingKey="autoConfirm" */}
                {/*    header="Automatically confirm all bookings" */}
                {/*    checked={this.state.settings.appointments.autoConfirm} */}
                {/*    toggleSetting={this.toggleSetting} */}
                {/*    disabled */}
                {/*  /> */}
                {/* </Col> */}
                <Col xs={12} className="mb-3">
                  <ToggleSetting
                    settingName="appointments"
                    settingKey="notificationSlackPublic"
                    header="Send message to public channel when an appointments created/updated/canceled"
                    description="If enabled information about all appointments will be send to a public channel in Slack"
                    checked={
                      this.state.settings.appointments.notificationSlackPublic
                    }
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
                {/* <Col xs={12} className="mb-3"> */}
                {/*  <ToggleSettingDropdown */}
                {/*    options={ */}
                {/*      this.state.settings.timeRanges.from_1hour_to_12hour */}
                {/*    } */}
                {/*    settingName="appointments" */}
                {/*    isClearable */}
                {/*    placeholder="Do not move" */}
                {/*    settingKey="showInWaitingListTime" */}
                {/*    header="How many hours prior bookings will show up in waiting list" */}
                {/*    description="Amount of time required for a booking to appear in waiting list" */}
                {/*    value={ */}
                {/*      this.state.settings.appointments.showInWaitingListTime */}
                {/*    } */}
                {/*    toggleSetting={this.toggleSetting} */}
                {/*  /> */}
                {/* </Col> */}
                <Col xs={12} className="mb-3">
                  <ToggleSettingDropdown
                    options={this.state.settings.timeRanges.from_1hour_to_6hour}
                    settingName="appointments"
                    isClearable
                    placeholder="Do not send"
                    settingKey="sendReminderPriorTime"
                    header="How many hours prior a reminder will be send to a client"
                    description="A reminding letter will be send to client with appointment details before appointment.
                    Note: Reminders for appointments created on the same day will not be send"
                    value={
                      this.state.settings.appointments.sendReminderPriorTime
                    }
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
                <Col xs={12} className="mb-3">
                  <ToggleSettingDropdown
                    options={this.state.settings.timeRanges.from_5min_to_20min}
                    settingName="appointments"
                    settingKey="timeStep"
                    header="Time step"
                    description="Amount of time one appointment block takes"
                    value={this.state.settings.appointments.timeStep}
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xs={{ size: 12 }}>
          <Card>
            <CardHeader>
              <i className="icon-screen-desktop" />
              TV Screens
            </CardHeader>
            <CardBody>
              <Row>
                <Col xs={12} className="mb-3">
                  <ToggleSetting
                    settingName="waitinglist"
                    settingKey="showOnTv"
                    description="Show newly created waitinglist records on TV screens"
                    header="Show on TV screens"
                    checked={this.state.settings.waitinglist.showOnTv}
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
                <Col xs={12} className="mb-3">
                  <ToggleSetting
                    settingName="appointments"
                    settingKey="showOnTvOnlyTodayRecords"
                    header="Show only today's appointments on the screen"
                    description="If enabled only today's appointments will appear on TV Screens"
                    checked={
                      this.state.settings.appointments.showOnTvOnlyTodayRecords
                    }
                    toggleSetting={this.toggleSetting}
                  />
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col xs={{ size: 12 }}>
          <Card>
            <CardHeader>
              <i className="icon-settings" />
              Notifications
            </CardHeader>
            <CardBody>
              <Row>
                <Col xs={12} className="mb-3">
                  <ToggleSettingText
                    settingName="slack"
                    settingKey="config"
                    header="Slack settings"
                    description="Slack workspace and channels settings"
                    value={this.state.settings.slack.config}
                    toggleSetting={(name, key, value) =>
                      this.saveSettings({ 'slack.config': value })
                    }
                  />
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col
          xs={{ order: 2, size: 12 }}
          sm={{ order: 2, size: 12 }}
          lg={{ order: 1, size: 12 }}
        >
          <Card>
            <CardHeader>
              <i className="icon-tag" />
              Flic buttons
              <a
                href="https://flic.io/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <i className="icon-question pl-2" />
              </a>
              <ToggleSetting
                settingName="buttons"
                settingKey="enabled"
                checked={this.state.settings.buttons.enabled}
                toggleSetting={this.toggleSetting}
              />
            </CardHeader>
            <CardBody>
              <Row>
                <Col>
                  <Row>
                    {this.state.settings.buttons.data.length > 0 &&
                      this.state.settings.buttons.data.map((el, i) => (
                        <Col
                          key={el.id}
                          xs={{ size: 6 }}
                          sm={{ size: 6 }}
                          md={{ size: 3 }}
                          lg={{ size: 2 }}
                        >
                          <Employee
                            id={el.id}
                            username={el.username}
                            name={el.name}
                            token={el.token}
                          />
                        </Col>
                      ))}
                  </Row>
                  <Row>
                    <Col>
                      <div className="text-center">
                        <span className="btn-link" onClick={this.addFlicButton}>
                          Add
                        </span>
                      </div>
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

export default withStyles(s)(Settings);
