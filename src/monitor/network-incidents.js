
const chalk = require('chalk')
const dayjs = require('dayjs')

const constants = require('../commons/constants')

const networkIncidents = { }

// -- find periods of excessive latency to both services
// -- LEVEL3: normal
// -- LEVEL2: >5% slow or 1% dead
// -- LEVEL3: >30% dead

const serviceLevel = {}

const statePercents = stretch => {
  return {
    ok: (stretch.filter(data => data.state === 'OK').length / stretch.length) * 100,
    dead: (stretch.filter(data => data.state === 'DEAD').length / stretch.length) * 100,
    slow: (stretch.filter(data => data.state === 'SLOW').length / stretch.length) * 100
  }
}

const presentState = stretch => {
  const pct = statePercents(stretch)

  let bounds = null

  if (stretch.length > 0) {
    bounds = {
      start: stretch[0].timestamp,
      end: stretch[stretch.length - 1].timestamp
    }
  }

  if (pct.ok > 95) {
    return {
      status: 'NORMAL',
      bounds
    }
  }
  if (pct.ok > 92) {
    return {
      status: 'MILD_IMPACT',
      bounds
    }
  }
  if (pct.ok > 80) {
    return {
      status: 'SEVERE_IMPACT',
      bounds
    }
  }

  return {
    status: 'UNUSEABLE',
    bounds
  }
}

networkIncidents.aggregate = async (state, args) => {
}

const formatDate = date => {
  const dateObj = new Date(date)

  const today = dayjs(new Date()).format('YYYY-MM-DD')
  const day = dayjs(dateObj).format('YYYY-MM-DD')

  if (day === today) {
    return dayjs(dateObj).format('HH:mm')
  } else {
    return dayjs(dateObj).format('MM-DD HH:mm')
  }
}

const isComparable = (state0, state1) => {
  return state0 === state1 ||
    (state0 !== 'NORMAL' && state1 !== 'NORMAL')
}

const worstStatus = (state0, state1) => {
  if (state0 === 'UNUSEABLE' || state1 === 'UNUSEABLE') {
    return 'UNUSEABLE'
  }
  if (state0 === 'NORMAL' || state1 === 'NORMAL') {
    return 'NORMAL'
  }
  if (state0 === 'MILD_IMPACT' || state1 === 'MILD_IMPACT') {
    return 'MILD_IMPACT'
  }
  if (state0 === 'SEVERE_IMPACT' || state1 === 'SEVERE_IMPACT') {
    return 'SEVERE_IMPACT'
  }
}

/**
 * Detect deviations from normal network behavior
 *
 * @param {Object} state
 */
networkIncidents.display = async (state, args) => {
  const momentaryStatuses = []

  // -- change to variable
  let offset = 6

  for (let ith = 0; ith < state.snapshots.length; ++ith) {
    let stretch = state.snapshots.slice(Math.max(0, ith - 6), ith)
    momentaryStatuses.push(presentState(stretch))
  }

  const grouped = momentaryStatuses.reduce(function (prev, curr) {
    if (prev.length && isComparable(curr.status, prev[prev.length - 1][0].status)) {
      const status0 = curr.status
      const status1 = prev[prev.length - 1][0].status

      prev[prev.length - 1].push({
        ...curr,
        status: worstStatus(status0, status1)
      })
    }
    else {
      prev.push([curr])
    }
    return prev
  }, [])

  const incidents = grouped
    .map(group => {
      return {
        status: group[0].status,
        bounds: {
          from: group[0]?.bounds?.start,
          to: group[group.length - 1]?.bounds?.end
        }
      }
    })
    .filter(candidate => {
      return candidate.status !== 'NORMAL' && candidate.bounds.from && candidate.bounds.to
    })

  const descriptions = incidents.map(data => {
    const { bounds, status} = data

    const dateDescription = `${formatDate(bounds.from)} ⟶  ${formatDate(bounds.to)}`
    const message = `${status.padEnd(20)} ${dateDescription}`

    if (status === 'SEVERE_IMPACT') {
      console.log(chalk.yellow(message))
    } else if (state === 'MILD_IMPACT') {
      console.log(chalk.yellow(message))
    } else if (state === 'UNUSEABLE') {
      console.log(chalk.red(message))
    } else {
      console.log(chalk.red(message))
    }
  })

  console.log('')
  console.log('')
}

module.exports = networkIncidents
