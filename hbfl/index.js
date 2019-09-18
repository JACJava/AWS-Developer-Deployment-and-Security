const Hapi = require('hapi')
const plugins = require('./plugins')
const routes = require('./routes')
const { init } = require('./lib/data/users')
const register = require('./lib/simulation/register')

const server = new Hapi.Server()
server.connection({ port: process.env.PORT || 3000 })

server.register(plugins, (err) => {
  if (err) throw err

  // hapi-auth-cookie stuff
  const cache = server.cache({
    segment: 'sessions',
    expiresIn: 3 * 24 * 60 * 60 * 1000
  })
  server.app.cache = cache

  server.ext('onPreHandler', (req, reply) => {
    req.info.acceptEncoding = null
    reply.continue()
  })

  server.auth.strategy('session', 'cookie', true, {
    password: 'password-should-be-32-characters',
    cookie: 'hbfl-sid',
    isSecure: false,
    validateFunc: function (request, session, callback) {
      cache.get(session.sid, (err, cached) => {
        if (err) {
          return callback(err, false)
        }

        if (!cached) {
          return callback(null, false)
        }

        return callback(null, true, cached.account)
      })
    }
  })

  // register routes
  server.route(routes)

  // initialize database and start server
  init()
  .then(() => {
    server.start((err) => {
      if (err) throw err
      console.log(`Server started at http://localhost:${server.info.port}`)
      register.listener()
    })
  })
})
