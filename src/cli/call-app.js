
const app = require('../app/cuptime')

const callApp = rawArgs => app(callApp.preprocess(rawArgs))

callApp.preprocess = rawArgs => {
  return {
    interval: rawArgs['--interval']
  }
}

module.exports = callApp
