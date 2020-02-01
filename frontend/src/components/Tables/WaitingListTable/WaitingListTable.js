import React from 'react';
import {
  Col,
  Row,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  ButtonDropdown,
  DropdownToggle,
  DropdownItem,
  DropdownMenu,
} from 'reactstrap';
import get from 'lodash.get';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faUser from '@fortawesome/fontawesome-free-solid/faUser';
import faFlag from '@fortawesome/fontawesome-free-solid/faFlag';
import faCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import faEllipsisH from '@fortawesome/fontawesome-free-solid/faEllipsisH';
import faLightBulb from '@fortawesome/fontawesome-free-solid/faLightbulb';
import classNames from 'classnames';
import shortId from 'shortid';
import _ from 'lodash';
import moment from 'moment';
import PropTypes, { instanceOf } from 'prop-types';
import Avatar from '../../Avatar';
import Table from '../../Table';
import DownwardsArrow from '../../../icons/downwards_triangleheaded_arrow_with_long_tip_rightwards';
import s from './WaitingListTable.css';
import Pagination from '../../Pagination';
import history from '../../../history';

import {
  WAITING_LIST_TYPE_APPOINTMENT,
  WAITING_LIST_TYPE_WALK_IN,
  WAITING_LIST_STATUS_CONFIRMED,
  WAITING_LIST_TYPE_RESERVED,
} from '../../../constants';

const CheckButton = () => (
  <div className="btn btn-lg btn-square btn-success">
    <i className="icon-check" />
  </div>
);

const WAITING_LIST_STATUS = {
  0: (
    <span className="badge badge-warning">
      <i className="icon-clock" />
    </span>
  ),
  1: (
    <span className="badge badge-success">
      <i className="icon-check" />
    </span>
  ),
  2: (
    <span className="badge badge-danger">
      <i className="icon-close" />
    </span>
  ),
  3: (
    <span></span>
  ),
};

class WaitingListTable extends React.Component {
  state = {
    actionDropdown: false,
  };

  static contextTypes = {
    showNotification: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
  };

  onCheckClick = rowInfo => this.props.toggleProperty(rowInfo.original._id);

  onFlagClick = rowInfo =>
    this.props.toggleProperty(rowInfo.original._id, 'flag');

  toggleActionDropdown = id => {
    if (this.state.actionDropdown !== id) {
      this.setState({ actionDropdown: id });
    } else {
      this.setState({ actionDropdown: false });
    }
  };

  ActionsDropdown = props => (
    <ButtonDropdown
      isOpen={this.state.actionDropdown === props.original.id}
      toggle={() => {
        this.toggleActionDropdown(props.original.id);
      }}
    >
      <DropdownToggle className="btn-lg btn-square ">
        <i className="icon-options" />
      </DropdownToggle>
      <DropdownMenu className="actions-column-dropdown" right>
        <DropdownItem header>Actions</DropdownItem>
        <DropdownItem name="table-action-edit">
          <i className="icon-note" />
          Edit
        </DropdownItem>
        <DropdownItem name="table-action-flag">
          <i className="icon-flag" />
          Flag
        </DropdownItem>
      </DropdownMenu>
    </ButtonDropdown>
  );

