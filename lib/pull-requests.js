const apollo = require('apollo-client')
const tag = require('graphql-tag')

module.exports = (name, opts) => {
  if (!opts.token) throw new Error('Missing token')
  const networkInterface = apollo.createNetworkInterface({
    uri: 'https://api.github.com/graphql',
    opts: {
      headers: {
        Authorization: `bearer ${opts.token}`,
        'User-Agent': 'stats-to-spreadsheet-v0.0.1'
      }
    }
  })
  const count = opts.count || Infinity
  const client = new apollo.ApolloClient({networkInterface})
  const [owner, repo] = name.split('/')
  const pagesize = count > 100 ? 100 : count
  let baseqs = `first: ${pagesize}`
  if (opts.labels) {
    opts.labels = opts.labels.map(l => `"${l}"`)
    baseqs += `, labels: [${opts.labels.join(',')}]`
  }
  if (opts.states) {
    baseqs += `, states: [${opts.states.join(',').toUpperCase()}]`
  }
  if (opts.headRefName) baseqs += `, headRefName: "${opts.headRefName}"`
  if (opts.baseRefName) baseqs += `, baseRefName: "${opts.baseRefName}"`
  let pulls = []
  let cursor
  let response = opts.response || `
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
  `

  let ret = (async () => {
    while (pulls.length < count) {
      let qs = baseqs
      if (cursor) qs += `, after: "${cursor}"`
      let query = tag`
      query {
        repository(owner:"${owner}", name:"${repo}") {
          pullRequests(${qs}, orderBy: {field: UPDATED_AT, direction: DESC}) {
            ${response}
          }
        }
      }
      `
      let r = await client.query({query})
      cursor = r.data.repository.pullRequests.pageInfo.endCursor
      r.data.repository.pullRequests.nodes.forEach(n => pulls.push(n))
      if (r.data.repository.pullRequests.nodes.length < pagesize) {
        // Gathered all available data.
        return pulls
      }
    }
    return pulls
  })()
  return ret
}
