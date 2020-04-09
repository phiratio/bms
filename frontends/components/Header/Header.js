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
import { defineMessages, FormattedMessage } from 'react-intl';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Modal,
  ModalHeader,
  ModalBody,
  Nav,
  NavItem,
  NavLink,
  Col,
  Row,
  Button,
} from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faUser from '@fortawesome/fontawesome-free-solid/faUser';
import faCog from '@fortawesome/fontawesome-free-solid/faCog';
import faLock from '@fortawesome/fontawesome-free-solid/faLock';
import _ from 'lodash';
import {
  AppAsideToggler,
  AppHeaderDropdown,
  AppNavbarBrand,
  AppSidebarToggler,
} from '../CoreUI';
import s from './Header.css';
import history from '../../history';
import Avatar from '../Avatar';
import LanguageSwitcher from '../LanguageSwitcher';
import { clearCacheStorage, uninstallServiceWorker } from '../../core/utils';

const messages = defineMessages({
  Account: {
    id: 'Account',
    defaultMessage: 'Account',
  },
  Profile: {
    id: 'Profile',
    defaultMessage: 'Profile',
  },
  Settings: {
    id: 'Settings',
    defaultMessage: 'Settings',
  },
  Tasks: {
    id: 'Tasks',
    defaultMessage: 'Tasks',
  },
  Messages: {
    id: 'Messages',
    defaultMessage: 'Messages',
  },
  Logout: {
    id: 'Logout',
    defaultMessage: 'Logout',
  },
  Languages: {
    id: 'Languages',
    defaultMessage: 'Languages',
  },
});

class Header extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  state = {
    settingsModal: false,
  };

  constructor(props) {
    super(props);
    this.uninstallServiceWorker = uninstallServiceWorker.bind(this);
    this.clearCacheStorage = clearCacheStorage.bind(this);
  }

  onSettingsClick = () => {
    this.setState({
      settingsModal: !this.state.settingsModal,
    });
  };

  render() {
    let soundNotificationIcon;
    if (this.props.audioContext && this.props.soundNotifications) {
      if (
        this.props.audioContext.state === 'suspended' ||
        this.props.soundNotifications === false
      ) {
        soundNotificationIcon = 'icon-volume-off';
      } else if (
        this.props.audioContext.state === 'running' ||
        this.props.soundNotifications === true
      ) {
        soundNotificationIcon = 'icon-volume-2';
      }
    }
    const user = this.props.currentUser;
    return (
      <React.Fragment>
        <Modal
          size="lg"
          fade={false}
          className="modal-primary"
          isOpen={this.state.settingsModal}
          toggle={this.onSettingsClick}
        >
          <ModalHeader toggle={this.toggle}>Settings</ModalHeader>
          <ModalBody>
            <Row>
              <div className="col-12 mb-3">
                Uninstall Service Worker
                <Button
                  color="link"
                  onClick={this.uninstallServiceWorker}
                  className="float-right"
                >
                  Uninstall
                </Button>
                <div>
                  <small className="text-muted">
                    Uninstalls service worker registered for this application
                  </small>
                </div>
              </div>
              <div className="col-12 mb-3">
                Clear Cache Storage
                <Button
                  color="link"
                  onClick={this.clearCacheStorage}
                  className="float-right"
                >
                  Clean
                </Button>
                <div>
                  <small className="text-muted">
                    Clears cache storage of the application
                  </small>
                </div>
              </div>
              <div className="col-12">
                Version
                <span className="text-muted float-right p-3">
                  {process.env.BROWSER && window.App.version}
                </span>
                <div>
                  <small className="text-muted">
                    Version of currently running application
                  </small>
                </div>
              </div>
            </Row>
          </ModalBody>
        </Modal>
        <AppSidebarToggler
          tabIndex={-1}
          className="d-lg-none"
          display="md"
          mobile
        />
        <AppSidebarToggler
          tabIndex={-1}
          className="d-md-down-none"
          display="lg"
        />
        {process.env.BROWSER && (
          <AppNavbarBrand
            full={{
              src: this.props.darkTheme ? '/logo-white.png' : '/logo.png',
              height: 23,
            }}
            minimized={{
              src: this.props.darkTheme ? '/logo-white.png' : '/logo.png',
              style: { marginLeft: '20px' },
              height: 23,
            }}
          />
        )}
        <Nav className="ml-auto" navbar>
          <NavItem className={s.volumeButton}>
            {this.props.audioContext && (
              <NavLink
                tabIndex={-1}
                href="#"
                id="toggleSoundNotifications"
                onClick={() => {
                  this.props.toggleSoundNotifications();
                }}
              >
                <i className={soundNotificationIcon} />
              </NavLink>
            )}
          </NavItem>
          <AppHeaderDropdown direction="down">
            <DropdownToggle nav tabIndex={-1}>
              {_.get(user, 'firstName') && (
                <Avatar
                  tabIndex={-1}
                  size={35}
                  name={`${user.firstName} ${user.lastName}`}
                  email={user.email}
                  facebookId={user.facebookId}
                  src={user.avatar}
                />
              )}
            </DropdownToggle>
            {this.props.showDropdownMenu && (
              <DropdownMenu right style={{ right: 'auto' }}>
                <DropdownItem header tag="div" className="text-center">
                  <strong>
                    <FormattedMessage {...messages.Account} />
                  </strong>
                </DropdownItem>
                <DropdownItem onClick={() => history.push('/profile')}>
                  <FontAwesomeIcon className="svgIcon" icon={faUser} />
                  <FormattedMessage {...messages.Profile} />
                </DropdownItem>
                <DropdownItem header tag="div" className="text-center">
                  <strong>
                    <FormattedMessage {...messages.Languages} />
                  </strong>
                </DropdownItem>
                <LanguageSwitcher />
                <DropdownItem divider />
                <DropdownItem onClick={this.onSettingsClick}>
                  <FontAwesomeIcon className="svgIcon" icon={faCog} />
                  <FormattedMessage {...messages.Settings} />
                </DropdownItem>
                <DropdownItem onClick={() => history.push('/logout')}>
                  <FontAwesomeIcon className="svgIcon" icon={faLock} />
                  <FormattedMessage {...messages.Logout} />
                </DropdownItem>
              </DropdownMenu>
            )}
          </AppHeaderDropdown>
        </Nav>
        <AppAsideToggler
          tabIndex={-1}
          style={{ display: this.props.enableAside ? 'block' : 'none' }}
          id="asideToggler"
          mobile
        />
      </React.Fragment>
    );
  }
}

export default withStyles(s)(Header);
