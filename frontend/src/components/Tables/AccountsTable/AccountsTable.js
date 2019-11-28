import React from 'react';
import { Col, Row } from 'reactstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import faUser from '@fortawesome/fontawesome-free-solid/faUser';
import faCircle from '@fortawesome/fontawesome-free-solid/faCircle';
import Avatar from '../../Avatar';
import history from '../../../history';
import Table from '../../Table';
import s from './AccountsTable.css';
import Pagination from '../../Pagination';

class AccountsTable extends React.Component {
  columns = [
    {
      Header: <FontAwesomeIcon className={s.svgIcon} icon={faUser} />,
      accessor: 'avatar',
      className: 'text-center',
      Cell: props => (
        <Avatar
          size={45}
          name={`${props.original.firstName} ${props.original.lastName}`}
          email={props.original.email}
          src={props.value}
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
    },
    {
      Header: 'Last Name',
      accessor: 'lastName', // String-based value accessors!
    },
    {
      Header: 'Email',
      accessor: 'email',
      // Cell: props => <div>{props.value}</div>
    },
    {
      Header: (
        <div style={{ paddingBottom: '12px', paddingTop: '12px' }}>
          <FontAwesomeIcon className={s.svgIcon} icon={faCheck} />
        </div>
      ),
      accessor: 'confirmed',
      className: 'text-center',
      minWidth: 100,
      maxWidth: 100,
      resizable: false,
      Cell: props => (
        <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
          {props.value === true ? (
            <span className="badge badge-success">Confirmed</span>
          ) : (
            <span className="badge badge-warning">Not Confirmed</span>
          )}
        </div>
      ),
    },
    {
      Header: (
        <div style={{ paddingBottom: '12px', paddingTop: '12px' }}>
          <FontAwesomeIcon className={s.svgIcon} icon={faCircle} />
        </div>
      ),
      accessor: 'blocked',
      className: 'text-center',
      maxWidth: 75,
      minWidth: 75,
      resizable: false,
      Cell: props => (
        <div>
          {props.value === true ? (
            <span className="badge badge-danger">Blocked</span>
          ) : (
            <span className="badge badge-success">Active</span>
          )}
        </div>
      ),
    },
  ];

  render() {
    const { meta } = this.props;
    return (
      <div>
        <Row>
          <Col>
            <Table
              noDataText="No accounts found"
              getTrProps={(state, rowInfo, column) => ({
                onClick: () => {
                  history.push(`/accounts/${rowInfo.original.id}`);
                },
              })}
              loading={this.props.loading}
              data={this.props.data}
              columns={this.columns}
              defaultPageSize={10}
              pageSize={meta.pageSize}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col xs={10} md={9} lg={10}>
            <Pagination
              pushHistory
              meta={meta}
              fetchNext={this.props.fetchData}
              searchQuery={this.props.searchQuery}
            />
          </Col>
          <Col xs={2} md={3} lg={2}>
            <span className="disabled btn-link mr-2 float-right">
              {meta.totalRecords > 0 && `Total ${meta.totalRecords} account(s)`}
            </span>
          </Col>
        </Row>
      </div>
    );
  }
}

export default withStyles(s)(AccountsTable);
