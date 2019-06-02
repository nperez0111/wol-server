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
      $ wol-server start
      > WOL Server now running on default port 3078

      $ wol-server start --port 9000
      > WOL Server now running on port 9000

      $ wol-server stop
      > WOL Server stopped running

      $ sudo wol-server startup
      > WOL Server now runs on startup running

      $ sudo wol-server unstartup
      > WOL Server no longer runs on startup
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

if (cli.input.length === 0) {
  return cli.showHelp()
}

const [startOrStop] = cli.input
pm2.connect(function(err) {
  if (err) {
    console.error(err)
    process.exit(2)
  }
  if (startOrStop === 'start') {
    pm2.start(
      __dirname + '/index.js',
      {
        scriptArgs: [cli.flags.port]
      },
      (err, app) => {
        console.log(app)
        pm2.disconnect()
        if (err) {
          if (Array.isArray(app) && app.length) {
            return console.log('Server is already running')
          }
          return console.error('Unable to start server')
        }
      }
    )
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
