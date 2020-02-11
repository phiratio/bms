/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './Home.css';
import history from '../../history';
import get from "lodash.get";
import Layout from "../../components/Layout";
import {loggedIn} from "../../core/utils";
import PropTypes from "prop-types";

class Home extends React.Component {

  static contextTypes = {
    store: PropTypes.object.isRequired,
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      const userLoggedIn = loggedIn(this.context.store.getState().user);
      const lastPath = localStorage.getItem('lastPath');
      switch (true) {
        case userLoggedIn && get(this.context.store.getState(), 'user.role.name') !== 'Client':
          if (lastPath) return history.push(lastPath);
          return history.push(window.App.defaultRoute);
        default:
          return history.push('/book');
      }
    }
  }

  render() {
    return (
      <div className={s.root}/>
    );
  }
}

export default withStyles(s)(Home);
