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
const defaultPowerOffPort = 5709
app.get('/power-off', (req, res) => {
  const {
    query: {
      url = process.env.WOL_SERVER_POWER_OFF_URL,
      ip,
      port = defaultPowerOffPort,
      method = 'post'
    },
    body: data
  } = req

  axios({
    method,
    url: url || `http://${ip}:${port}/power-off`,
    data
  })
    .then(() => {
      res.status(200).json({ ok: true, status: 'complete' })
    })
    .catch(() => {
      res.status(500).json({ ok: false, status: "Couldn't turn off computer" })
    })
})

app.get('/power-off/:ipAddress', (req, res) => {
  const {
    params: { ipAddress, port = defaultPowerOffPort }
  } = req

  axios
    .post(`http://${ipAddress}:${port}/power-off`)
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
  const port = 3078
  module.exports({ port })
}
