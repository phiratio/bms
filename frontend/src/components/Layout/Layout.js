/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes, {instanceOf} from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Container, Button } from 'reactstrap';
import { connect } from 'react-redux';
import { Notifs, actions as notifActions } from 'redux-notification-center';
import cookies from 'browser-cookies';
// external-global styles must be imported in your JS.
import normalizeCss from 'normalize.css';
import LoadingBar from 'react-redux-loading-bar';
import { Howl } from 'howler';
import get from 'lodash.get';
import s from './Layout.css';
import Header from '../Header';
import Breadcrumbs from '../Breadcrumbs';
import history from '../../history';
import { clearCacheStorage, uninstallServiceWorker } from '../../core/utils';
import {
  AppAside,
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarMinimizer,
  AppSidebarNav,
} from '../CoreUI';
import Notification from '../Notification';
import Aside from '../Aside';
import RoundSpinner from '../SpinnerRound';
import { setUser } from '../../actions/user';

const { notifClear, notifSend, notifDismiss } = notifActions;

let cachedSidebarData = [];
if (typeof localStorage !== 'undefined') {
  const leftSidebarData = localStorage.getItem('leftSidebarData');
  const defaultLeftSidebar = [
    {
      name: 'Dashboard',
      url: '/',
      icon: 'icon-speedometer',
      intl: {
        id: 'Dashboard',
      },
    },
  ];
  cachedSidebarData = JSON.parse(leftSidebarData) || defaultLeftSidebar;
}

const KEYCODE_ARROW_LEFT = 37;
const KEYCODE_ARROW_UP = 38;
const KEYCODE_ARROW_RIGHT = 39;
const KEYCODE_ENTER = 13;
const KEYCODE_ESCAPE = 27;
const KEYCODE_ARROW_DOWN = 40;
const DO_NOT_REFRESH = false;
const DO_NOT_SHOW_NOTIFICATIONS = false;

class GridNavigator {
  divider = 4;
  focusClass = 'nav-focus';

  constructor() {
    // get currently active menu node
    this.current = this.activeNav || this.nav[0];
    if (this.current) {
      this.current.focus();
    }
  }

  get nav() {
    return document.getElementsByClassName('nav')[0].getElementsByClassName('nav-item');
  }

  get activeNav() {
    const activeNav = document.querySelectorAll('.sidebar .nav .nav-link.active');
    return activeNav.length > 0 && activeNav[0].parentNode;
  }

  get navGroups() {
    return document.getElementsByClassName('container-fluid')[0].getElementsByClassName('nav-group')
  }

  get nextNav() {
    return this.getNav('next');
  }

  get previousNav() {
    return this.getNav('previous');
  }

  blurFocused() {
    this.current.classList.remove(this.focusClass);
    this.current.blur();
    return this;
  }

  focus() {
    if (this.current instanceof HTMLElement) {
      this.current.classList.add(this.focusClass);
    }
    return this;
  }

  navGoDown() {
    this.current = this.nextNav;
    return this;
  }

  navGoUp() {
    this.current = this.previousNav;
    return this;
  }

  get inMenu() {
    return this.current.classList.contains('nav-item');
  }

  get inScrollMenu() {
    if (this.currentGroup)
      return this.currentGroup.classList.contains('nav-scroll') === true;
  }

  get inGroup() {
    return this.current.classList.contains('nav-group');
  }

  get navElements() {
    if (this.currentGroup)
      return this.currentGroup.getElementsByClassName('nav-element');
  }

  get currentElementIndex() {
    if (this.navGroups) {
      return [...this.navElements].indexOf(this.current)
    }
  }

  get startOfGroup() {
    return this.currentElementIndex === 0;
  }

  get nextGroupElement() {
    const nextElement = this.navElements[this.currentElementIndex + 1];
    if (nextElement) {
      return nextElement;
    }
  }

  get previousGroupElement() {
    const previousElement = this.navElements[this.currentElementIndex - 1];
    if (previousElement) {
      return previousElement;
    }
  }

  get currentNavGroupIndex() {
    return [].slice.call(this.navGroups).indexOf(this.currentGroup);
  }

  get nextNavGroup() {
    const next = this.navGroups[this.currentNavGroupIndex + 1];
    if (next) return next;
  }

  get previousNavGroup() {
    const previous = this.navGroups[this.currentNavGroupIndex - 1];
    if (previous) return previous;
  }

