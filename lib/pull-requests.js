const apollo = require('apollo-client')
const tag = require('graphql-tag')

module.exports = (name, token, count = 2000) => {
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
  const [owner, repo] = name.split('/')
  const pagesize = count > 100 ? 100 : count
  let pulls = []
  let cursor

  let ret = (async () => {
    while (pulls.length < count) {
      let qs = `first: ${pagesize}`
      if (cursor) qs += `, after: ${cursor}`
      let query = tag`
      query {
        repository(owner:"${owner}", name:"${repo}") {
          pullRequests(${qs}, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              author {login},
              editor {login},
              reviews(first: 100) {
                nodes {
                  author {login},
                  editor {login}
                }
              }
              commits(first: 100) {
                nodes {
                  commit {
                    oid
                    committer {
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              endCursor
            }
          }
        }
      }
      `
      let r = await client.query({query})
      cursor = r.data.repository.pullRequests.pageInfo.endCursor
      r.data.repository.pullRequests.nodes.forEach(n => pulls.push(n))
    }
    return pulls
  })()
  return ret
}
