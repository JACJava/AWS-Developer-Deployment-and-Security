const Promise = require('bluebird')
const { resolveRace } = require('./resolution')
const races = require('../data/races')
const hamsters = require('../data/hamsters')

function start () {
  return new Promise((resolve) => {
    races.getAll()
      .then((allRaces) => {
        Promise
          .each(allRaces, (race) => {
            return new Promise((resolve, reject) => {
              resolveRace(race)
                .then((results) => {
                  console.log(results)
                  resolve()
                })
            })
          })
          .then(() => {
            console.log('All races complete')
            resolve()
          })
      })
  })
}

function reset () {
  return new Promise((resolve) => {
    races.clearResults()
      .then(() => {
        console.log('Race results cleared')
        return hamsters.clearResults()
      })
      .then(() => {
        console.log('Hamster results cleared')
        resolve()
      })
  })
}

module.exports = {
  start,
  reset
}