  get nextNavGroupElements() {
    if (this.nextNavGroup)
      return this.nextNavGroup.getElementsByClassName('nav-element');
  }

  get previousNavGroupElements() {
    if (this.previousNavGroup)
      return this.previousNavGroup.getElementsByClassName('nav-element');
  }

  get isFullscreen() {
    return document.body.classList.contains('fullscreen');
  }

  scrollLeft() {
    const direction = 1;
    const offset = 624;
    this.blurFocused();
    this.current = this.previousGroupElement;
    [...this.navElements].map((el, index) => {
      el.classList.remove('nav-first');
      if (index < this.currentElementIndex) {
        el.setAttribute('style', `transform: translate3d(${( (offset * (~direction+1)) * (this.currentElementIndex - index) ) - offset}px, 0px, 0px) scale(0.75); opacity: 0.5`);
      } else if (index === this.currentElementIndex) {
        el.classList.add('nav-first');
        el.setAttribute('style', `transform: translate3d(24px, 0px, 0px) scale(0.75); opacity: 0.5`);
      } else {
        el.setAttribute('style', `transform: translate3d(${(offset * direction)*(index - this.currentElementIndex)}px, 0px, 0px) scale(0.75); opacity: 0.5`);
      }
    });
    return this.focus();
  }

  scrollRight() {
    const direction = -1;
    const offset = 624;
    this.blurFocused();
    this.current = this.nextGroupElement;
    [...this.navElements].map((el, index, arr) => {
      el.classList.remove('nav-first');
      if (index < this.currentElementIndex) {
        el.setAttribute('style', `transform: translate3d(${(offset * direction) * (this.currentElementIndex - index)}px, 0px, 0px) scale(0.75); opacity: 0.5`);
      } else if (index === this.currentElementIndex) {
        el.classList.add('nav-first');
        el.setAttribute('style', `transform: translate3d(24px, 0px, 0px) scale(0.75); opacity: 0.5`);
        if (arr.length - 3  === index) {
          const lastElement = arr[arr.length - 1];
          lastElement instanceof HTMLElement && lastElement.classList.contains('more') && lastElement.click();
        }
      } else {
        el.setAttribute('style', `transform: translate3d(${(offset * (~direction + 1))*(index - this.currentElementIndex)}px, 0px, 0px) scale(0.75); opacity: 0.5`);
      }
    });
    return this.focus();
  }

  up() {
    if (this.inMenu && this.isFullscreen) {
      return this.right();
    }
    // if we are in menu
    if (this.current.classList.contains('nav-item') && this.previousNav) {
      return this.blurFocused().navGoUp().focus();
    } else if (this.previousNavGroup && this.previousNavGroupElements.length > 0) {
      this.currentGroup = this.previousNavGroup;
      this.blurFocused();
      this.current = this.navElements[0];
      return this.focus();
    } else if (!this.previousNavGroup && !this.current.classList.contains(this.focusClass)) {
      this.focus();
    }
  }

  down() {
    if (this.inMenu && this.isFullscreen) {
      return this.right();
    }
    // if we are in menu
    if (this.inMenu && this.nextNav) {
      return this.blurFocused().navGoDown().focus();
    } else if (this.nextNavGroup && this.nextNavGroupElements.length > 0) {
      this.currentGroup = this.nextNavGroup;
      this.blurFocused();
      const navFirst = [].slice.call(this.navElements).filter(el => el.classList.contains('nav-first'))[0];
      if (navFirst)
        this.current = navFirst;
      else
        this.current = this.navElements[0];

      return this.focus();
    } else if (!this.nextNavGroup && !this.current.classList.contains(this.focusClass)) {
      this.focus();
    }
  }

  right() {
    if (this.inMenu) {
      if (this.navGroups && this.navGroups[0]) {
        this.currentGroup = this.navGroups[0];
        this.blurFocused();
        this.current = this.navElements[0];
        return this.focus();
      }
    } else if (this.inScrollMenu && this.nextGroupElement) {
      return this.scrollRight();
    } else if (this.nextGroupElement) {
        this.blurFocused();
        this.current = this.nextGroupElement;
        return this.focus();
    }
  }