  columns = [
    {
      Header: <FontAwesomeIcon className={s.svgIcon} icon={faUser} />,
      accessor: 'avatar',
      className: 'text-center',
      Cell: props => (
        <Avatar
          color={
            props.original.check === true
              ? '#ccc'
              : props.original.flag
              ? '#F86C6B'
              : '#3E83F8'
          }
          size={45}
          src={get(props.original, 'user.avatar', false)}
          email={get(props.original, 'user.email', false)}
          name={`${get(props.original, 'user.firstName', '-')} ${get(
            props.original,
            'user.lastName',
            '-',
          )}`}
        />
      ),
      minWidth: 76,
      maxWidth: 76,
      sortable: false,
      resizable: false,
    },
    {
      Header: 'First Name',
      accessor: 'firstName', // String-based value accessors!
      minWidth: 70,
      sortable: false,
      Cell: props => get(props.original, 'user.firstName', '-'),
    },
    {
      Header: 'Last Name',
      accessor: 'lastName', // String-based value accessors!
      sortable: false,
      minWidth: 70,
      Cell: props => get(props.original, 'user.lastName', '-'),
    },
    {
      Header: 'Employees',
      accessor: 'active',
      className: 'text-center',
      minWidth: 90,
      sortable: false,
      Cell: props => {
        if (Array.isArray(props.original.employees)) {
          return props.original.employees.map(el => {
            if (props.original.check === true)
              return (
                <span
                  key={el.username}
                  className="badge"
                  style={{
                    color: 'white',
                    backgroundColor: '#ccc',
                  }}
                >
                  {el.username}
                </span>
              );
            if (el.username === 'Anyone')
              return (
                <span key={el.username} className="badge badge-success">
                  {el.username}
                </span>
              );
            return (
              <span key={el.username} className="badge badge-warning">
                {el.username}
              </span>
            );
          });
        }
      },
    },
    {
      Header: 'Check In',
      accessor: 'createdAt', // String-based value accessors!
      sortable: false,
      minWidth: 120,
      maxWidth: 120,
      className: 'text-center',
      Cell: props => {
        if (props.original.apptStartTime) {
          const startTime = moment(props.original.apptStartTime).unix();
          const now = moment().unix();
          const tenMinutesBefore = moment(props.original.apptStartTime)
            .subtract(10, 'minutes')
            .unix();
          if (startTime < now) {
            return moment(props.original.apptStartTime).fromNow();
          }
          if (tenMinutesBefore < now) {
            return (
              <span className="badge badge-danger">
                {moment(props.original.apptStartTime).fromNow()}
              </span>
            );
          }
          return (
            <span className="badge badge-light">
              {moment(props.original.apptStartTime).fromNow()}
            </span>
          );
        }
        return moment(props.original.createdAt).fromNow();
      },
    },
    {
      Header: <FontAwesomeIcon className={s.svgIcon} icon={faLightBulb} />,
      accessor: 'status',
      className: 'text-center',
      minWidth: 40,
      sortable: false,
      Cell: props => {
        if (
          props.original.status !== null &&
          (props.original.type === WAITING_LIST_TYPE_APPOINTMENT ||
            props.original.type === WAITING_LIST_TYPE_RESERVED)
        ) {
          return WAITING_LIST_STATUS[props.original.status];
        }
        return WAITING_LIST_STATUS[3];
      },
    },
    {
      Header: <FontAwesomeIcon className={s.svgIcon} icon={faEllipsisH} />,
      accessor: 'flag', // String-based value accessors!
      sortable: false,
      minWidth: 66,
      maxWidth: 66,
      className: 'text-center',
      style: { overflow: 'inherit' },
      resizable: false,
      Cell: this.ActionsDropdown,
    },
    {
      Header: <FontAwesomeIcon className={s.svgIcon} icon={faCheck} />,
      accessor: 'check', // String-based value accessors!
      sortable: false,
      minWidth: 66,
      maxWidth: 66,
      resizable: false,
      className: 'text-center',
      resizable: false,
      Cell: () => <CheckButton />,
    },
  ];

