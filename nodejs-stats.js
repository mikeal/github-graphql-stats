// fetch polyfill
global.fetch = require('node-fetch')
const pullRequests = require('./lib/pull-requests')
const getUsers = require('./lib/get-users')
const uniq = require('lodash.uniq')
const csvWriter = require('csv-write-stream')

if (!process.env.GHTOKEN) throw new Error('Must set GHTOKEN env variable.')
const token = process.env.GHTOKEN

const companies = {
  jasnell: 'Nearform',
  cjihrig: 'Nearform',
  refack: 'Consultant',
  addaleax: 'Student',
  Trott: 'UCSF',
  mcollina: 'Nearform',
  mhdawson: 'IBM'
}
const allcommits = {}
const writer = csvWriter()
writer.pipe(process.stdout)

;(async () => {
  let pulls = await pullRequests('nodejs/node', token, 10)
  let people = pulls.map(pull => {
    let peeps = []
    let addPeeps = node => {
      if (node.author && node.author.login) peeps.push(node.author.login)
      if (node.editor && node.editor.login) peeps.push(node.editor.login)
      if (node.commits) {
        node.commits.nodes.forEach(commit => {
          commit = commit.commit
          if (!commit.committer.user) return
          allcommits[commit.oid] = commit.committer.user.login
        })
      }
    }
    addPeeps(pull)
    pull.reviews.nodes.forEach(addPeeps)
    return uniq(peeps)
  })

  let peopleMap = {}
  people.forEach(logins => {
    logins.forEach(login => {
      if (!peopleMap[login]) peopleMap[login] = {login, count: 0, commits: 0}
      peopleMap[login].count += 1
    })
  })
  Object.keys(allcommits).forEach(oid => {
    let login = allcommits[oid]
    if (!peopleMap[login]) peopleMap[login] = {login, count: 0, commits: 0}
    peopleMap[login].commits += 1
  })

  let allpeople = Object.keys(peopleMap)

  let userResults = await getUsers(allpeople, token)
  // Add user info to existing user keys.
  Object.keys(userResults).forEach(login => {
    let result = userResults[login]
    Object.assign(peopleMap[login], result.data.user)
    if (!peopleMap[login].company) {
      peopleMap[login].company = companies[login] || ''
    }
  })
  Object.keys(peopleMap).forEach(k => {
    let person = peopleMap[k]
    delete person.__typename
    person.percentage = ((person.count / 2000) * 100) + '%'
    writer.write(person)
  })
  writer.end()
})()
