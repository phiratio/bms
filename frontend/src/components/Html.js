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
import serialize from 'serialize-javascript';
import config from '../config';

/* eslint-disable react/no-danger */

class Html extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    styles: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        cssText: PropTypes.string.isRequired,
      }).isRequired,
    ),
    scripts: PropTypes.arrayOf(PropTypes.string.isRequired),
    // eslint-disable-next-line react/forbid-prop-types
    app: PropTypes.object.isRequired,
    children: PropTypes.string.isRequired,
  };

  static defaultProps = {
    styles: [],
    scripts: [],
  };

  render() {
    const { title, description, styles, scripts, app, children } = this.props;
    const isFireTV = app.userAgent && ( app.userAgent.match(/FireTV/) || app.userAgent.match(/Silk/) );
    return (
      <html className="no-js" lang={app.lang}>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <title>{title}</title>
          <meta name="description" content={description} />
          {
            (isFireTV) ? (
              <meta name="viewport" content="width=device-width, initial-scale=0.6, maximum-scale=0.6, minimum-scale=0.6 viewport-fit=cover" />
            ) : (
              <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            )
          }
          {scripts.map(script => (
            <link key={script} rel="preload" href={script} as="script" />
          ))}
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link
            rel="icon"
            type="image/png"
            href="/favicon-32x32.png"
            sizes="32x32"
          />
          <link
            rel="icon"
            type="image/png"
            href="/favicon-16x16.png"
            sizes="16x16"
          />
          <meta name="msapplication-TileColor" content={config.pwa.themeColor} />
          <meta name="theme-color" content={config.pwa.themeColor} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content={config.pwa.themeColor}
          />
          <meta
            name="apple-mobile-web-app-title"
            content={config.pwa.title}
          />
          <link
            href="/splashscreens/iphone5_landscape.png"
            media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/iphone5_portrait.png"
            media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/iphone6_landscape.png"
            media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/iphone6_portrait.png"
            media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/iphoneplus_landscape.png"
            media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/iphoneplus_portrait.png"
            media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/iphonex_landscape.png"
            media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/iphonex_portrait.png"
            media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/iphonexr_landscape.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/iphonexr_portrait.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/iphonexsmax_landscape.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/iphonexsmax_portrait.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/ipad_landscape.png"
            media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/ipad_portrait.png"
            media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/ipadpro1_landscape.png"
            media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/ipadpro1_portrait.png"
            media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/ipadpro3_landscape.png"
            media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/ipadpro3_portrait.png"
            media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link
            href="/splashscreens/ipadpro2_landscape.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation:landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/splashscreens/ipadpro2_portrait.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation:portrait)"
            rel="apple-touch-startup-image"
          />

          <link rel="apple-touch-icon" href="/icon.png" />
          <link rel="apple-touch-icon" sizes="72x72" href="/icon.png" />
          <link rel="apple-touch-icon" sizes="114x114" href="/icon.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/icon.png" />
          <link
            href="/theme/coreui/icons/simple-line-icons/css/simple-line-icons.css"
            rel="stylesheet"
          />
          <link href="/theme/coreui/style.css" rel="stylesheet" />
          {styles.map(style => (
            <style
              key={style.id}
              id={style.id}
              dangerouslySetInnerHTML={{ __html: style.cssText }}
            />
          ))}
        </head>
        <body className="app noselect">
          <div id="app" dangerouslySetInnerHTML={{ __html: children }} />
          <script
            dangerouslySetInnerHTML={{ __html: `window.App=${serialize(app)}` }}
          />
          {scripts.map(script => <script key={script} src={script} />)}
        </body>
      </html>
    );
  }
}

export default Html;
