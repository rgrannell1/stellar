
const chalk = require('chalk')

const asciichart = require('asciichart')

const constants = require('../commons/constants')

const packetLoss = {}

const sum = (a, b) => a + b

packetLoss.aggregate = (state, args) => {
  const bins = {}
  for (const { host } of constants.hosts) {
    bins[host] = [{
      host,
      elems: [],
      packetLoss: 1
    }]

    const hostSnapshots = state.snapshots.filter(data => data.host === host)
    const binSize = Math.ceil(hostSnapshots.length / 30)

    for (let ith = 0; ith < hostSnapshots.length; ith += binSize) {
      let elems = hostSnapshots.slice(ith, ith + binSize)

      let isAlive = elems.map(elem => elem.alive ? 0 : 1)

      bins[host].push({
        host,
        elems,
        packetLoss: isAlive.reduce(sum, 0) / elems.length
      })
    }
  }

  return bins
}

packetLoss.display = state => {
  const series = []
  const hosts = Object.keys(state.percentiles)
  for (const host of hosts) {
    const data = state.packetLoss[host].map(data => data.packetLoss)

    series.push(data)
  }

  let text = asciichart.plot(series, {
    height: 7,
    offset: 2,
    colors: constants.hosts.map(data => data.colour.asciichart),
    format: label => {
      return `${(label).toFixed(2)}%`
    }
  })
  text = text.split('\n')

  let output = ''

  let ith = 0
  for (let ith = 0; ith < text.length; ++ith) {
    let host = hosts[ith]
    if (host) {
      let colour = constants.hosts.find(data => data.host === host).colour.chalk
      let square = chalk[colour]('■')

      let label = `${hosts[ith]} ${square}`
      output += `${label.padEnd(20)}${text[ith]}\n`
    } else {
      output += `${''.padEnd(10)}${text[ith]}\n`
    }
  }

  console.log(output)
  console.log('')

}

module.exports = packetLoss