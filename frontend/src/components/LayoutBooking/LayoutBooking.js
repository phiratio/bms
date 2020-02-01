/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Container, Button } from 'reactstrap';
import { connect } from 'react-redux';
import { Notifs } from 'redux-notification-center';
import normalizeCss from 'normalize.css';
import LoadingBar from 'react-redux-loading-bar';
import s from './LayoutBooking.css';
import Header from '../Header';
import { clearCacheStorage, uninstallServiceWorker } from '../../core/utils';
import Notification from '../Notification';
import RoundSpinner from '../SpinnerRound';
import { setUser } from '../../actions/user';
import {
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarMinimizer,
  AppSidebarNav,
} from '../CoreUI';


class LayoutBooking extends React.Component {
  state = {
    leftSidebar: {
      items: [
        { title: true, name: 'Main Menu', intl: { id: 'Main Menu' } },
        {
          name: 'Book',
          url: '/book',
          icon: 'icon-calendar',
          intl: {
            id: 'Book an Appointment',
          },
        },
        { title: true, name: 'Account', intl: { id: 'Account' } },
        {
          name: 'Sign In',
          url: '/login',
          icon: 'icon-login',
          intl: {
            id: 'Sign In',
          },
        },
        {
          name: 'Create an Account',
          url: '/signup',
          icon: 'icon-user-follow',
          intl: {
            id: 'Create an Account',
          },
        },
      ],
    },
  };

  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    focus: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props);
    if (process.env.BROWSER) {
      this.uninstallServiceWorker = uninstallServiceWorker.bind(this, true);
      this.clearCacheStorage = clearCacheStorage.bind(this, true);
    }
  }

  update = () => {
    this.uninstallServiceWorker();
    this.clearCacheStorage();
  };

  pageRefresh = () => {
    if (process.env.BROWSER && 'reload' in location) {
      location.reload();
    }
  };

  setLayoutData = data => {
    if (data.user) {
      this.context.store.dispatch(
        setUser({ ...this.context.store.getState().user, ...data.user }),
      );
    }
    if (data.leftSidebar) {
      const { leftSidebar } = data;
      this.setState({
        leftSidebar: { items: leftSidebar },
      });
    }
  };

  render() {
    return (
      <div className="app">
        <button style={{color: '#fff', position: 'fixed'}}  tabIndex={1}/>
        <LoadingBar className={s.loading} />
        <AppHeader fixed>
          <Header/>
        </AppHeader>
        <Notifs
          className={`${s.notif__container} ${
            s.notif__position__bottom_right
          } `}
          CustomComponent={Notification}
        />
        <div className="app-body">
          <AppSidebar fixed minimized display="lg">
            <AppSidebarHeader />
            <AppSidebarForm />
            <AppSidebarNav navConfig={this.state.leftSidebar} {...this.props} />
            <AppSidebarFooter />
            <AppSidebarMinimizer />
          </AppSidebar>
          <main className="main">
            {/*<Breadcrumbs breadcrumbs={this.props.breadcrumbs} />*/}
            <Container className="mt-2" fluid>{this.props.children}</Container>
          </main>
        </div>
      </div>
    );
  }
}

const mapState = state => ({
  currentUser: state.user,
});

const mapDispatch = {
  setUser,
};

export default connect(
  mapState,
  mapDispatch,
)(withStyles(normalizeCss, s)(LayoutBooking));
