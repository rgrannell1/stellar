
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

const aggregateStats = (state, args) => {
  state.percentiles = aggregateStats.percentiles(state, args)


  console.log(state.percentiles)
}

aggregateStats.percentiles = (state, args) => {
  const percentilesByHost = {}

  for (const { name, host } of args.hosts) {
    percentilesByHost[host] = {
      percentiles: {}
    }

    for (const [name, value] of Object.entries(constants.bins)) {

      const entries = fetchEntries(value, state.snapshots.filter(data => data.host === host))
      const percentiles = percentile([1, 5, 25, 50, 75, 95, 99], entries.map(data => data.time))

      percentilesByHost[host].percentiles[name] = {
        p1: percentiles[0],
        p5: percentiles[1],
        p25: percentiles[2],
        p50: percentiles[3],
        p75: percentiles[4],
        p95: percentiles[5],
        p99: percentiles[6]
      }
    }
  }

  return percentilesByHost
}

/**
 * Update host statistics.
 *
 * @param {Object} state applciation state
 */
const updateHostStats = (state, args) => (data) => {
  const snapshots = state.snapshots
  snapshots.push({
    host: data.host,
    network: data.networkName,
    time: data.time,
    timestamp: Date.now()
  })

  aggregateStats(state, args)
}

const cuptime = async rawArgs => {
  const args = await cuptime.preprocess(rawArgs)
  const emitter = pingNetworks(args)

  emitter.on('ping', updateHostStats(state, args))
}

cuptime.preprocess = args => {
  if (!args.hosts) {
    args.hosts = constants.hosts
  }

  return args
}

module.exports = cuptime
