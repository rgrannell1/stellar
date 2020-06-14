
const ping = require('ping').promise
const wifiName = require('wifi-name')
const EventEmitter = require('events')

const constants = require('../commons/constants')

const pingNetworks = args => {
  const emitter = new EventEmitter()

  setInterval(async () => {

    for (const { name, host } of args.hosts) {
      const res = await ping.probe(host)
      const networkName = await wifiName()


      emitter.emit('aa', {})
      console.log(res)
    }

  }, args.interval)

  return emitter
}

const state = {]}

const cuptime = async rawArgs => {
  const args = await cuptime.preprocess(rawArgs)
  const emitter = pingNetworks(rawArgs)

  emitter.on('ping', data => {
    console.log(data)
  })
}

cuptime.preprocess = args => {
  if (!args.hosts) {
    args.hosts = constants.hosts
  }
}

module.exports = cuptime
