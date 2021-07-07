const createError = ({ code, message }) => {
  const error = new Error(message)
  error.code = code
  return error
}

const failWhen = percent => () => {
  console.log(`I have a ${percent * 100}% chance to fail.`)
  return Math.random() < percent
    ? Promise.reject(createError({ code: 'ETIMEDOUT', message: 'Timed out' }))
    : Promise.resolve('It worked!')
}

module.exports = {
  failWhen,
  createError,
}
