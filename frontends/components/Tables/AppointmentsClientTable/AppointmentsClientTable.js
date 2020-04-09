import React from 'react';
import { Col, Row } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar';
import moment from 'moment';
import PropTypes from 'prop-types';
import Table from '../../Table';
import s from './AppointmentsClientTable.css';
import Pagination from '../../Pagination';
import history from '../../../history';
import { WAITING_LIST_STATUS_CANCELED } from '../../../constants';

const WAITING_LIST_STATUS = {
  0: <span className="badge badge-warning">Not Confirmed</span>,
  1: <span className="badge badge-success">Confirmed</span>,
  2: <span className="badge badge-danger">Canceled</span>,
  3: <span className="badge badge-success">Finished</span>,
  4: <span />,
};

class AppointmentsClientTable extends React.Component {
  state = {
    actionDropdown: false,
  };

  static contextTypes = {
    showNotification: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
  };

  columns = [
    {
      Header: <FontAwesomeIcon className="svgIcon" icon={faCalendar} />,
      accessor: 'apptStartTime', // String-based value accessors!
      sortable: false,
      minWidth: 80,
      maxWidth: 80,
      className: 'text-center',
      Cell: props => (
        <>
          <small className="text-muted">
            {moment(props.original.apptStartTime).format('MMM')}
          </small>
          <h5>{moment(props.original.apptStartTime).format('D')}</h5>
          <small className="text-muted">
            {moment(props.original.apptStartTime).format('YYYY')}
          </small>
          <br />
          <small className="text-muted">
            {moment(props.original.apptStartTime).format('hh:mm a')}
          </small>
        </>
      ),
    },
    {
      Header: 'Services / Employees',
      accessor: 'active',
      className: 'text-center',
      sortable: false,
      Cell: props => (
        <div className="text-left">
          <div>
            <span className="text-muted">Services: </span>
            {props.original.services.map(el => (
              <span key={el.name} className="badge badge-light">
                {el.name}
              </span>
            ))}
          </div>
          <span className="text-muted">Employee: </span>
          {Array.isArray(props.original.employees) &&
            props.original.employees.map(el => (
              <span key={el.username} className="badge badge-light">
                {el.username}
              </span>
            ))}
          {props.original.note && (
            <div className="text-muted">Note: {props.original.note}</div>
          )}
        </div>
      ),
    },
    {
      Header: <FontAwesomeIcon className="svgIcon" icon={faCheck} />,
      accessor: 'check', // String-based value accessors!
      sortable: false,
      minWidth: 80,
      maxWidth: 80,
      resizable: false,
      className: 'text-center',
      Cell: props => {
        let status = WAITING_LIST_STATUS[4];
        if (props.original.status === WAITING_LIST_STATUS_CANCELED) {
          status = WAITING_LIST_STATUS[2];
        } else if (props.original.check) {
          status = WAITING_LIST_STATUS[3];
        } else if (props.original.status !== null) {
          status = WAITING_LIST_STATUS[props.original.status];
        }
        return status;
      },
    },
  ];

  render() {
    const meta = this.props.meta || {};

    const pageSize = meta.pageSize || this.props.defaultPageSize;
    return (
      <div>
        <Row>
          <Col className="p-0">
            <Table
              noDataText="No records"
              getTdProps={(state, rowInfo) => ({
                onClick: () =>
                  history.push(`/appointments/${rowInfo.original._id}`),
              })}
              loading={this.props.loading}
              data={this.props.data}
              columns={this.columns}
              defaultPageSize={this.props.defaultPageSize}
              pageSize={pageSize}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col xs={12} sm={9} md={9} lg={10}>
            <Pagination fetchNext={this.props.fetchData} meta={meta} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default withStyles(s)(AppointmentsClientTable);
