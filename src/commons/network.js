
const wifiName = require('wifi-name')

const network = {}

let previousNetwork

/**
 * Get the current network name.
 *
 */
network.getName = async () => {
  try {
    previousNetwork = await wifiName()
    return
  } catch (err) {
    return previousNetwork + '*'
  }
}

module.exports = network
