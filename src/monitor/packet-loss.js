
const chalk = require('chalk')

const asciichart = require('asciichart')

const text = require('../commons/text')
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

  let graph = asciichart.plot(series, {
    height: 7,
    offset: 2,
    colors: constants.hosts.map(data => data.colour.asciichart),
    format: label => {
      const formatted = `${(label * 100).toFixed(0)}%`
      return formatted.padStart(4)
    }
  })

  const floo = constants.hosts.map(data => {
    const square = chalk[data.colour.chalk]('■')
    return `${data.host} ${square}`
  }).join('\n')

  const joined = text.joinColumns(floo, graph, {
    leftPad: [27, 17]
  })

  console.log(joined)
  console.log('')
}

module.exports = packetLoss