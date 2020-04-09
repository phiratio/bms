import React from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Queue from '../Queue';

const propTypes = {
  children: PropTypes.node,
};

const defaultProps = {};

class Aside extends React.Component {
  state = {
    activeTab: '1',
  };

  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
  }

  toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab,
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <Nav tabs>
          <NavItem
            style={{
              display: this.props.tabs.indexOf('queue') > -1 ? 'block' : 'none',
            }}
          >
            <NavLink
              className={classNames({ active: this.state.activeTab === '1' })}
              onClick={() => {
                this.toggle('1');
              }}
            >
              <i className="icon-hourglass" />
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={this.state.activeTab}>
          <TabPane
            tabId="1"
            style={{
              display: this.props.tabs.indexOf('queue') > -1 ? 'block' : 'none',
            }}
          >
            <Queue />
          </TabPane>
        </TabContent>
      </React.Fragment>
    );
  }
}

Aside.propTypes = propTypes;
Aside.defaultProps = defaultProps;

export default Aside;
