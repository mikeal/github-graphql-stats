const apollo = require('apollo-client')
const tag = require('graphql-tag')

module.exports = (logins, token) => {
  if (typeof logins === 'string') logins = [logins]
  const networkInterface = apollo.createNetworkInterface({
    uri: 'https://api.github.com/graphql',
    opts: {
      headers: {
        Authorization: `bearer ${token}`,
        'User-Agent': 'stats-to-spreadsheet-v0.0.1'
      }
    }
  })
  const client = new apollo.ApolloClient({networkInterface})
  const users = {}

  let ret = (async () => {
    while (logins.length) {
      let login = logins.shift()
      let query = tag`
      query {
        user (login: "${login}") {
          company
          bio
          email
          createdAt
        }
      }
      `
      users[login] = await client.query({query})
    }
    return users
  })()
  return ret
}
