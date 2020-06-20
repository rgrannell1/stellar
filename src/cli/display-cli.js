
const chalk = require('chalk')
const monitors = require('../monitor')

const display = {}

/**
 * Display the CLI header; this includes summary stats
 *
 * @param {Object} state
 */
display.cliHeader = state => {
  const failed = state.snapshots.filter(data => !data.alive).length
  let message = chalk.bold('cuptime') + ` --- ${state.packetLossPercent} failed (${failed} of ${state.snapshots.length} requests)`

  const mostRecent = state.snapshots[state.snapshots.length - 1]
  message += ` | currently ${mostRecent.state}`

  console.log(`${message}\n`)
}

display.heading = name => {
  console.log(chalk.bold(name))
}

/**
 * Display an interactive CLI containing network information.
 *
 * @param {Object} state the application state.
 */
display.cli = state => {
  let message = ''

  console.clear()
  monitors.networkIncidents.display(state)
  display.cliHeader(state)

  display.heading('Total Packet Loss')
  monitors.packetLoss.display(state)
  monitors.network.display(state)

  display.heading('Degraded Service')
  monitors.networkIncidents.display(state)
  display.heading('Latency & Jitter')

  for (const host of Object.keys(state.percentiles)) {
    monitors.latency.display(host, state.percentiles[host])
  }
}

module.exports = display
