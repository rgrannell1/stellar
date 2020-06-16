
const fs = require('fs')
const chalk = require('chalk')
const ping = require('ping').promise
const EventEmitter = require('events')

const constants = require('../commons/constants')
const network = require('../commons/network')

const monitors = {
  packetLoss: require('../monitor/packet-loss'),
  networkIncidents: require('../monitor/network-incidents'),
  network: require('../monitor/network'),
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

// -- hack


const getState = () => {
  const fs = require('fs')

  try {
    const content = fs.readFileSync('.cuptime-state.json')
    return JSON.parse(content.toString())
  } catch (err) {
    return {
      snapshots: []
    }
  }
}

const state = getState()

process.on('SIGINT', function () {
  fs.writeFileSync('.cuptime-state.json', JSON.stringify(state))
  process.exit(0)
})

const aggregateStats = (state, args) => {
  state.percentiles = monitors.latency.aggregate(state, args)

  const { packetLossPercent, packetLoss } = monitors.packetLoss.aggregate(state, args)

  state.packetLossPercent = packetLossPercent
  state.packetLoss = packetLoss


  state.networkIncidents = monitors.networkIncidents.aggregate(state, args)
  state.networks = monitors.network.aggregate(state, args)
}

/**
 * Update host statistics.
 *
 * @param {Object} state applciation state
 */
const updateHostStats = (state, args) => (data) => {
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
  monitors.networkIncidents.display(state)
  const failed = state.snapshots.filter(data => !data.alive).length
  console.log(chalk.bold('cuptime') + ` --- ${state.packetLossPercent} failed (${failed} of ${state.snapshots.length} requests)`)
  console.log('')

  console.log(chalk.bold('Total Packet Loss'))
  monitors.packetLoss.display(state)
  monitors.network.display(state)

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
