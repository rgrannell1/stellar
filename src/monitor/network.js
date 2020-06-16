
const chalk = require('chalk')
const asciichart = require('asciichart')

const text = require('../commons/text')
const constants = require('../commons/constants')

const network = {}

const serviceLevel = {}

network.aggregate = async (state, args) => {

}

/**
 * Detect deviations from normal network behavior
 *
 * @param {Object} state
 */
network.display = async (state, args) => {
  // -- treat all bins as being connected to the same host
  // --
  const sampleBins = state.packetLoss['8.8.8.8']

  const networksOverTime = []

  for (const bin of sampleBins) {
    const networks = bin.elems.map(data => data.network)

    const counts = {}

    // -- count each network occurrence in the bin
    for (const network of networks) {
      if (!network) {
        continue
      }
      if (!counts[network]) {
        counts[network] = 1
      } else {
        counts[network]++
      }
    }

    // -- select the maximally common occurence
    let commonNetwork = {
      name: null,
      count: -Infinity
    }
    for (const [name, count] of Object.entries(counts)) {
      if (count >= commonNetwork.name) {
        commonNetwork = { name, count }
      }
    }

    networksOverTime.push(commonNetwork.name)
  }

  const series = []

  const networkNames = new Set(networksOverTime)

  for (const networkName of networkNames) {
    const hostSeries = networksOverTime.map(currentHost => {
      return currentHost === networkName
        ? 1
        : 0
    })

    series.push([0, ...hostSeries])
  }

  const labels = [...networkNames]
    .filter(data => !!data)
    .map((label, ith) => {
      // -- TODO why does +1 select the correct colour?
      const colour = constants.networkColours[ith + 1].chalk
      return label + chalk[colour](' ■')
    }).join('\n')

  const graph = asciichart.plot(series, {
    height: 1,
    offset: 2,
    colors: constants.networkColours.map(data => data.asciichart),
    format: label => {
      if (label === 1) {
        return ' on'
      } else {
        return 'off'
      }
    }
  })

  const output = text.joinColumns(labels, graph, {
    leftPad: [28, 18]
  })

  console.log(output)
}

module.exports = network
