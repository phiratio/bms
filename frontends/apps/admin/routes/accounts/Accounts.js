import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Row,
} from 'reactstrap';
import _ from 'lodash';
import history from '../../../../history';
import AccountsTable from '../../../../components/Tables/AccountsTable';
import s from './Accounts.css';
import { validate } from '../../../../core/httpClient';
import ReloadButton from '../../../../components/ReloadButton';

class Accounts extends React.Component {
  state = {
    loading: false,
    fatchFailed: false,
    usersData: [],
    usersMeta: {},
    searchQuery: '',
  };

  _isMounted = false;

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    query: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.debounceOnChange = _.debounce(this.debounceOnChange.bind(this), 450); // debouncing function to 300 ms and bind this;
  }

  componentDidMount() {
    this._isMounted = true;
    this.fetchAccounts(this.context.query.page, this.context.query.search);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onChange(e) {
    this.setState({ searchQuery: e.target.value });
    this.debounceOnChange(e.target.value);
  }

  get baseURL() {
    const path = _.get(this.props, 'route.parent.path');

    if (path === '/accounts') {
      return path;
    }
    return `/accounts${path}`;
  }

  fetchAccounts = (page = '', search) => {
    if (this._isMounted) this.setState({ loading: true });
    const params = {
      ...(page && { page }),
      ...(search && { search }),
    };

    const query = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    this.context.httpClient
      .getData(`${this.baseURL}/${query && `?${query}`}`)
      .then(validate.bind(this))
      .then(data => {
        if (this._isMounted) {
          this.setState({
            ...(Array.isArray(data.users) && { usersData: data.users }),
            ...(data.meta && { usersMeta: data.meta }),
            ...(search && { searchQuery: search }),
          });
        }
      })
      .then(() => {
        if (this._isMounted) this.setState({ loading: false });
      })
      .catch(err => {
        if (this._isMounted) {
          if (err instanceof TypeError) {
            this.setState({ fetchFailed: true });
          }
          this.setState({ loading: false });
          Object.keys(err).forEach(key =>
            this.context.showNotification(err[key], 'error'),
          );
        }
      });
  };

  debounceOnChange(value) {
    this.fetchAccounts('', value);
  }

  render() {
    if (this.state.fetchFailed) {
      return <ReloadButton />;
    }
    return (
      <Row>
        <Col>
          <Card>
            <CardHeader>
              <h4>Accounts</h4>
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
            </CardHeader>
            <CardBody>
              <InputGroup>
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>
                    <i className="icon-magnifier" />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  type="text"
                  id="accountsSearch"
                  autoComplete="off"
                  name="search"
                  placeholder="Search"
                  value={this.state.searchQuery}
                  onChange={this.onChange}
                />
                <InputGroupAddon addonType="append">
                  <InputGroupText
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (this.state.searchQuery !== '') {
                        this.setState({ searchQuery: '' });
                        history.push('/accounts');
                      }
                    }}
                  >
                    <i className="icon-close" />
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <AccountsTable
                baseURL={this.baseURL}
                fetchData={this.fetchAccounts}
                loading={this.state.loading}
                data={this.state.usersData}
                meta={this.state.usersMeta}
                searchQuery={this.state.searchQuery}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default withStyles(s)(Accounts);
