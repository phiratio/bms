// @flow

import { ApolloClient } from 'apollo-client';
import { from, ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import apolloLogger from 'apollo-link-logger';
import createCache from './createCache';

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    // errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
  mutate: {
    fetchPolicy: 'no-cache',
    // errorPolicy: 'ignore',
  },
};

const link = from([
  onError(({ graphQLErrors, networkError, response, operation }) => {
    if (graphQLErrors)
      if (typeof graphQLErrors === 'string') {
        // TODO: dispatch notitifacion
      } else {
        graphQLErrors.map(({ message, locations, path }) =>
          console.warn(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
          ),
        );
      }

    if (networkError) console.warn(`[Network error]: ${networkError}`);
  }),
  ...(__DEV__ ? [apolloLogger] : []),
  new HttpLink({
    uri: '/graphql',
    credentials: 'include',
  }),
]);

const cache = createCache();

export default function createApolloClient() {
  return new ApolloClient({
    link,
    cache: cache.restore(window.App.apolloState),
    queryDeduplication: true,
    connectToDevTools: true,
    defaultOptions,
  });
}
