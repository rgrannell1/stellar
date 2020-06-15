
const chalk = require('chalk')
const ping = require('ping').promise
const wifiName = require('wifi-name')
const EventEmitter = require('events')
const percentile = require("percentile")
const stats = require('stats-lite')

const { Table } = require('console-table-printer')

const constants = require('../commons/constants')

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

const cuptime = async rawArgs => {
  const args = await cuptime.preprocess(rawArgs)
  const emitter = pingNetworks(args)

  emitter.on('ping', updateHostStats(state, args))
}

const pad = str => {
  return str.padEnd(8)
}

const addEntry = num => {
  let str
  if (num < 60) {
    str = chalk.green(num.toString())
  } else if (num < 100) {
    str = chalk.yellow(num.toString())
  } else if (Number.isNaN(num)) {
    str = chalk.black('-')
  } else {
    str = chalk.red(num.toString())
  }

  // -- why does 18 work? ANSI sequences.
  return str.padEnd(18)
}

const addJitter = num => {
  let str
  if (num < 30) {
    str = chalk.green(num)
  } else if (num < 40) {
    str = chalk.yellow(num)
  } else {
    str = chalk.red(num)
  }

  return ('±' + str).padEnd(18)
}

const printPercentileTable = (host, hostData) => {
  const { percentiles } = hostData

  const hostDescription = constants.hosts.find(data => data.host === host).name

  console.log(`${hostDescription}: ${host}`)

  let message = ''
  // -- add table headings
  {
    let line = ''
    for (const header of ['period', 'p1', 'p5', 'p25', 'p50', 'p75', 'p95', 'p99', 'jitter']) {
      line += `${pad(header)}`
    }

    message += `${line}\n`
  }

  // -- add line entries
  for (const [timePeriod, entries] of Object.entries(percentiles)) {
    let line = pad(timePeriod)

    line += addEntry(entries.p1)
    line += addEntry(entries.p5)
    line += addEntry(entries.p25)
    line += addEntry(entries.p50)
    line += addEntry(entries.p75)
    line += addEntry(entries.p95)
    line += addEntry(entries.p99)
    line += addJitter(entries.jitter)

    message += line + '\n'
  }

  console.log(message)
}

const displayCli = state => {
  let message = ''

  const flo = {
    '1m': {
      p1: 1,
      p50: 1,
      p99: 1
    },
    '5m': {
      p1: 1,
        p50: 1,
        p99: 1
    }
  }

  console.clear()

  for (const host of Object.keys(state.percentiles)) {
    printPercentileTable(host, state.percentiles[host])
  }

  return
}

cuptime.preprocess = args => {
  if (!args.hosts) {
    args.hosts = constants.hosts
  }

  return args
}

module.exports = cuptime
