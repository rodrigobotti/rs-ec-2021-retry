const { failWhen } = require('./helpers')

// utils

const delay = time =>
  new Promise(resolve =>
    setTimeout(resolve, time))

// backoff

const calculateBackoff = (
  {
    minDelay,
    maxDelay,
    factor,
  },
  attempt
) => {
  const attemptBackoff = minDelay * factor ** attempt
  const backoff = Math.min(attemptBackoff, maxDelay)
  console.log('backoff', backoff)
  return backoff
}

const shouldHalt = (retries, attempt) =>
  attempt >= retries

const invokeAction = (config, action, args, attempt) =>
  action(...args)
    .catch(err =>
      shouldHalt(config.retries, attempt)
        ? Promise.reject(err)
        : delay(calculateBackoff(config, attempt))
          .then(() => invokeAction(config, action, args, attempt + 1))
    )

const retryWithBackOff = (
  config,
  action
) => (...args) =>
  invokeAction(config, action, args, 0)

// usando

const willFail = (a, b, c) => {
  console.log('Calling action', a, b, c)
  return Promise.reject(new Error('I failed on purpose'))
}

const retryWillFail = retryWithBackOff(
  {
    retries: 5,
    minDelay: 1000,
    maxDelay: 5000,
    factor: 2,
  },
  willFail
)

const maybeWillWork = retryWithBackOff(
  {
    retries: 5,
    minDelay: 1000,
    maxDelay: 5000,
    factor: 2,
  },
  failWhen(0.3)
)

console.log('Starting')

retryWillFail(1, 2, 3)
  .then(console.log.bind(console, 'done: '))
  .catch(console.error)

maybeWillWork()
  .then(console.log.bind(console, 'done: '))
  .catch(console.error)
