
const wifiName = require('wifi-name')

const network = {}

let previousNetwork

/**
 * Get the current network name.
 *
 * @returns {string} the present network name, or the previous with an astericks
 *   when the connection drops
 */
network.getName = async () => {
  try {
    previousNetwork = await wifiName()
    return previousNetwork
  } catch (err) {
    return previousNetwork + '*'
  }
}

module.exports = network
