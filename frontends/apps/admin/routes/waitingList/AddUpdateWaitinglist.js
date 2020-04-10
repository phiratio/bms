import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Modal,
  Row,
} from 'reactstrap';
import _ from 'lodash';
import { SubmissionError, touch } from 'redux-form';
import AvatarEditor from 'react-avatar-editor';
import history from '../../../../history';
import AccountForm from '../../../../components/Forms/UserForm';
import s from './WaitingList.css';
import { validate } from '../../../../core/httpClient';
import { setBreadcrumbs } from '../../../../actions/breadcrumbs';
import Avatar from '../../../../components/Avatar';
import NotFound from '../../../../components/NotFound';
import WalkInsTable from '../../../../components/Tables/WalkInsTable';
import AppointmentsTable from '../../../../components/Tables/AppointmentsTable';
import ClientsTable from '../../../../components/Tables/ClientsTable';
import { b64toBlob, normalizePhone } from '../../../../core/utils';
import WaitinglistForm from '../../../../components/Forms/WaitinglistForm';
import {
  onEdit,
  fetchRecord,
  onUpdate,
  onEmployeeSelect,
  updateRecord,
  createRecord,
} from './WaitingList';
import {setEmployees} from "../../../../core/socketEvents";
import {WAITING_LIST_STATUS_CONFIRMED, WAITING_LIST_TYPE_APPOINTMENT} from "../../../../constants";

class AddUpdateWaitinglist extends React.Component {
  _isMounted = false;

  state = {
    currentUser: {},
    listOfAllEmployees: [],
    loading: true,
    listOfEnabledEmployees: [],
    fetchFailed: false,
    clientUpdateModal: false,
    actionDropdown: {},
    notFound: false,
    modals: {
      appointments: {
        isOpen: false,
      },
      user: {},
      employees: [],
      services: [],
    },
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.onEdit = onEdit.bind(this);
    this.fetchRecord = fetchRecord.bind(this);
    this.onEmployeeSelect = onEmployeeSelect.bind(this);
    this.createRecord = createRecord.bind(this);
    this.onUpdate = onUpdate.bind(this);
    this.setEmployees = setEmployees.bind(this);
    this.baseURL = props.baseURL || '/waitinglists';
    this.updateRecord = updateRecord.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    if (process.env.BROWSER) {
      this.context.socket.on('queue.setEmployees', this.setEmployees);
      this.fetchRecord(this.props.id)
        .then(data => {
          if (data) {
            data.employees = Array.isArray(data.employees)
              ? data.employees.map(el => el.username)
              : [];

            if (this.props.ownEdit) {
              this.onEmployeeSelect(_.get(this.context.store.getState(), 'user.username'));
            }

            this.setState({
              currentUser: this.context.store.getState().user,
              modals: {
                type: WAITING_LIST_TYPE_APPOINTMENT,
                appointments: { ...this.state.modals.appointments },
                services: [],
                id: 'new',
                status: WAITING_LIST_STATUS_CONFIRMED,
                date: new Date().getTime() / 1000,
                ...data,
              },
            });
          }
        })
        .catch(e => {
          this.setState({ notFound: true });
        });
    }
  }

  componentWillUnmount() {
    this.context.socket.off('queue.setEmployees', this.setEmployees);
    this._isMounted = false;
  }

  render() {
    const id = _.get(this.state, 'modals.id');
    const user = _.get(this.state, 'modals.user');
    return (
      <React.Fragment>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <h4>{this.props.title}</h4>
                {/* <div className="card-header-actions"> */}
                {/*  <button */}
                {/*    className="card-header-action btn-setting btn btn-link" */}
                {/*    onClick={() => { */}
                {/*      history.push('/waitingList/add'); */}
                {/*    }} */}
                {/*  > */}
                {/*    <i className="icon-user-follow" /> */}
                {/*  </button> */}
                {/* </div> */}
              </CardHeader>
              <CardBody>
                {this.state.notFound && (
                  <Row>
                    <Col>
                      <NotFound
                        title="Appointment was not found"
                        doNotShowBackButton
                      />
                    </Col>
                  </Row>
                )}
                {id && (
                  <Row>
                    <Col xs={12}>
                      {
                        user && (
                          <React.Fragment>
                            <Row className="justify-content-center text-center">
                              <Col xs={12}>
                                <Avatar
                                  size={140}
                                  facebookId={user.facebookId}
                                  email={user.email}
                                  src={user.avatar}
                                  name={`${user.firstName} ${user.lastName}`}
                                />
                              </Col>
                            </Row>
                            <Row className="mt-2 justify-content-center text-center">
                              <a href="#" onClick={e => { e.preventDefault(); history.push(`/accounts/${user.id}`) }}>Profile</a>
                            </Row>
                          </React.Fragment>
                        )
                      }
                      <Row>
                        <Col>
                          <WaitinglistForm
                            currentUser={this.state.currentUser}
                            baseURL={this.props.baseURL}
                            ownEdit={this.props.ownEdit}
                            initialValues={this.state.modals}
                            clientUpdateModal={this.state.clientUpdateModal}
                            selectedEmployees={this.state.modals.employees}
                            listOfEnabledEmployees={
                              this.state.listOfEnabledEmployees
                            }
                            listOfAllEmployees={this.state.listOfAllEmployees}
                            onEmployeeSelect={this.onEmployeeSelect}
                            onUpdate={this.onUpdate}
                            onEdit={this.onEdit}
                            createRecord={this.createRecord}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default withStyles(s)(AddUpdateWaitinglist);
