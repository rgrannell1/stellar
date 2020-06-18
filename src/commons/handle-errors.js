
const userFailingErrorMesasage = `Something has went terribly wrong!

Feedback URL: https://forms.gle/DDPt3GYUNMuNTLkm8

Please report the following error message to https://github.com/rgrannell1/cuptime/issues,
(along with the input text if possible):
`

/**
 * Display errors appropriately, include user-instructions
 *
 * @param {Error} err the error to preocess.
 */
const handleErrors = err => {
  if (err.code) {
    console.error(err.message)
  } else {
    console.error(userFailingErrorMesasage)

    console.error(err.message)
    console.error(err.stack)
  }

  process.exit(1)
}

module.exports = handleErrors
