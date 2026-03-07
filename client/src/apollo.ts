import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient as createSseClient } from 'graphql-sse'
import { createClient as createWsClient } from 'graphql-ws'

const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/graphql`

export const postClient = new ApolloClient({
  link: new HttpLink({ uri: '/graphql', credentials: 'include' }),
  cache: new InMemoryCache(),
})

export const getClient = new ApolloClient({
  link: new HttpLink({ uri: '/graphql', credentials: 'include', useGETForQueries: true }),
  cache: new InMemoryCache(),
})

const wsLink = new GraphQLWsLink(createWsClient({ url: wsUrl }))
const httpLinkForWs = new HttpLink({ uri: '/graphql', credentials: 'include' })

export const wsClient = new ApolloClient({
  link: split(
    ({ query }) => {
      const def = getMainDefinition(query)
      return def.kind === 'OperationDefinition' && def.operation === 'subscription'
    },
    wsLink,
    httpLinkForWs
  ),
  cache: new InMemoryCache(),
})

export const sseClient = createSseClient({
  url: '/graphql/sse',
  credentials: 'include',
})
