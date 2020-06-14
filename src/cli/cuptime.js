#!/usr/bin/env node

const neodoc = require('neodoc')

const handleErrors = require('../commons/handle-errors')

const docs = `
Name:
  cuptime — measure connection reliability.
Usage:
  cuptime [-i <int> | --interval <int>]
  cuptime (-h | --help | --version)

Options:
  -i <int>, --interval <int>    the interval [default: 1000]

Description:
  cuptime
`

const callApp = require('../cli/call-app')

const args = neodoc.run(docs)

callApp(args).catch(handleErrors)
