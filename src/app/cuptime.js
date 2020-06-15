
const chalk = require('chalk')
const asciichart = require('asciichart')
const ping = require('ping').promise
const EventEmitter = require('events')
const stats = require('stats-lite')

const constants = require('../commons/constants')
const network = require('../commons/network')

const monitors = {
  packetLoss: require('../monitor/packet-loss'),
  networkIncidents: require('../monitor/network-incidents'),
  latency: require('../monitor/latency')
}

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

const state = {
  snapshots: []
}

const fetchEntries = (diff, snapshots) => {
  return snapshots.filter(snapshot => {
    return snapshot.timestamp > (Date.now() - diff)
  })
}

const aggregateStats = (state, args) => {
  state.percentiles = monitors.latency.aggregate(state, args)
  state.packetLoss = monitors.packetLoss.aggregate(state, args)
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
    timestamp: Date.now(),
    alive: data.alive
  })

  aggregateStats(state, args)
  displayCli(state)
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
 * Display an interactive CLI containing network information.
 *
 * @param {Object} state the application state.
 */
const displayCli = state => {
  let message = ''

  console.clear()

  console.log('-------- cuptime -----------------------------------------------------------')
  console.log('')

  console.log(chalk.bold('Total Packet Loss'))
  monitors.packetLoss.display(state)

  console.log(chalk.bold('Degraded Service'))
  monitors.networkIncidents.display(state)
  console.log(chalk.bold('Latency & Jitter'))

  for (const host of Object.keys(state.percentiles)) {
    monitors.latency.display(host, state.percentiles[host])
  }
}

cuptime.preprocess = args => {
  if (!args.hosts) {
    args.hosts = constants.hosts
  }

  return args
}

module.exports = cuptime
