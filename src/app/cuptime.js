
const ping = require('ping').promise
const EventEmitter = require('events')

const constants = require('../commons/constants')
const network = require('../commons/network')
const monitors = require('../monitor')
const display = require('../cli/display-cli')

const pingNetworks = args => {
  const emitter = new EventEmitter()

  setInterval(async () => {

    for (const { name, host } of args.hosts) {
      let res
      try {
        res = await ping.probe(host)
      } catch (err) {
        // -- todo.
      }

      const networkName = await network.getName()

      emitter.emit('ping', {
        networkName,
        ...res
      })
    }

  }, args.interval)

  return emitter
}

// -- hack


const state = {
  snapshots: []
}

const aggregateStats = async (state, args) => {
  state.percentiles = monitors.latency.aggregate(state, args)

  const { packetLossPercent, packetLoss } = monitors.packetLoss.aggregate(state, args)

  state.packetLossPercent = packetLossPercent
  state.packetLoss = packetLoss


  state.networkIncidents = await monitors.networkIncidents.aggregate(state, args)
  state.networks = await monitors.network.aggregate(state, args)
}

/**
 * Update host statistics.
 *
 * @param {Object} state applciation state
 */
const updateHostStats = (state, args) => async (data) => {
  const snapshots = state.snapshots

  const snapshot = {
    host: data.host,
    network: data.networkName,
    time: data.time,
    timestamp: Date.now(),
    alive: data.alive
  }

  if (!data.alive) {
    snapshot.state = 'DEAD'
  } else if (data.time > constants.thresholds.show) {
    snapshot.state = 'SLOW'
  } else {
    snapshot.state = 'OK'
  }

  snapshots.push(snapshot)

  await aggregateStats(state, args)
  display.cli(state)
}

/**
 * The cuptime app's main function.
 *
 * @param {Object} rawArgs unprocessed arguments.
 *
 * @returns {Promise<>}
 */
const cuptime = async rawArgs => {
  const args = await cuptime.preprocess(rawArgs)
  const emitter = pingNetworks(args)

  emitter.on('ping', updateHostStats(state, args))
}

/**
 *
 * @param {Object} args
 */
cuptime.preprocess = args => {
  if (!args.hosts) {
    args.hosts = constants.hosts
  }

  return args
}

module.exports = cuptime
