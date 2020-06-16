
const text = {}

text.joinColumns = (left, right, opts) => {
  const leftLines = left.split('\n')
  const rightLines = right.split('\n')

  const lineCount = Math.max(leftLines.length, rightLines.length)

  let output = ''
  for (let ith = 0; ith < lineCount; ++ith) {
    let lhs = leftLines[ith] || ''
    let rhs = rightLines[ith] || ''

    output += lhs
      ? `${lhs.padEnd(opts.leftPad[0])}${rhs}\n`
      : `${lhs.padEnd(opts.leftPad[1])}${rhs}\n`
  }

  return output
}

text.percent = num => {
  return (Math.round(num * 100)) + '%'
}

module.exports = text
