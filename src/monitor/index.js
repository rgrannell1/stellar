

module.exports = {
  packetLoss: require('../monitor/packet-loss'),
  networkIncidents: require('../monitor/network-incidents'),
  network: require('../monitor/network'),
  latency: require('../monitor/latency')
}
