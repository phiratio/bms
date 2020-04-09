import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import moment from 'moment';
import Table from '../../Table';
import s from './WalkInsTable.css';
import Pagination from '../../Pagination';
import history from '../../../history';
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faUser from "@fortawesome/fontawesome-free-solid/faUser";
import Avatar from "../../Avatar";
import get from "lodash.get";

class WalkInsTable extends React.Component {
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
      this.context.socket.emit('waitingList.get.walkins', userId);
      this.context.socket.on(
        `waitingList.get.walkins.${userId}`,
        this.onGetWalkins,
      );
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (process.env.BROWSER) {
      this.context.socket.off(
        `waitingList.get.walkins.${this.props.userId}`,
        this.onGetWalkins,
      );
    }
  }

  fetchNext = pageNumber => {
    this.context.socket.emit('waitingList.get.walkins', this.props.userId, {
      page: pageNumber,
    });
  };

  onGetWalkins = data => {
    if (this._isMounted && data.records) {
      this.setState({
        records: data.records,
        meta: data.meta,
      });
      this.props.showTable('walkins');
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
        Header: 'Visited At',
        accessor: 'createdAt', // String-based value accessors!
        sortable: false,
        minWidth: 200,
        // maxWidth: 120,
        className: 'text-center',
        Cell: props =>
          moment(props.original.createdAt).format(window.App.dateFormat),
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
    ];
    return (
      <div>
        <Row>
          <Col>
            <Table
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
              {meta.totalRecords > 0 && `Total ${meta.totalRecords} walk-in(s)`}
            </span>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withStyles(s)(WalkInsTable);
