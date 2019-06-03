# WOL-Server
This tool starts up a server to wake up your machine by calling one of the routes.

## Why?
I wanted to be able to turn on and off my computer using amazon alexa. So I setup a Raspberry PI that stays on all of the time running [ha-bridge](https://github.com/bwssytems/ha-bridge) which then calls this server (which is also running on the raspberry pi). This allows me to turn on my computer using [`node_wake_on_lan`](https://github.com/agnat/node_wake_on_lan) and turn off my computer using [`stop-server`](https://github.com/typicode/stop-server) (which is running on the computer I want to turn off and on).

## How does it work?

After installing:
```sh
$ wol-server start
WOL Server now running on default port 3078
# The server is running on it's default port ready to accept requests
```

And I guess I do stop to stop it right? Yes.
```sh
$ wol-server stop
WOL Server stopped running
# The server is no longer running
```

I don't like that port though:
```sh
$ wol-server start --port 9000
WOL Server now running on port 9000
# The server is running on port 9000 ready to accept requests
```

I want this to run on startup!
```sh
sudo wol-server startup
WOL Server now runs on startup running
# The server will now restart on startup of the computer
# Sudo is required because the libary I'm using (pm2) requires it
```

Ok, I don't want it to run on startup anymore
```sh
sudo wol-server unstartup
WOL Server no longer runs on startup
# The server will now not restart on startup of the computer
```

## Install
```sh
npm install wol-server -g
```

## Usage
Once you have the server running you'll have the ability to use a few routes to trigger turning on and off the computer. Here are some useful ones:

### Turning on a computer with WOL Magic Packet

`http://localhost:3078/wake/AA:BB:CC:DD:EE:FF`

Where `AA:BB:CC:DD:EE:FF` is the Hardware MAC address of the computer you want to turn on (note WOL only works over ethernet).

### Turning off a computer that is running [`stop-server`](https://github.com/typicode/stop-server)

`http://localhost:3078/192.168.1.12/sleep`

To sleep the computer at `192.168.1.12` (which I found is the only way my machine will wake up to a WOL Magic Packet but your expierence may vary).

`http://localhost:3078/192.168.1.12/power-off`

To turn off the computer at the IP address `192.168.1.12` which you should definitely change.

### What to do with these URLs
Put them into [ha-bridge](https://github.com/bwssytems/ha-bridge) by:

  1. Creating a new device by going to "Home" > "Add/Edit" > "Add Bridge Device"
  2. Set "Type" to "HTTP Device" for "On Itmes", Put the wake URL in the "Target Item" section and make sure to click "Add" on the far right.
  3. Set "Type" to "HTTP Device" for "Off Itmes", Put the sleep or power-off URL in the "Target Item" section and make sure to click "Add" on the far right.

## All Routes
| URL | Query Params | Description | Sample |
| --- | ------------ | ----------- | ------ |
| `wake/:macAddress` | Any valid option for [`node_wake_on_lan`](https://github.com/agnat/node_wake_on_lan) ***(all optional)*** | Sends a WOL Magic packet to the computer at `:macAddress` | `localhost:3078/wake/AA:BB:CC:DD:EE:FF` |
| `/wake` | Same as above | Does the same as above but uses `WOL_SERVER_MAC_ADDRESS_TO_WAKE` environment variable as the macAddress | `localhost:3078/wake` |
| `/:ipAddress/:action` | None | Used to perform `sleep` or `power-off` on [`stop-server`](https://github.com/typicode/stop-server) instance | `localhost:3078/192.168.1.12/sleep` |
| `/remote/:action` |  `url` defaults to `WOL_SERVER_POWER_OFF_URL` environment variable if set will override all other options and send a request to that URL, `ip` the IP address to make the call to, `port` the port to make the call to on the IP defaults to `5709`, `method` the http verb method to make the call with defaults to `post` | This is call can be used to make a call to any URL | `localhost:3078/remote/sleep?ip=192.168.1.10&port=5709` |
| `/healthcheck` | None | Used to test whether the server is currently running or not | `localhost:3078/healthcheck` |
