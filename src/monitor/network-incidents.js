
const constants = require('../commons/constants')

const networkIncidents = { }

// -- find periods of excessive latency to both services
// -- LEVEL3: normal
// -- LEVEL2: >5% slow or 1% dead
// -- LEVEL3: >30% dead

const serviceLevel = {}

const statePercents = stretch => {
  return {
    ok: stretch.filter(data => data.state === 'OK').length / stretch.length,
    dead: stretch.filter(data => data.state === 'DEAD').length / stretch.length,
    slow: stretch.filter(data => data.state === 'SLOW').length / stretch.length
  }
}

serviceLevel.normal = stretch => {
  const pct = statePercents(stretch)

  if (pct.dead < 0.98) {
    return false
  }
  if (pct.slow < 0.95) {
    return false
  }

  return true
}

serviceLevel.mildImpact = stretch => {
  const pct = statePercents(stretch)

  if (pct.dead < 0.95) {
    return false
  }
  if (pct.slow < 0.90) {
    return false
  }

  return true
}

serviceLevel.severeImpact = stretch => {
  const pct = statePercents(stretch)

  if (pct.dead < 0.70) {
    return false
  }
  if (pct.slow < 0.60) {
    return false
  }

  return true
}

serviceLevel.unuseable = stretch => {
  const pct = statePercents(stretch)
  return true
}

networkIncidents.aggregate = async (state, args) => {
  const incidents = []

  const binSize = Math.ceil(30_000 / constants.intervals.poll)

  return incidents
}

/**
 * Detect deviations from normal network behavior
 *
 * @param {Object} state
 */
networkIncidents.display = async (state, args) => {
  // -- todo
  serviceLevel.normal(state.snapshots)
  serviceLevel.mildImpact(state.snapshots)
  serviceLevel.severeImpact(state.snapshots)
}

module.exports = networkIncidents
