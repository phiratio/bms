/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { createBrowserHistory } from 'history';

const historyObject = () => {
  const history = createBrowserHistory();
  return {
    ...history,
    push (path, state) {
      if (window.swUpdate) window.location.assign(window.location.href);
      return history.push(path, state);
    }
  }
};
// Navigation manager, e.g. history.push('/home')
// https://github.com/mjackson/history
export default process.env.BROWSER && historyObject();
