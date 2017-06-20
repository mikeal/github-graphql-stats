// fetch polyfill
global.fetch = require('node-fetch')
const pullRequests = require('./lib/pull-requests')

if (!process.env.GHTOKEN) throw new Error('Must set GHTOKEN env variable.')
const token = process.env.GHTOKEN

// ;(async () => {
//   let states = ['MERGED', 'CLOSED']
//   let labels = ['dns', 'aix']
//   let opts = {token, states, labels, baseRefName: 'master'}
//   let pulls = await pullRequests('nodejs/node', opts)
//   console.log(pulls)
// })()

const apollo = require('apollo-client')
const tag = require('graphql-tag')

const search = 'repo:nodejs/node is:pr 13823 13828'

module.exports = (name, opts) => {
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
  let query = tag`
  query {
    search (query: "${search}", type: ISSUE, first: 10) {
      nodes {
        ... on PullRequest {
          labels(first: 100) {
            nodes {
              name
            }
          }
          number
        }
      }
    }
  }
  `
  return (async () => {
    console.log('q')
    let r = await client.query({query})
    console.log(r.data.search)
  })()
}
module.exports()
