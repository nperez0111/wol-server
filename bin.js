#!/usr/bin/env node
'use strict'
const meow = require('meow')
const pm2 = require('pm2')

const cli = meow(
  `
    Usage
      $ wol-server start|stop|startup|unstartup
 
    Options
      --port, -p  Specify a port to run the server on
 
    Examples
      $ wol-server start --port 3078
      WOL Server running on port 3078
`,
  {
    flags: {
      port: {
        type: 'number',
        alias: 'p'
      }
    }
  }
)
const [startOrStop] = cli.input
pm2.connect(function(err) {
  if (err) {
    console.error(err)
    process.exit(2)
  }
  if (startOrStop === 'start') {
    pm2.start('index.js', (err, app) => {
      pm2.disconnect()
      if (err) {
        if (Array.isArray(app) && app.length) {
          return console.log('Server is already running')
        }
        return console.error('Unable to start server')
      }
    })
  } else if (startOrStop == 'startup') {
    if (process.getuid() != 0) {
      pm2.disconnect()
      return console.log(
        'You have to run this as root to get startup to work properly:\n\n sudo wol-server startup'
      )
    }

    pm2.startup(
      undefined,
      {
        args: [
          {},
          {
            name() {
              return 'start'
            }
          }
        ]
      },
      (err, proc) => {
        pm2.disconnect()
        if (err) {
          if (!proc) {
            return console.log('Server was not running')
          }
          console.error('Unable to setup startup script for server')
        }
      }
    )
  } else if (startOrStop == 'unstartup') {
    if (process.getuid() != 0) {
      pm2.disconnect()
      return console.log(
        'You have to run this as root to get this to not run on startup:\n\n sudo wol-server unstartup'
      )
    }
    pm2.uninstallStartup(
      undefined,
      {
        args: [
          {},
          {
            name() {
              return 'start'
            }
          }
        ]
      },
      (err, proc) => {
        pm2.disconnect()
        if (err) {
          if (!proc) {
            return console.log('Server was not running')
          }
          console.error('Unable to stop startup script for server')
        }
      }
    )
  } else {
    pm2.stop('index', (err, proc) => {
      pm2.disconnect()
      if (err) {
        if (!proc) {
          return console.log('Server was not running')
        }
        return console.error('Unable to stop server')
      }
    })
  }
})