  left() {
    if (this.inMenu && this.isFullscreen) {
      return this.right();
    }
    if (!this.inMenu) {
      if (this.inScrollMenu && this.previousGroupElement) {
        return this.scrollLeft();
      } else if (this.startOfGroup && !this.isFullscreen) {
        this.blurFocused();
        this.current = this.activeNav;
        this.focus();
      } else if (this.previousGroupElement) {
        this.blurFocused();
        this.current = this.previousGroupElement;
        return this.focus();
      } else if (!this.previousGroupElement && !this.current.classList.contains(this.focusClass)) {
        this.focus();
      }
    }
  }

  getNav(direction) {
    let element = this.current[`${direction}ElementSibling`];
    if (element && this.current instanceof HTMLElement) {
      while (element.classList.value.indexOf("nav-title") > -1) {
        element = element[`${direction}ElementSibling`];
      }
      return element;
    }
  }

  goTo(path) {
    return history.push(path);
  }

  goToCurrentFocused() {
    const path = this.getHref(this.current);
    if (path) this.goTo(path);
    return this;
  }

  enter() {
    if (this.current instanceof HTMLElement && this.current.classList.contains(this.focusClass)) {
      if (this.inMenu) {
        return this.goToCurrentFocused();
      }
      // if current is input
      if (this.current.type === 'text') {
        this.current.focus();
      } else {
        this.current.click();
        if (this.currentNavGroupIndex === -1) {
          this.currentGroup = this.nextNavGroup;
          this.blurFocused();
          this.current = this.navElements[0];
          // return this.current.focus();
        }
      }
    }

    return this;
  }

  getHref(element) {
    if (element instanceof HTMLElement) {
      return get(element, 'children[0].attributes.href.value');
    }
  }

  loseActiveFocus() {
    if (this.current instanceof HTMLElement) {
      return this.current.classList.remove(this.focusClass);
    }
    return this;
  }

  get timeoutActiveFocus() {
    return setTimeout(() => this.loseActiveFocus(), 10000);
  }

}

