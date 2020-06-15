
const chalk = require('chalk')
const constants = require('../commons/constants')

const latency = {}

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

latency.display = (host, hostData) => {
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

module.exports = latency
