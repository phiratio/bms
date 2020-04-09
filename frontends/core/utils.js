import { AsYouType } from 'libphonenumber-js';
import {OFFLINE_CACHE_NAME} from "../constants";

const getFullPath = route => {
  let parent = '';
  if (route.parent) {
    parent = getFullPath(route.parent);
  }
  return parent + route.path;
};

// Replace parameter in  url (e.g. :id) to value of the parameter
const replaceParam = (path = '', params) => {
  let fullPath = path;
  if (typeof path === 'object') {
    fullPath = getFullPath(path);
  }
  return fullPath
    .split('/')
    .map(el => {
      if (el) {
        // check if element in route is a parameter
        if (el.charAt(0) === ':') {
          // if it is return value
          const param = el.substr(el.indexOf(':') + 1);
          return params[param];
        }
        // if it is not, jist return element
        return el;
      }
    })
    .join('/');
};

const getBreadcrumbs = (route, params, data = {}) => {
  const breadcrumbs = [];
  // If route is root, we do not need any breadcrumbs
  if (route.path === '/') return breadcrumbs;
  // If route was not found
  if (route.path === '(.*)') {
    breadcrumbs.push({
      title: route.title,
      path: route.path,
    });
    return breadcrumbs;
  }
  const constructBreadcrumbs = route => {
    const path = getFullPath(route);
    const { title } = route;
    const translatableTitle = title && title.match(/{(.*)}/);
    let breadCrumbData;
    if (title !== undefined && translatableTitle) {
      if (data.hasOwnProperty(translatableTitle[1])) {
        breadCrumbData = {
          [translatableTitle[1]]: data[translatableTitle[1]],
        };
      }
    }
    if (route.path) {
      if (translatableTitle && !breadCrumbData) {
      } else {
        breadcrumbs.push({
          title,
          ...(breadCrumbData && { data: breadCrumbData }),
          path: replaceParam(path, params),
        });
      }
    }
    if (route.parent) constructBreadcrumbs(route.parent);
  };
  constructBreadcrumbs(route);
  return breadcrumbs.reverse();
};

const loggedIn = user => {
  if (
    user != null &&
    user.id &&
    user.exp > Math.round(new Date().getTime() / 1000)
  )
    return true;
  return false;
};

const smoothScroll = {
  timer: null,

  stop() {
    clearTimeout(this.timer);
  },

  scrollTo(id, callback) {
    const settings = {
      duration: 1000,
      easing: {
        outQuint(x, t, b, c, d) {
          return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
        },
      },
    };
    let percentage;
    let startTime;
    const node = document.getElementById(id);
    const nodeTop = node.offsetTop;
    const nodeHeight = node.offsetHeight;
    const { body } = document;
    const html = document.documentElement;
    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
    );
    const windowHeight = window.innerHeight;
    const offset = window.pageYOffset;
    const delta = nodeTop - offset;
    const bottomScrollableY = height - windowHeight;
    const targetY =
      bottomScrollableY < delta
        ? bottomScrollableY - (height - nodeTop - nodeHeight + offset)
        : delta;

    startTime = Date.now();
    percentage = 0;

    if (this.timer) {
      clearInterval(this.timer);
    }

    function step() {
      let yScroll;
      const elapsed = Date.now() - startTime;

      if (elapsed > settings.duration) {
        clearTimeout(this.timer);
      }

      percentage = elapsed / settings.duration;

      if (percentage > 1) {
        clearTimeout(this.timer);

        if (callback) {
          callback();
        }
      } else {
        yScroll = settings.easing.outQuint(
          0,
          elapsed,
          offset,
          targetY,
          settings.duration,
        );
        window.scrollTo(0, yScroll);
        this.timer = setTimeout(step, 10);
      }
    }

    this.timer = setTimeout(step, 10);
  },
};

/**
 * Convert a base64 string in a Blob according to the data and contentType.
 *
 * @param b64Data {String} Pure base64 string without contentType
 * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
 * @param sliceSize {Int} SliceSize to process the byteCharacters
 * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 * @return Blob
 */
const b64toBlob = (b64Data, contentType, sliceSize) => {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

const normalizePhone = value => {
  if (!value) {
    return value;
  }

  return new AsYouType().input(value.startsWith('+') ? value : `+1${value}`);
};

/**
 * Uninstalls Service Worker
 */
const uninstallServiceWorker = function(showNotifications=true) {
  if (window.navigator && navigator.serviceWorker) {
    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
        if (showNotifications) this.context.showNotification('Service Worker uninstalled');
      })
      .catch(e => {
        this.context.showNotification(e.message, 'error');
      });
  } else {
    this.context.showNotification('Service Worker is not supported', 'error');
  }
};

/**
 * Clears Application Cache
 */
const clearCacheStorage = function(showNotifications=true, refresh=true) {
  caches
    .delete(OFFLINE_CACHE_NAME)
    .then(() => {
      if (showNotifications) this.context.showNotification('Cache cleared');
      if (refresh) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    })
    .catch(e => {
      this.context.showNotification(e.message, 'error');
    });
};

const followLink = (type, value) => window.location.assign(`${type}:${value}`);
const sendSmsLink = phoneNumber => followLink('sms', phoneNumber);
const sendEmailLink = email => followLink('mailto', email);
const callPhoneNumberLink = phoneNumber => followLink('tel', phoneNumber);

export {
  sendSmsLink,
  sendEmailLink,
  callPhoneNumberLink,
  normalizePhone,
  smoothScroll,
  loggedIn,
  replaceParam,
  getBreadcrumbs,
  b64toBlob,
  uninstallServiceWorker,
  clearCacheStorage,
};