class Layout extends React.Component {
  state = {
    pingInterval: null,
    retryTimeout: null,
    soundNotifications: false,
    leftSidebar: {
      items: cachedSidebarData,
    },
    aside: [],
    AudioContext: false,
  };

  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    httpClient: PropTypes.object.isRequired,
    showNotification: PropTypes.func.isRequired,
    focus: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props);
    if (process.env.BROWSER) {
      if (localStorage.getItem('dark-theme'))
        document.body.classList.add('dark-theme');
      context.socket.io.opts.query = `id_token=${cookies.get('id_token')}&version=${window.App ? window.App.version : ''}`;
      if (module.hot) {
        clearInterval(this.state.pingInterval);

        context.store.dispatch(notifClear());
        context.socket.disconnect();
      }
      if (!context.socket.connected) {
        context.socket.open();
      }

      const retryConnect = interval => {
        const retryTimeout = setTimeout(() => {
          if (!this.context.socket.connected) {
            const socket = this.context.socket.connect();
            if (!socket.connected) retryConnect(interval);
          }
        }, interval);
        this.setState({ retryTimeout });
      };
      this.setOffline = () => {
        this.context.store.dispatch(
          notifSend({
            id: 'reconnecting',
            message: (
              <React.Fragment>
                <RoundSpinner /> Reconnecting ...
              </React.Fragment>
            ),
            kind: 'warning',
            dismissAfter: 9000000,
          }),
        );
        retryConnect(4000);
      };
      this.setOnline = () => {
        this.context.store.dispatch(notifDismiss('reconnecting'));
      };
      this.pong = () => {
        // Can't use setState. It will force layout to rerender every iteration
        this.ping = Math.floor(new Date().getTime() / 1000);
      };
      this.setLayoutData = data => {
        if (data.user) {
          this.context.store.dispatch(
            setUser({ ...this.context.store.getState().user, ...data.user }),
          );
        }
        if (data.leftSidebar) {
          const { leftSidebar } = data;
          this.gridNavigator = new GridNavigator();
          this.setState({
            leftSidebar: { items: leftSidebar },
          });
          localStorage.setItem('leftSidebarData', JSON.stringify(leftSidebar));

          const lastPath = localStorage.getItem('lastPath');
          // const redirectIndex = leftSidebar.findIndex(el => {
          //   if (lastPath) return lastPath.indexOf(el.url);
          // });
          if (lastPath) {
            // if (!lastPath) {
            //   const firstUrlIndex = leftSidebar.findIndex(el =>
            //     Object.keys(el).indexOf('url'),
            //   );
            //   history.push(firstUrlIndex);
            // } else {
            // }
            history.push(lastPath);
          } else {
            history.push('/profile');
          }
        }

        if (data.aside) {
          this.setState({
            aside: data.aside,
          });

          const asideMenuShow = localStorage.getItem('asideMenuShow');

          if (Array.isArray(data.aside) && data.aside.length === 0) {
            document.body.classList.remove('aside-menu-show');
            localStorage.removeItem('asideMenuShow');
          } else if (window.innerWidth < 575) {
            document.body.classList.remove('aside-menu-show');
          } else if (asideMenuShow !== 'false') {
            document.body.classList.add('aside-menu-show');
          } else {
            document.body.classList.remove('aside-menu-show'); // We do not want aside to be shown on mobile
          }
        }
      };
      this.pong = this.pong.bind(this);
      this.setOffline = this.setOffline.bind(this);
      this.setOnline = this.setOnline.bind(this);
      this.setLayoutData = this.setLayoutData.bind(this);
      this.uninstallServiceWorker = uninstallServiceWorker.bind(this, DO_NOT_SHOW_NOTIFICATIONS);
      this.clearCacheStorage = clearCacheStorage.bind(this, DO_NOT_SHOW_NOTIFICATIONS);

      this.update = () => {
        this.uninstallServiceWorker();
        this.clearCacheStorage();
      };

      this.selfUpdate = () => {
        this.context.store.dispatch(
          notifSend({
            id: 'client.update',
            message: (
              <div onClick={this.update}>
                New version available <Button size="sm" className="float-right btn-warning mr-3 pt-0 pb-0">Update</Button>
              </div>
            ),
            kind: 'warning',
            dismissAfter: 9000000,
          }),
        );
      };

      this.pageRefresh = () => {
        if (process.env.BROWSER && 'reload' in location) {
          location.reload();
        }
      };

      this.sounds = {
        notifications: {
          mallet: new Howl({ src: ['/sounds/notification-mallet.ogg'] }),
          note: new Howl({ src: ['/sounds/notification-note.mp3'] }),
          welcome: new Howl({ src: ['/sounds/notification-welcome.ogg'] }),
          shopkeeper: new Howl({
            src: ['/sounds/notification-shopkeeper.ogg'],
          }),
          default: new Howl({ src: ['/sounds/notification-mallet.ogg'] }),
        },
      };
      context.socket.on('notifications.flash.success', message => {
        this.context.showNotification(message, 'success');
      });
      context.socket.on('notifications.flash.error', message => {
        this.context.showNotification(message, 'error');
      });
      context.socket.on('notifications.sound.play', soundName => {
        if (this.state.soundNotifications === true) {
          try {
            this.sounds.notifications[soundName].play();
          } catch (e) {
            this.sounds.notifications.default.play();
          }
        }
      });
    }
  }

  onKeyDownListener = event => {
    if (!this.gridNavigator) return;
    const { keyCode } = event;
    if (keyCode === KEYCODE_ARROW_LEFT ||
      keyCode === KEYCODE_ARROW_DOWN ||
      keyCode === KEYCODE_ARROW_UP ||
      keyCode === KEYCODE_ARROW_DOWN ||
      keyCode === KEYCODE_ARROW_RIGHT
    ) {
      event.preventDefault();
    }
  };

  onKeyUpListener = event => {
    if (!this.gridNavigator) return;
    const { keyCode } = event;
    if (keyCode === KEYCODE_ARROW_LEFT ||
      keyCode === KEYCODE_ARROW_DOWN ||
      keyCode === KEYCODE_ARROW_UP ||
      keyCode === KEYCODE_ARROW_DOWN ||
      keyCode === KEYCODE_ARROW_RIGHT
    ) {
      clearTimeout(this.loseActiveFocusTimeout);
      this.loseActiveFocusTimeout = this.gridNavigator.timeoutActiveFocus;
      event.preventDefault();
    }

    if (keyCode === KEYCODE_ARROW_DOWN) {
      this.gridNavigator.down();
    } else if (keyCode === KEYCODE_ARROW_UP) {
      this.gridNavigator.up();
    } else if (keyCode === KEYCODE_ARROW_LEFT) {
      this.gridNavigator.left();
    } else if (keyCode === KEYCODE_ARROW_RIGHT){
      this.gridNavigator.right();
     } else if (keyCode === KEYCODE_ENTER) {
      this.gridNavigator.enter();
    } else if (keyCode === KEYCODE_ESCAPE) {
      this.gridNavigator.loseActiveFocus();
    }

  };

  componentDidMount() {
    if (process.env.BROWSER) {
      if (!this.context.socket.connected) {
        this.setOffline();
      }
      const pingInterval = setInterval(() => {
        const now = Math.floor(new Date().getTime() / 1000);
        if (now - this.ping > 15) {
          this.context.socket.disconnect();
          clearInterval(this.state.pingInterval);
        }
      }, 15000);
      this.setState({ pingInterval });
      this.context.socket.on('disconnect', this.setOffline);
      this.context.socket.on('connect', this.setOnline);
      this.context.socket.on('pong', this.pong);
      this.context.socket.on('layout.data', this.setLayoutData);
      this.context.socket.on('client.update', this.selfUpdate);
      this.context.socket.on('client.refresh', this.pageRefresh);

      this.AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext ||
        window.oAudioContext ||
        window.msAudioContext;
      const audioContext = new this.AudioContextClass();
      const soundNotifications =
        window.App.notifications.sound === 'enabledIfBrowserAllows' &&
        audioContext.state === 'running'
          ? true
          : window.App.notifications.sound;
      this.setState({
        soundNotifications,
        AudioContext: audioContext,
      });
      const asideToggler = document.getElementById('asideToggler');
      if (asideToggler) {
        asideToggler.addEventListener('click', () => {
          localStorage.setItem(
            'asideMenuShow',
            localStorage.getItem('asideMenuShow') === 'false'
              ? 'true'
              : 'false',
          );
        });
      }
      // Allow keyboard navigation only on Fire Stick
      // Keyboard navigation is necessary only on TV
      if ((window.App.userAgent.match(/FireTV/) || window.App.userAgent.match(/Silk/))) {
        window.addEventListener('keyup', this.onKeyUpListener, false);
        window.addEventListener('keydown', this.onKeyDownListener, false);
      }
    }
  }

  componentWillUnmount() {
    clearInterval(this.state.pingInterval);
    clearTimeout(this.state.retryTimeout);
    clearTimeout(this.loseActiveFocusTimeout);
    this.context.socket.off('connect');
    this.context.socket.off('disconnect');
    this.context.socket.off('pong');
    this.context.socket.off('layout.data');
    this.context.socket.off('client.update');
    this.context.socket.off('client.refresh');
    this.context.socket.disconnect();
    window.removeEventListener('keyup', this.onKeyUpListener);
    window.removeEventListener('keydown', this.onKeyDownListener);

    if (process.env.BROWSER) {
      const body = document.getElementsByTagName("body")[0];
      body.classList.remove('aside-menu-show');
    }

  }

  toggleSoundNotifications = () => {
    if (process.env.BROWSER) {
      if (!this.state.AudioContext) {
        this.context.showNotification(
          'Web Audio API is not supported in this browser',
          'error',
        );
      }
      if (
        this.state.AudioContext.state === 'suspended' &&
        'ontouchstart' in window
      ) {
        this.state.AudioContext.resume();
      }
      if (this.state.AudioContext.state !== 'running') {
        this.setState({
          AudioContext: new this.AudioContextClass(),
          soundNotifications: !this.state.soundNotifications,
        });
      } else
        this.setState({ soundNotifications: !this.state.soundNotifications });
    }
  };

  render() {
    return (
      <div className="app">
        <button style={{color: '#fff', position: 'fixed'}}  tabIndex={1}/>
        <LoadingBar className={s.loading} />
        <AppHeader fixed>
          <Header
            toggleSoundNotifications={this.toggleSoundNotifications}
            soundNotifications={this.state.soundNotifications}
            showDropdownMenu={true}
            enableAside={this.state.aside.length !== 0}
            currentUser={this.props.currentUser}
            audioContext={
              this.state.AudioContext ? this.state.AudioContext : false
            }
          />
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
            <Breadcrumbs breadcrumbs={this.props.breadcrumbs} />
            <Container fluid>{this.props.children}</Container>
          </main>
          <AppAside fixed hidden>
            <Aside tabs={this.state.aside} />
          </AppAside>
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
)(withStyles(normalizeCss, s)(Layout));
