import { merge } from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';

import {
  schema as IntlSchema,
  resolvers as IntlResolvers,
  queries as IntlQueries,
} from './graphql/Intl/schema';

import {
  schema as LayoutSchema,
  resolvers as LayoutResolvers,
  queries as LayoutQueries,
} from './graphql/Layout/schema';

const RootQuery = [
  `
  # # React-Starter-Kit Querying API
  # ### This GraphQL schema was built with [Apollo GraphQL-Tools](https://github.com/apollographql/graphql-tools)
  # _Build, mock, and stitch a GraphQL schema using the schema language_
  #
  # **[Schema Language Cheet Sheet](https://raw.githubusercontent.com/sogko/graphql-shorthand-notation-cheat-sheet/master/graphql-shorthand-notation-cheat-sheet.png)**
  #
  # 1. Use the GraphQL schema language to [generate a schema](https://www.apollographql.com/docs/graphql-tools/generate-schema.html) with full support for resolvers, interfaces, unions, and custom scalars. The schema produced is completely compatible with [GraphQL.js](https://github.com/graphql/graphql-js).
  # 2. [Mock your GraphQL API](https://www.apollographql.com/docs/graphql-tools/mocking.html) with fine-grained per-type mocking
  # 3. Automatically [stitch multiple schemas together](https://www.apollographql.com/docs/graphql-tools/schema-stitching.html) into one larger API
  type RootQuery {
    ${IntlQueries}
    ${LayoutQueries}
  }
`,
];

const SchemaDefinition = [
  `
  schema {
    query: RootQuery
  }
`,
];

// Merge all of the resolver objects together
// Put schema together into one array of schema strings
const resolvers = merge(IntlResolvers, LayoutResolvers);

const schema = [
  ...SchemaDefinition,
  ...RootQuery,
  ...IntlSchema,
  ...LayoutSchema,
];

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  ...(__DEV__ ? { log: e => console.error(e.stack) } : {}),
});
