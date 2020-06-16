
const asciichart = require('asciichart')

const constants = {
  packageJson: require('../../package'),
  networkColours: [
    asciichart.lightgreen,
    asciichart.lightyellow,
    asciichart.lightblue,
    asciichart.lightmagenta,
    asciichart.lightcyan,
    asciichart.darkgray,
    asciichart.lightred,
    asciichart.red,
    asciichart.green,
    asciichart.yellow,
    asciichart.blue,
    asciichart.magenta,
    asciichart.cyan,
    asciichart.white
  ],
  bins: {
    '1m': 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  },
  hosts: [
    {
      name: 'google-dns',
      host: '8.8.8.8',
      colour: {
        chalk: 'blueBright',
        asciichart: asciichart.blueBright
      }
    },
    {
      name: 'cloudfront-dns',
      host: '1.1.1.1',
      colour: {
        chalk: 'yellow',
        asciichart: asciichart.yellow
      }
    }
  ],
  intervals: {
    poll: 4000
  },
  thresholds: {
    slow: 500
  }
}

module.exports = constants
