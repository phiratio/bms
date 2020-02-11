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
import normalizeCss from 'normalize.css';
import LoadingBar from 'react-redux-loading-bar';
import get from 'lodash.get';
import shortId from 'shortid';
import s from './LayoutBooking.css';
import history from '../../history';
import Header from '../Header';
import { clearCacheStorage, uninstallServiceWorker } from '../../core/utils';
import Notification from '../Notification';
import RoundSpinner from '../SpinnerRound';
import { setUser } from '../../actions/user';
import { setLayoutBooking } from '../../actions/layoutBooking';
import BookingApi from '../../core/BookingApi';
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
      items: this.defaultSidebarMenuItems,
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
        name: 'Contacts & Hours',
        url: '/contacts',
        icon: 'icon-notebook',
        intl: {
          id: 'Contacts',
        },
      },
      {
        name: 'My Appointments',
        url: '/profile',
        icon: 'icon-clock',
        intl: {
          id: 'My Appointments',
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

    if (process.env.BROWSER) {
      this.BookingApi().fetchMeta().then(res => {
        this.context.store.dispatch(setLayoutBooking(res));
      });
    }

    if (get(this.props, 'currentUser.role.name')) {
      this.setAuthenticatedSidebar();
    }
  }

  render() {
    const { layoutBooking } = this.props;
    return (
      <div className="app">
        <button style={{color: '#fff', position: 'fixed'}}  tabIndex={1}/>
        <LoadingBar className={s.loading} />
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
          className={`${s.notif__container} ${
            s.notif__position__center
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
            <Row className="mb-2">
              <Col xs={12} className="text-center mt-2">
                {
                  layoutBooking.socials && (
                    layoutBooking.socials.map(el => <a key={shortId.generate()} href={el.href}><img className="mr-1 ml-1" height={23} width={23} alt={el.name} src={`${window.App.apiUrl}${el.img}`}/></a>)
                  )
                }
              </Col>
            </Row>
            <Row>
              <Col xs={12} className="text-center">By using this site you agree to <a href="#" onClick={() => history.push('/terms')}>Terms of Service</a></Col>
            </Row>
            <Row className="mb-4">
              <Col xs={12} className="text-center mt-2">
                <a href="#" onClick={() => history.push('/contacts')}>Contacts & Hours</a>
              </Col>
            </Row>
          </main>
        </div>
      </div>
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
