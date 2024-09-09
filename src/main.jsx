import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Chat from './ChatOption.jsx';
import { ApolloClient, InMemoryCache, ApolloProvider, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

const uploadLink = createUploadLink({
  uri: 'http://localhost:4000/graphql',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  uploadLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/chat",
    element: <Chat />,
  }
]);

createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <RouterProvider router={router} />
  </ApolloProvider>,
);
