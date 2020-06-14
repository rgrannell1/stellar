
const ping = require('ping').promise
const wifiName = require('wifi-name')
const constants = require('./commons/constants')

const pingNetworks = async (networkName, args) => {
  return new Promise((resolve, reject) => {
    setInterval(async () => {

      const res = await ping.probe(host)

    }, args.interval)
  })
}

const main = async (args) => {
  const networkName = await wifiName()

  await pingNetworks(networkName, args)
}

main()
