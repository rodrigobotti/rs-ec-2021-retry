// *******************
// ** SOMENTE RETRY **
// *******************

const { failWhen } = require('./helpers')

const shouldHalt = (retries, attempt) =>
  attempt >= retries

const invokeAction = (config, action, args, attempt) =>
  action(...args)
    .catch(err =>
      shouldHalt(config.retries, attempt)
        ? Promise.reject(err)
        : invokeAction(config, action, args, attempt + 1)
    )

const retry = (
  config,
  action
) => (...args) =>
  invokeAction(config, action, args, 0)

// usando

const willFail = (a, b, c) => {
  console.log('Calling action', a, b, c)
  return Promise.reject(new Error('I failed on purpose'))
}

const retryWillFail = retry(
  { retries: 5 },
  willFail
)

const maybeWillWork = retry(
  { retries: 5 },
  failWhen(0.3)
)

console.log('Starting')

retryWillFail(1, 2, 3)
  .then(console.log.bind(console, 'done: '))
  .catch(console.error)

maybeWillWork()
  .then(console.log.bind(console, 'done: '))
  .catch(console.error)
