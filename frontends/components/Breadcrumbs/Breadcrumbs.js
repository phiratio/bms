/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import { defineMessages } from 'react-intl';
import { Breadcrumb, BreadcrumbItem } from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import history from '../../history';
import Link from '../Link';
import { setBreadcrumbs } from '../../actions/breadcrumbs';

const messages = defineMessages({
  Dashboard: {
    id: 'Dashboard',
    defaultMessage: 'Dashboard',
  },
});

// TODO: On mobile breadcrumbs do not look good. Add swiping only on breadcrumbs or disable breadcrumbs while on mobile
class Breadcrumbs extends React.Component {
  static contextTypes = {
    translate: PropTypes.func.isRequired,
    store: PropTypes.object.isRequired,
  };

  render() {
    const items = this.context.store.getState().breadcrumbs;
    const RootBreadCrumb =
      items.length !== 0 ? (
        <BreadcrumbItem>
          <Link to="/">{this.context.translate(messages.Dashboard)}</Link>
        </BreadcrumbItem>
      ) : (
        <BreadcrumbItem active tag="span">
          {this.context.translate(messages.Dashboard)}
        </BreadcrumbItem>
      );
    return (
      <div>
        <Breadcrumb tag="nav">
          <Link
            to="/"
            className="back-button"
            onClick={(e) => {
              history.go(-1);
              e.preventDefault();
            }}
          >
            <i className="icon-arrow-left" />
          </Link>
          {RootBreadCrumb}
          {items.map((item, i) => {
            if (items.length === i + 1) {
              // last item
              return (
                <BreadcrumbItem
                  key={`${item.path}${item.title}`}
                  active
                  tag="span"
                >
                  {this.context.translate(
                    { id: item.title, defaultMessage: item.title },
                    item.data,
                  )}
                </BreadcrumbItem>
              );
            }
            // Everything else
            return (
              <BreadcrumbItem key={`${item.path}${item.title}`}>
                <Link to={item.path}>
                  {this.context.translate(
                    { id: item.title, defaultMessage: item.title },
                    item.data,
                  )}
                </Link>
              </BreadcrumbItem>
            );
          })}
        </Breadcrumb>
      </div>
    );
  }
}

const mapState = state => ({
  breadcrumbs: state.breadcrumbs,
});

const mapDispatch = {
  setBreadcrumbs,
};

export default connect(
  mapState,
  mapDispatch,
)(Breadcrumbs);
