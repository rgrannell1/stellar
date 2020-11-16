
import { promise as ping } from 'ping'
import * as network from '../commons/network.js'
import { EventEmitter } from 'events'

interface Host {
  name: string,
  host: string
}

interface PingArgs {
  hosts: Host[],
  interval: number
}

const pingNetworks = (args:PingArgs) => {
  const emitter = new EventEmitter()

  setInterval(async () => {

    for (const { name, host } of args.hosts) {
      let res
      try {
        res = await ping.probe(host)
      } catch (err) {
        // -- todo.
      }

      const networkName = await network.getName()

      emitter.emit('ping', {
        networkName,
        ...res
      })
    }

  }, args.interval)

  return emitter
}

export default pingNetworks
