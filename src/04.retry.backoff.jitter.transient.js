// ********************************************
// ** RETRY COM BACKOFF EXPONENCIAL E JITTER **
// ** E DETECÇÃO DE ERROS TRANSIENTES        **
// ********************************************

const { failWhen } = require('./helpers')

// utils

const delay = time =>
  new Promise(resolve =>
    setTimeout(resolve, time))

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min)

// backoff

const addJitter = backoff =>
  randomBetween(0, backoff) // existem muitos algorítmos de jitter, esse é somente um exemplo de aleatoriedade

const calculateBackoff = (
  {
    minDelay,
    maxDelay,
    factor,
    jitter,
  },
  attempt
) => {
  const attemptBackoff = minDelay * factor ** attempt
  const backoff = Math.min(attemptBackoff, maxDelay)
  const jittered = jitter
    ? addJitter(backoff)
    : backoff
  console.log('backoff', jittered)
  return jittered
}

const defaultTransientErrorDetector = _error => true

const shouldHalt = (
  {
    retries,
    isTransientError = defaultTransientErrorDetector,
  },
  attempt,
  error
) =>
  !isTransientError(error) || attempt >= retries

const invokeAction = (config, action, args, attempt) =>
  action(...args)
    .catch(err =>
      shouldHalt(config, attempt)
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
    maxDelay: 10000,
    factor: 2,
    jitter: false,
    isTransientError: _ => false,
  },
  willFail
)

const maybeWillWork = retryWithBackOff(
  {
    retries: 5,
    minDelay: 1000,
    maxDelay: 5000,
    factor: 2,
    jitter: true,
    isTransientError: ({ code }) => code === 'ETIMEDOUT',
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
