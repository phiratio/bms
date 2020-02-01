import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import moment from 'moment';
import Table from '../../Table';
import s from './ClientsTable.css';
import Pagination from '../../Pagination';
import get from "lodash.get";
import history from "../../../history";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faUser from "@fortawesome/fontawesome-free-solid/faUser";
import Avatar from "../../Avatar";

class ClientsTable extends React.Component {
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
      this.context.socket.emit('waitingList.get.clients', userId);
      this.context.socket.on(
        `waitingList.get.clients.${userId}`,
        this.onGetClients,
      );
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (process.env.BROWSER) {
      this.context.socket.off(
        `waitingList.get.clients.${this.props.userId}`,
        this.onGetClients,
      );
    }
  }

  fetchNext = pageNumber => {
    this.context.socket.emit('waitingList.get.clients', this.props.userId, {
      page: pageNumber,
    });
  };

  onGetClients = data => {
    if (this._isMounted && data.records.length > 0) {
      this.setState({
        records: data.records,
        meta: data.meta,
      });
      this.props.showTable('clients');
    }
  };

  render() {
    const defaultPageSize = 2;
    const meta = this.state.meta || {};
    const pageSize = meta.pageSize || defaultPageSize;
    const columns = [
      {
        Header: <FontAwesomeIcon className={s.svgIcon} icon={faUser} />,
        accessor: 'avatar',
        className: 'text-center',
        Cell: props => (
          <Avatar
            color="#3E83F8"
            size={45}
            src={get(props.original, 'user.avatar')}
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
        minWidth: 80,
        sortable: false,
        Cell: props => get(props.original, 'user.firstName', '-'),
      },
      {
        Header: 'Last Name',
        accessor: 'lastName', // String-based value accessors!
        sortable: false,
        minWidth: 130,
        Cell: props => get(props.original, 'user.lastName', '-'),
      },
      {
        Header: 'Joined',
        accessor: 'createdAt', // String-based value accessors!
        sortable: false,
        // minWidth: 120,
        // maxWidth: 120,
        className: 'text-center',
        Cell: props => {
          const date = moment(get(props.original, 'user.createdAt', '-'));
          if (date.isValid()) return date.format(window.App.dateFormat);
          return '-';
        },
      },
    ];
    return (
      <div>
        <Row>
          <Col>
            <Table
              data={this.state.records}
              noDataText="No clients found"
              columns={columns}
              defaultPageSize={defaultPageSize}
              pageSize={pageSize}
              getTdProps={(state, rowInfo, column, instance) => ({
                onClick: (e, handleOriginal) => {
                  if (rowInfo && column) {
                    if (
                      column.Header === 'First Name' ||
                      column.Header === 'Last Name'
                    ) {
                      if (get(rowInfo.original, 'user.id'))
                        history.push(`/accounts/${rowInfo.original.user.id}`);
                    }
                  }
                },
              })}
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
              {meta.totalRecords > 0 && `Total ${meta.totalRecords} client(s)`}
            </span>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withStyles(s)(ClientsTable);
