
const chalk = require('chalk')
const asciichart = require('asciichart')
const ping = require('ping').promise
const wifiName = require('wifi-name')
const EventEmitter = require('events')
const stats = require('stats-lite')

const constants = require('../commons/constants')

const monitors = {
  packetLoss: require('../monitor/packet-loss'),
  latency: require('../monitor/latency')
}

let previousNetwork
const getNetworkName = async () => {
  try {
    previousNetwork = await wifiName()
    return
  } catch (err) { }
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

      const networkName = await getNetworkName()


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
  state.percentiles = aggregateStats.percentiles(state, args)
  state.packetLoss = monitors.packetLoss.aggregate(state, args)
}


aggregateStats.percentiles = (state, args) => {
  const percentilesByHost = {}

  for (const { name, host } of args.hosts) {
    percentilesByHost[host] = {
      percentiles: {}
    }

    for (const [name, value] of Object.entries(constants.bins)) {
      const hostEntries = state.snapshots.filter(data => {
        return data.host === host
      })

      const entries = fetchEntries(value, hostEntries)

      const times = entries.map(data => data.time)

      percentilesByHost[host].percentiles[name] = {
        p1: Math.round(stats.percentile(times, 0.01)),
        p5: Math.round(stats.percentile(times, 0.05)),
        p25: Math.round(stats.percentile(times, 0.25)),
        p50: Math.round(stats.percentile(times, 0.50)),
        p75: Math.round(stats.percentile(times, 0.75)),
        p95: Math.round(stats.percentile(times, 0.95)),
        p99: Math.round(stats.percentile(times, 0.99)),
        jitter: Math.round(stats.stdev(times))
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

const addEntry = num => {
  let str
  if (num < 60) {
    str = chalk.green(num.toString())
  } else if (num < 100) {
    str = chalk.yellow(num.toString())
  } else if (Number.isNaN(num)) {
    str = chalk.red('!')
  } else {
    str = chalk.red(num.toString())
  }

  // -- why does 18 work? ANSI sequences.
  return str.padEnd(18)
}

const addJitter = num => {
  let str
  if (Number.isNaN(num)) {
    str = chalk.red('±' + '!')
  } else if (num < 30) {
    str = chalk.green('±' + num)
  } else if (num < 40) {
    str = chalk.yellow('±' + num)
  } else {
    str = chalk.red('±' + num)
  }

  // -- padding needed to compensate for ANSI
  return str.padEnd(17)
}

/**
 * Detect deviations from normal network behavior
 *
 * @param {Object} state
 */
const printNetworkIncidents = state => {

}

const displayCli = state => {
  let message = ''

  console.clear()

  console.log('-------- cuptime -----------------------------------------------------------')
  console.log('')

  console.log(chalk.bold('Total Packet Loss'))
  monitors.packetLoss.display(state)

  console.log(chalk.bold('Degraded Service'))
  printNetworkIncidents(state)
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
