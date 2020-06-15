#!/usr/bin/env node

const neodoc = require('neodoc')

const handleErrors = require('../commons/handle-errors')
const constants = require('../commons/constants')

const docs = `
Name:
  cuptime — measure connection reliability.
Usage:
  cuptime [-i <int> | --interval <int>]
  cuptime (-h | --help | --version)

Options:
  -i <int>, --interval <int>    the interval [default: ${constants.intervals.poll}]

Description:
  cuptime
`

const callApp = require('../cli/call-app')

const args = neodoc.run(docs)

callApp(args).catch(handleErrors)
