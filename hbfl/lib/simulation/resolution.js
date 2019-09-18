const arrayShuffle = require('array-shuffle')
const hamsters = require('../data/hamsters')
const races = require('../data/races')

function resolveRace (race) {
  return new Promise((resolve, reject) => {
    console.log(race)
    hamsters
      .getAll()
      .then((allHamsters) => {
        const results = arrayShuffle(allHamsters)
        race.results = results.map((hamster, i) => {
          return {
            place: i + 1,
            hamsterId: hamster.id,
            name: hamster.name
          }
        })
        races.put(race)
        resolve(results.map((hamster, i) => {
          hamster = addHamsterResults(hamster, race, i + 1)
          hamsters.put(hamster)
          return `${i + 1}: ${hamster.name}`
        }))
      })
  })
}

function addHamsterResults (hamster, race, place) {
  const result = {
    raceId: race.id,
    place,
    name: race.name,
    date: race.date
  }
  hamster.results = hamster.results || []
  hamster.results.push(result)
  return hamster
}

module.exports = { resolveRace }
