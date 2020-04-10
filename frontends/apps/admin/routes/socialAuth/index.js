import React from 'react';
import SocialAuth from './SocialAuth';
import { loggedIn } from '../../../../core/utils';
import LayoutAuth from '../../../../components/LayoutAuth';
import decode from "jwt-decode";
import cookies from "browser-cookies";
import {setUser} from "../../../../actions/user";
import BackendApi from "../../../../core/BackendApi";

async function action({
  store,
  showNotification,
  title,
  location,
  route,
  params,
  query,
}) {
  if (process.env.BROWSER && loggedIn(store.getState().user)) {
    return {
      redirect: query.redirect || localStorage.getItem('lastPath') || window.App.defaultRoute,
    };
  }

  switch (true) {
    case /token/.test(route.path):
      if (process.env.BROWSER) {
        if (!params.token) {
          return {
            redirect: '/login',
          };
        }
        // decode jwt token
        const decoded = decode(params.token);
        if (decoded) {
          const backendApi = new BackendApi(params.token);
          await backendApi
            .get('/accounts/profile/')
            .then(res => {
              cookies.set(window.App.tokenId, params.token, {
                secure: true,
                expires: 3000,
              });
              store.dispatch(setUser({ ...{exp: decoded.exp}, ...res.data }));
              return {
                redirect: query.redirect ? query.redirect : '/'
              }
            }).catch(e => {
              showNotification(e.message, 'error');
              console.error('Unable to get user profile', e.message);
              return {
                redirect: '/login',
              }
            });
          return {
            redirect: query.redirect ? query.redirect : '/',
          };
        }
        return {
          redirect: '/login',
        };
      }
      return {
        chunks: ['socialAuth'],
        title,
        component: (
          <LayoutAuth location={location}>
            <React.Fragment />
          </LayoutAuth>
        ),
      };
    case /connect/.test(route.path):
      if (process.env.BROWSER) {
        if (params.provider) {
          window.location.replace(
            `${window.App.apiUrl}/connect/${params.provider}`,
          );
        }
      }
      return {
        redirect: '/login',
      };
    case /callback/.test(route.path):
      if (!params.provider || !query.access_token) {
        return {
          redirect: '/login',
        };
      }

      return {
        chunks: ['socialAuth'],
        title: route.title,
        component: (
          <LayoutAuth location={location}>
            <SocialAuth route={route} query={query} />
          </LayoutAuth>
        ),
      };
    default:
      return {
        chunks: ['socialAuth'],
        title,
        component: (
          <LayoutAuth location={location}>
            <React.Fragment />
          </LayoutAuth>
        ),
      };
  }
}

export default action;
