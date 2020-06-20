
const wifiName = require('wifi-name')

const network = {}

let previousNetwork = 'unknown'

/**
 * Get the current network name.
 *
 * @returns {string} the present network name, or the previous with an astericks
 *   when the connection drops
 */
network.getName = async () => {
  try {
    const currentNetwork = await wifiName()

    if (currentNetwork) {
      previousNetwork = currentNetwork
      return currentNetwork
    } else {
      return previousNetwork
    }
  } catch (err) {
    return previousNetwork === 'unknown'
      ? previousNetwork
      : previousNetwork + '*'
  }
}

module.exports = network
