import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import moment from 'moment';
import Table from '../../Table';
import s from './AppointmentsTable.css';
import Pagination from '../../Pagination';
import history from '../../../history';

const WAITING_LIST_STATUS = {
  0: <span className="badge badge-warning">Not Confirmed</span>,
  1: <span className="badge badge-success">Confirmed</span>,
  2: <span className="badge badge-danger">Canceled</span>,
  3: <span className="badge badge-success">Finished</span>,
  4: <span />,
};

class AppointmentsTable extends React.Component {
  _isMounted = false;

  state = {
    records: [],
    meta: {},
  };

  static contextTypes = {
    socket: PropTypes.object.isRequired,
  };

  componentDidMount() {
    this._isMounted = true;
    const { userId } = this.props;
    if (userId) {
      this.context.socket.emit('waitingList.get.appointments', userId);
      this.context.socket.on(
        `waitingList.get.appointments.${userId}`,
        this.onGetVisits,
      );
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (process.env.BROWSER) {
      this.context.socket.off(
        `waitingList.get.appointments.${this.props.userId}`,
        this.onGetVisits,
      );
    }
  }

  fetchNext = pageNumber => {
    this.context.socket.emit(
      'waitingList.get.appointments',
      this.props.userId,
      {
        page: pageNumber,
      },
    );
  };

  onGetVisits = data => {
    if (this._isMounted && data.records) {
      this.setState({
        records: data.records,
        meta: data.meta,
      });
      this.props.showTable('appointments');
    }
  };

  render() {
    const defaultPageSize = 2;
    const meta = this.state.meta || {};
    const pageSize = meta.pageSize || defaultPageSize;
    const columns = [
      {
        Header: 'Employees',
        accessor: 'active',
        className: 'text-center',
        minWidth: 150,
        sortable: false,
        Cell: props => {
          if (Array.isArray(props.original.employees)) {
            return props.original.employees.map(el => {
              if (el.username === 'Anyone')
                return (
                  <span
                    onClick={() => {
                      history.push(`/accounts/${el.id}`);
                    }}
                    key={el.username}
                    className="badge badge-success"
                  >
                    {el.username}
                  </span>
                );
              return (
                <span
                  onClick={() => {
                    history.push(`/accounts/${el.id}`);
                  }}
                  key={el.username}
                  className="badge badge-warning"
                >
                  {el.username}
                </span>
              );
            });
          }
        },
      },
      {
        Header: 'Scheduled For',
        accessor: 'apptStartTime', // String-based value accessors!
        sortable: false,
        minWidth: 200,
        // maxWidth: 120,
        className: 'text-center',
        Cell: props =>
          moment(props.original.apptStartTime).format(window.App.dateFormat),
      },
      {
        Header: 'Checked At',
        accessor: 'checkedAt', // String-based value accessors!
        sortable: false,
        minWidth: 200,
        // maxWidth: 120,
        className: 'text-center',
        Cell: props => {
          const updatedAt = moment(props.original.updatedAt).format(
            window.App.dateFormat,
          );
          const createdAt = moment(props.original.createdAt).format(
            window.App.dateFormat,
          );
          if (updatedAt !== createdAt) {
            return updatedAt;
          }
          return '-';
        },
      },
      {
        Header: 'Status',
        accessor: 'status', // String-based value accessors!
        sortable: false,
        minWidth: 120,
        maxWidth: 120,
        className: 'text-center',
        Cell: props => WAITING_LIST_STATUS[props.original.status],
      },
    ];
    return (
      <div>
        <Row>
          <Col>
            <Table
              getTdProps={(state, rowInfo, column, instance) => ({
                onClick: (e, handleOriginal) =>
                  history.push(`/waitingList/${rowInfo.original.id}`),
              })}
              data={this.state.records}
              noDataText="No walk-ins found"
              columns={columns}
              defaultPageSize={defaultPageSize}
              pageSize={pageSize}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col xs={12} sm={9} md={9} lg={10}>
            <Pagination
              pushHistory={false}
              fetchNext={this.fetchNext}
              meta={meta}
            />
          </Col>
          <Col xs={12} sm={3} md={3} lg={2}>
            <span className="disabled btn-link float-right">
              {meta.totalRecords > 0 &&
                `Total ${meta.totalRecords} appointments(s)`}
            </span>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withStyles(s)(AppointmentsTable);
