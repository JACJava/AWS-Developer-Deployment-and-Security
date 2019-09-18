const User = require('./lib/mock').User
const UserFavorite = require('./lib/mock').UserFavorite
const hamsters = require('./hamsters')
const crypto = require('crypto')

const algorithm = 'aes-256-ctr'
const secret = 'this-is-a-bad-secret'

function authenticate (username, password) {
  return new Promise((resolve, reject) => {
    User.findOne({ where: { username } })
      .then(user => {
        if (!user) return reject(new Error('User not found'))

        decrypt(user.password)
          .then(decryptedStored => {
            if (password !== decryptedStored) {
              return reject(new Error('Passwords do not match'))
            }
            resolve(user)
          })
      })
  })
}

function create (username, password) {
  return hashPassword(password)
    .then(hash => User.create({
      username,
      password: hash
    }))
}

function favorite (userId, hamsterId) {
  return UserFavorite.findAll({ where: { userId } })
    .then((favs) => {
      if (favs.length < 3) {
        return UserFavorite.create({
          userId,
          hamsterId
        })
      }
    })
}

function unfavorite (userId, hamsterId) {
  return UserFavorite.destroy({
    where: {
      userId,
      hamsterId
    }
  })
}

function get (userId) {
  const proms = [
    User.findOne({ where: { id: userId } }),
    UserFavorite.findAll({ where: { userId } })
  ]

  return Promise.all(proms)
    .then((results) => {
      const user = results[0]
      const hams = results[1].map((fav) => {
        return hamsters.get(fav.hamsterId)
      })

      if (!user) {
        throw new Error(`User not found. Looking for ${userId}`)
      }

      return Promise.all(hams)
        .then((hamsters) => {
          user.favorites = hamsters.map((ham) => {
            return {
              name: ham.name,
              id: ham.id,
              src: ham.src,
              rank: ham.rank,
              totalPoints: ham.totalPoints
            }
          })
        })
        .then(() => ({
          id: user.id,
          username: user.username,
          favorites: user.favorites
        }))
    })
}

function getAll () {
  return User.findAll({ attributes: ['id'] })
    .then((ids) => {
      return Promise.all(ids.map(id => get(id.id)))
    })
}

function hashPassword (password) {
  return new Promise((resolve, reject) => {
    encrypt(password)
      .then((hash) => resolve(hash))
      .catch(err => reject(err))
  })
}

function init () {
  const promises = [
    User.sync({ force: true })
      .then(() => {
        // Table created
        const promises = [
          create('ryan', 'pass'),
          create('susan', 'pass'),
          create('dan', 'pass'),
          create('michelle', 'pass')
        ]
        return Promise.all(promises)
      }),
    UserFavorite.sync({ force: true })
      .then(() => {
        const promises = [
          favorite(1, 1),
          favorite(1, 2),
          favorite(1, 3),
          favorite(2, 4),
          favorite(2, 5),
          favorite(2, 6),
          favorite(3, 1),
          favorite(3, 3),
          favorite(3, 5),
          favorite(4, 2),
          favorite(4, 4),
          favorite(4, 6)
        ]
        return Promise.all(promises)
      })
  ]

  return Promise.all(promises)
}

function encrypt (input) {
  return new Promise(resolve => {
    const cipher = crypto.createCipher(algorithm, secret)
    let encrypted = cipher.update(input, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    resolve(encrypted)
  })
}

function decrypt (input) {
  return new Promise(resolve => {
    const decipher = crypto.createDecipher(algorithm, secret)
    let decrypted = decipher.update(input, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    resolve(decrypted)
  })
}

module.exports = {
  authenticate,
  favorite,
  unfavorite,
  create,
  get,
  getAll,
  init
}
