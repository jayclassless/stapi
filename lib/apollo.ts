import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient as createSseClient } from 'graphql-sse'
import { createClient as createWsClient } from 'graphql-ws'

function browserOnly<T extends object>(name: string, factory: () => T): T {
  if (typeof window === 'undefined') {
    // Return a proxy that throws on any access — clearer than a null dereference
    return new Proxy({} as T, {
      get(_, prop) {
        if (prop === Symbol.toPrimitive || prop === 'then') return undefined
        throw new Error(`${name} is only available in the browser`)
      },
    })
  }
  return factory()
}

export const postClient = browserOnly('postClient', () => {
  return new ApolloClient({
    link: new HttpLink({ uri: '/graphql', credentials: 'include' }),
    cache: new InMemoryCache(),
  })
})

export const getClient = browserOnly('getClient', () => {
  return new ApolloClient({
    link: new HttpLink({ uri: '/graphql', credentials: 'include', useGETForQueries: true }),
    cache: new InMemoryCache(),
  })
})

export const wsClient = browserOnly('wsClient', () => {
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/graphql`
  const wsLink = new GraphQLWsLink(createWsClient({ url: wsUrl }))
  const httpLink = new HttpLink({ uri: '/graphql', credentials: 'include' })

  return new ApolloClient({
    link: split(
      ({ query }) => {
        const def = getMainDefinition(query)
        return def.kind === 'OperationDefinition' && def.operation === 'subscription'
      },
      wsLink,
      httpLink
    ),
    cache: new InMemoryCache(),
  })
})

export const sseClient = browserOnly('sseClient', () => {
  return createSseClient({ url: '/graphql/sse', credentials: 'include' })
})
