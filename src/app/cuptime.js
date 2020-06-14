
const ping = require('ping').promise
const wifiName = require('wifi-name')
const EventEmitter = require('events')
const percentile = require("percentile")

const constants = require('../commons/constants')

const pingNetworks = args => {
  const emitter = new EventEmitter()

  setInterval(async () => {

    for (const { name, host } of args.hosts) {
      const res = await ping.probe(host)
      const networkName = await wifiName()

      emitter.emit('ping', {
        networkName,
        ...res
      })
    }

  }, args.interval)

  return emitter
}

const state = {
  snapshots: []
}

const fetchEntries = (diff, snapshots) => {
  return snapshots.filter(snapshot => {
    const isRecentEnough = true
    return isRecentEnough
  })
}

const aggregateStats = state => {
  // -- divide the dataset into time groups.
  for (const [name, value] of Object.entries(constants.bins)) {
    const entries = fetchEntries(value, state.snapshots)
    console.log(entries)
  }

}

/**
 * Update host statistics.
 *
 * @param {Object} state applciation state
 */
const updateHostStats = state => data => {
  const snapshots = state.snapshots
  snapshots.push({
    host: data.host,
    network: data.networkName,
    time: data.time,
    timestamp: Date.now()
  })

  aggregateStats(state)
}

const cuptime = async rawArgs => {
  const args = await cuptime.preprocess(rawArgs)
  const emitter = pingNetworks(rawArgs)

  emitter.on('ping', updateHostStats(state))
}

cuptime.preprocess = args => {
  if (!args.hosts) {
    args.hosts = constants.hosts
  }
}

module.exports = cuptime
