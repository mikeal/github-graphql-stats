// fetch polyfill
global.fetch = require('node-fetch')
const pullRequests = require('./lib/pull-requests')

if (!process.env.GHTOKEN) throw new Error('Must set GHTOKEN env variable.')
const token = process.env.GHTOKEN


;(async () => {
  let states = ['MERGED', 'CLOSED']
  let labels = ['dns', 'aix']
  let opts = {token, states, labels, baseRefName: 'master'}
  let pulls = await pullRequests('nodejs/node', opts)
  console.log(pulls)
})()