  render() {
    const meta = this.props.meta || {};
    const pageSize = meta.pageSize || this.props.defaultPageSize || 8;
    return (
      <div>
        <Row>
          <Col>
            <Table
              noDataText="No clients"
              getTrProps={(state, rowInfo, column) => {
                if (rowInfo) {
                  let timeOffset;
                  let className;
                  const outlinedRecord =
                    ((rowInfo.original.type === WAITING_LIST_TYPE_APPOINTMENT ||
                      rowInfo.original.type === WAITING_LIST_TYPE_RESERVED) &&
                      !rowInfo.original.flag) ||
                    (rowInfo.original.flag && rowInfo.original.check);

                  if (
                    rowInfo.original.type === WAITING_LIST_TYPE_APPOINTMENT ||
                    rowInfo.original.type === WAITING_LIST_TYPE_RESERVED ||
                    rowInfo.original.note ||
                    rowInfo.original.services ||
                    rowInfo.original.apptStartTime
                  ) {
                    if (rowInfo.original.check) {
                      className = classNames({ outlined: outlinedRecord });
                    } else {
                      className = classNames({
                        'outlined outlined-primary': outlinedRecord,
                        'outlined-danger':
                          (rowInfo.original.type ===
                            WAITING_LIST_TYPE_APPOINTMENT ||
                            rowInfo.original.type ===
                              WAITING_LIST_TYPE_RESERVED) &&
                          rowInfo.original.flag,
                      });
                    }
                  }

                  if (
                    rowInfo.original.flash &&
                    rowInfo.original.type !== WAITING_LIST_TYPE_APPOINTMENT &&
                    rowInfo.original.type !== WAITING_LIST_TYPE_RESERVED
                  ) {
                    timeOffset =
                      new Date(rowInfo.original.createdAt).getTime() >
                      Date.now() - 7 * 1000;
                    className = classNames({
                      [s.flashWarning]:
                        rowInfo.original.flash &&
                        timeOffset &&
                        rowInfo.original.type === WAITING_LIST_TYPE_WALK_IN,
                    });
                  }
                  return {
                    className,
                    style: {
                      background:
                        rowInfo.original.flag &&
                        rowInfo.original.check === false
                          ? '#ffd4d5'
                          : null,
                    },
                  };
                }
                return {};
              }}
              getTdProps={(state, rowInfo, column, instance) => ({
                onClick: (e, handleOriginal) => {
                  if (rowInfo && column) {
                    if (
                      column.Header === 'Check In' ||
                      column.Header === 'Employees' ||
                      (column.id === 'status' && rowInfo.original.user !== null)
                    ) {
                      this.props.onEdit(rowInfo.original._id);
                    } else if (column.id === 'flag') {
                      if (e.target.name === 'table-action-edit') {
                        this.props.onEdit(rowInfo.original._id);
                      } else if (e.target.name === 'table-action-flag') {
                        this.onFlagClick(rowInfo);
                      }
                    } else if (column.id === 'check') {
                      this.onCheckClick(rowInfo);
                    } else if (
                      column.Header === 'First Name' ||
                      column.Header === 'Last Name'
                    ) {
                      if (get(rowInfo.original, 'user.id'))
                        history.push(`/accounts/${rowInfo.original.user.id}`);
                    }
                  }
                },
              })}
              loading={this.props.loading}
              data={this.props.data}
              columns={this.columns}
              defaultPageSize={this.props.defaultPageSize}
              pageSize={pageSize}
              expanded={this.props.expanded}
              SubComponent={row => {
                const className = classNames({
                  'sub-danger':
                    !row.original.check &&
                    row.original.type === WAITING_LIST_TYPE_WALK_IN &&
                    row.original.flag,
                  'outlined-sub outlined':
                    row.original.check &&
                    (row.original.type === WAITING_LIST_TYPE_APPOINTMENT ||
                      row.original.type === WAITING_LIST_TYPE_RESERVED),
                  'outlined-sub outlined-primary':
                    !row.original.flag &&
                    !row.original.check &&
                    (row.original.type === WAITING_LIST_TYPE_APPOINTMENT ||
                      row.original.type === WAITING_LIST_TYPE_RESERVED),
                  'outlined-sub-danger':
                    (row.original.type === WAITING_LIST_TYPE_APPOINTMENT ||
                      row.original.type === WAITING_LIST_TYPE_RESERVED) &&
                    row.original.flag &&
                    !row.original.check,
                });
                return (
                  <div className={className}>
                    <Row className="pb-2 ml-0 mr-0">
                      {row.original.apptStartTime && (
                        <Col xs={{ size: 12 }} className="pl-0">
                          <span className="arrow">
                            <DownwardsArrow
                              color="#73818f"
                              style={{
                                paddingTop: '0.5em',
                                height: '1.3em',
                              }}
                            />
                          </span>
                          <small className="text-right text-muted mr-1 ml-0">
                            Time range:
                          </small>
                          <span className="badge badge-light">
                            {moment(row.original.apptStartTime).format('LT')} -{' '}
                            {moment(row.original.apptEndTime).format('LT')}
                          </span>
                        </Col>
                      )}
                      {row.original.services &&
                        row.original.services.length > 0 && (
                          <Col xs={12} className="pl-5 text-overflow mr-2">
                            <small className="text-muted mr-1">Services:</small>
                            {row.original.services.map(el => (
                              <span key={el.name} className="badge badge-light">
                                {el.name}
                              </span>
                            ))}
                          </Col>
                        )}
                      {row.original.note && (
                        <Col xs={12} className="pl-5">
                          <small className="text-muted mr-1">Note:</small>
                          <small>{row.original.note}</small>
                        </Col>
                      )}
                    </Row>
                  </div>
                );
              }}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col xs={12} sm={9} md={9} lg={10}>
            <Pagination fetchNext={this.props.fetchData} meta={meta} />
          </Col>
          <Col xs={12} sm={3} md={3} lg={2}>
            <span className="float-right mr-3 disabled btn-link">
              {meta.totalRecords > 0 && `Total ${meta.totalRecords} record(s)`}
            </span>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withStyles(s)(WaitingListTable);
