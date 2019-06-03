const express = require('express')
const axios = require('axios')
const wol = require('wake_on_lan')
const bodyParser = require('body-parser')
const server = require('http').createServer()

const app = express()

app.use('/healthcheck', require('express-healthcheck')())

function wake(macAddress, options) {
  return new Promise((resolve, reject) => {
    try {
      wol.wake(macAddress, options, error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

app.use(bodyParser.urlencoded({ extended: true })).use(bodyParser.json())

app.get('/wake', (req, res) => {
  const { query: options } = req
  const macAddress = process.env.WOL_SERVER_MAC_ADDRESS_TO_WAKE

  wake(macAddress, options)
    .then(() => {
      res.status(200).json({ ok: true, status: 'complete' })
    })
    .catch(err => {
      res.status(500).json({
        ok: false,
        status: err.message || "Couldn't wake the computer"
      })
    })
})

app.get('/wake/:macAddress', (req, res) => {
  const {
    params: { macAddress },
    query: options
  } = req

  wake(macAddress, options)
    .then(() => {
      res.status(200).json({ ok: true, status: 'complete' })
    })
    .catch(err => {
      res.status(500).json({
        ok: false,
        status: err.message || "Couldn't wake the computer"
      })
    })
})
const DEFAULT_POWER_OFF_REMOTE_PORT = 5709
app.get('/remote/:action', (req, res) => {
  const {
    query: {
      url = process.env.WOL_SERVER_POWER_OFF_URL,
      ip,
      port = DEFAULT_POWER_OFF_REMOTE_PORT,
      method = 'post'
    },
    body: data,
    params: { action }
  } = req

  Promise.race([
    axios({
      method,
      url: url || `http://${ip}:${port}/${action}`,
      data
    }),
    new Promise(resolve => {
      setTimeout(resolve, 800)
    })
  ])
    .then(() => {
      res.status(200).json({ ok: true, status: 'complete' })
    })
    .catch(() => {
      res.status(500).json({ ok: false, status: "Couldn't turn off computer" })
    })
})

app.get('/:ipAddress/:action', (req, res) => {
  const {
    params: { ipAddress, action }
  } = req

  Promise.race([
    axios.post(
      `http://${ipAddress}:${DEFAULT_POWER_OFF_REMOTE_PORT}/${action}`
    ),
    new Promise(resolve => {
      setTimeout(resolve, 800)
    })
  ])
    .then(() => {
      res.status(200).json({ ok: true, status: 'complete' })
    })
    .catch(() => {
      res.status(500).json({ ok: false, status: "Couldn't turn off computer" })
    })
})

module.exports = ({ port }) => {
  server
    .on('request', app)
    .on('listening', function() {
      const addr = this.address()
      const bind =
        typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
      console.log(`WOL Server running on ${bind}`)
    })
    .on('error', function(error) {
      if (error.syscall !== 'listen') throw error
      const addr = this.address() || { port }
      const bind =
        typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
      switch (error.code) {
        case 'EACCES':
          console.error(`${bind} requires elevated privileges`)
          process.exit(1)
        case 'EADDRINUSE':
          console.error(`${bind} is already in use`)
          process.exit(1)
        default:
          throw error
      }
    })
    .listen(port)
}

if (!module.parent) {
  const port = (process.argv[2] && Number(process.argv[2])) || 3078
  module.exports({ port })
}
