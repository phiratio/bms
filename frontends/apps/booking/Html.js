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
import config from './config';

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
    const isFireTV =
      app.userAgent &&
      (app.userAgent.match(/FireTV/) || app.userAgent.match(/Silk/));
    return (
      <html className="no-js" lang={app.lang}>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <title>{title}</title>
          <meta name="description" content={description} />
          {isFireTV ? (
            <meta
              name="viewport"
              content="width=device-width, initial-scale=0.6, maximum-scale=0.6, minimum-scale=0.6 viewport-fit=cover"
            />
          ) : (
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
            />
          )}
          {scripts.map(script => (
            <link key={script} rel="preload" href={script} as="script" />
          ))}
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="shortcut icon" href={`${app.staticFilesUrl}/pwa/favicon.ico`} />
          <link
            rel="icon"
            type="image/png"
            href={`${app.staticFilesUrl}/pwa/favicon-32x32.png`}
            sizes="32x32"
          />
          <link
            rel="icon"
            type="image/png"
            href={`${app.staticFilesUrl}/pwa/favicon-16x16.png`}
            sizes="16x16"
          />
          <meta
            name="msapplication-TileColor"
            content={config.pwa.themeColor}
          />
          <meta name="theme-color" content={config.pwa.themeColor} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content={config.pwa.themeColor}
          />
          <meta name="apple-mobile-web-app-title" content={config.pwa.title} />

          {/* iPhone 5 */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_5_splash.png"`}
            media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_5_splash_l.png"`}
            media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
            rel="apple-touch-startup-image"
          />

          {/* iPhone 6, 6S, 7 and 8 */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_6_splash.png`}
            media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_6_splash_l.png`}
            media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
            rel="apple-touch-startup-image"
          />

          {/* iPhone 6+, 7+ and 8+*/}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_plus_splash.png`}
            media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_plus_splash_l.png`}
            media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
            rel="apple-touch-startup-image"
          />

          {/* iPhone X */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhonex_splash.png`}
            media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhonex_splash_l.png`}
            media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
            rel="apple-touch-startup-image"
          />

          {/* iPhone Xr */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhonexr_splash.png`}
            media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
            rel="apple-touch-startup-image"
          />
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhonexr_splash_l.png`}
            media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />

          {/* iPhone Xs */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_xmax_splash.png`}
            media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPhone_xmax_splash_l.png`}
            media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
            rel="apple-touch-startup-image"
          />

          {/* Ipad */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPad_splash.png`}
            media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          {/* <link */}
          {/*  href={`${app.staticFilesUrl}/pwa/splashscreens/iPad_splash_l`} */}
          {/*  media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" */}
          {/*  rel="apple-touch-startup-image" */}
          {/* /> */}

          {/* Ipad Pro 1 */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPad_pro_1.png`}
            media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          {/* <link */}
          {/*  href={`${app.staticFilesUrl}/pwa/splashscreens/iPad_pro_1_l.png"`} */}
          {/*  media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" */}
          {/*  rel="apple-touch-startup-image" */}
          {/* /> */}

          {/* Ipad Pro 3 */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPad_pro_3.png`}
            media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          {/* <link */}
          {/*  href="/splashscreens/iPad_pro_3_l.png" */}
          {/*  media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" */}
          {/*  rel="apple-touch-startup-image" */}
          {/* /> */}

          {/* Ipad Pro 2 */}
          <link
            href={`${app.staticFilesUrl}/pwa/splashscreens/iPad_pro_2.png`}
            media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            rel="apple-touch-startup-image"
          />
          {/* <link */}
          {/*  href={`${app.staticFilesUrl}/pwa/splashscreens/iPad_pro_2_l.png"`} */}
          {/*  media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" */}
          {/*  rel="apple-touch-startup-image" */}
          {/* /> */}

          <link rel="apple-touch-icon" href={`${app.staticFilesUrl}/pwa/icon.png`} />
          <link rel="apple-touch-icon" sizes="72x72" href={`${app.staticFilesUrl}/pwa/icon.png`} />
          <link rel="apple-touch-icon" sizes="114x114" href={`${app.staticFilesUrl}/pwa/icon.png`} />
          <link rel="apple-touch-icon" sizes="144x144" href={`${app.staticFilesUrl}/pwa/icon.png`} />
          <link
            href="/theme/coreui/icons/simple-line-icons/css/simple-line-icons.min.css"
            rel="stylesheet"
          />
          <link href="/theme/coreui/style.min.css" rel="stylesheet" />
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
          {scripts.map(script => (
            <script key={script} src={script} />
          ))}
          <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.8.7/polyfill.min.js" integrity="sha256-025dcygmjSHGlBA5p7ahXH7XQU9g2+5y0iMdEayb2vM=" crossOrigin="anonymous" />
        </body>
      </html>
    );
  }
}

export default Html;
