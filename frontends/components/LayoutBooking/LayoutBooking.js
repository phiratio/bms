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
import {Container, Button, Col, Row} from 'reactstrap';
import { connect } from 'react-redux';
import { Notifs } from 'redux-notification-center';
import normalizeCss from '../../node_modules/normalize.css/normalize.css';
import LoadingBar from 'react-redux-loading-bar';
import get from 'lodash.get';
import {
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarNav,
  AppSidebarMinimizer,
} from '../CoreUI';
import cookies from "browser-cookies";
import shortId from 'shortid';
import s from './LayoutBooking.css';
import history from '../../history';
import Header from '../HeaderBooking';
import { clearCacheStorage, uninstallServiceWorker } from '../../core/utils';
import Notification from '../Notification';
import { setUser } from '../../actions/user';
import { setLayoutBooking } from '../../actions/layoutBooking';
import BookingApi from '../../core/BookingApi';

class LayoutBooking extends React.Component {

  state = {
    leftSidebar: {
      items: this.defaultSidebarMenuItems,
    },
  };

  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    focus: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props);
    if (process.env.BROWSER) {
      this.BookingApi = BookingApi.bind(this);
      this.uninstallServiceWorker = uninstallServiceWorker.bind(this, true);
      this.clearCacheStorage = clearCacheStorage.bind(this, true);
    }
  }

  get defaultSidebarMenuItems() {
    return [
      {
        name: 'Back to Website',
        url: '/website',
        icon: 'icon-arrow-left',
        intl: {
          id: 'Back to Website',
        },
      },
      { title: true, name: 'Main Menu', intl: { id: 'Main Menu' } },
      {
        name: 'Book',
        url: '/book',
        icon: 'icon-calendar',
        intl: {
          id: 'Book an Appointment',
        },
      },
      {
        name: 'Contacts & Hours',
        url: '/contacts',
        icon: 'icon-notebook',
        intl: {
          id: 'Contacts',
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
    ]
  }

  get authenticatedSidebarMenuItems() {
    return [
      {
        name: 'Back to Website',
        url: '/website',
        icon: 'icon-arrow-left',
        intl: {
          id: 'Back to Website',
        },
      },
      { title: true, name: 'Main Menu', intl: { id: 'Main Menu' } },
      {
        name: 'Book',
        url: '/book',
        icon: 'icon-calendar',
        intl: {
          id: 'Book an Appointment',
        },
      },
      {
        name: 'My Appointments',
        url: '/appointments',
        icon: 'icon-clock',
        intl: {
          id: 'My Appointments',
        },
      },
      {
        name: 'Contacts & Hours',
        url: '/contacts',
        icon: 'icon-notebook',
        intl: {
          id: 'Contacts',
        },
      },
      { title: true, name: 'Account', intl: { id: 'Account' } },
      {
        name: 'Profile',
        url: '/profile',
        icon: 'icon-user',
        intl: {
          id: 'Profile',
        },
      },
      {
        name: 'Logout',
        url: '/logout',
        icon: 'icon-lock',
        intl: {
          id: 'Logout',
        },
      },
    ]
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

  setAuthenticatedSidebar = () => {
    this.setState({
      leftSidebar: {
        items: this.authenticatedSidebarMenuItems,
      }
    })
  };

  setDefaultSidebar = () => {
    this.setState({
      leftSidebar: {
        items: this.defaultSidebarMenuItems,
      }
    })
  };

  componentDidMount() {

    if (cookies.get('id_token') && !get(this.props, 'currentUser.id')) {
      history.push('/logout');
    }

    if (process.env.BROWSER) {
      this.BookingApi().fetchMeta().then(res => {
        this.context.store.dispatch(setLayoutBooking(res));
      });
    }

    if (get(this.props, 'currentUser.role.name') || get(this.props, 'currentUser.id')) {
      this.setAuthenticatedSidebar();
    }
  }

  render() {
    const { layoutBooking } = this.props;
    return (
      <React.Fragment>
        <LoadingBar className="loading" />
        <AppHeader fixed>
          <Header
            showSettingsMenuItem={false}
            showLanguagesMenuItem={false}
            showSoundNotificationIcon={false}
            enableAside={false}
            currentUser={this.props.currentUser}
          />
        </AppHeader>
        <Notifs
          className="notif__container notif__position__center"
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
            <Row className="mt-3 mb-3">
              <Col xs={12} className="text-center mt-2">
                {
                  process.env.BROWSER && (
                    <a href="#" onClick={e => { e.preventDefault(); window.location.replace(window.App.adminUrl) }}> <b>{"<<"}  Go to Admin Panel Demo</b></a>
                  )
                }
              </Col>
            </Row>
            <Container className="mt-2" fluid>{this.props.children}</Container>
            <Row className="mb-2">
              <Col xs={12} className="text-center mt-2">
                {
                  layoutBooking.socials && (
                    Object.keys(layoutBooking.socials).filter(el => !_.isEmpty(layoutBooking.socials[el])).map(el => <a key={shortId.generate()} target="_blank" href={layoutBooking.socials[el]}><img className="mr-1 ml-1" height={23} width={23} alt={el} src={`${window.App.staticFilesUrl}/icons/${el}.png`}/></a>)
                  )
                }
              </Col>
            </Row>
            <Row>
              <Col xs={12} className="text-center">By using this site you agree to <a href="#" onClick={e => { e.preventDefault(); history.push('/terms') }}>Terms of Service</a></Col>
            </Row>
            <Row>
              <Col xs={12} className="text-center mt-2">
                <a href="#" onClick={e => { e.preventDefault(); history.push('/contacts') }}>Contacts & Hours</a>
              </Col>
            </Row>
            {
              process.env.BROWSER && (
                <Row className="mb-4 mt-1">
                  <Col xs={12} className="text-center">
                    <a href="#" className="text-muted font-small" onClick={e => { e.preventDefault(); history.push('/app') }}>Version {window.App.version}</a>
                  </Col>
                </Row>
              )
            }
          </main>
        </div>
      </React.Fragment>
    );
  }
}

const mapState = state => ({
  currentUser: state.user,
  layoutBooking: state.layoutBooking,
});

const mapDispatch = {
  setUser,
};

export default connect(
  mapState,
  mapDispatch,
)(withStyles(normalizeCss, s)(LayoutBooking));
