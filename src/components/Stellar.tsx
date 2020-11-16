
import React from 'react'
import { Text } from 'ink'

export class Stellar extends React.Component {
  render() {
    const { state } = this

    return <>
      <Text>Latency & Jitter</Text>
      <LatencySummary></LatencySummary>
    </>
  }
}
