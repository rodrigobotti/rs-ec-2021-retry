// ********************************************
// ** RETRY COM BACKOFF EXPONENCIAL E JITTER **
// ** E DETECÇÃO DE ERROS TRANSIENTES        **
// ********************************************

// types

// pq em typescript o canal de erro de Promises não é tipado
type PromiseError = any

// funções que recebem argumentos arbitrários e retornam Promise<?>
type Action = (...args: any[]) => Promise<any>

// função que representa retry+backoff+jitter de uma Action
// propaga o tipo dos argumentos e do retorno da Action
type Retry<T extends Action> = (...args: Parameters<T>) => ReturnType<T>

// função que diz se um erro é transiente ou não
type TransientErrorDetector = (error: PromiseError) => boolean

// configurações do retry+backoff+jitter
type RetryConfig = Readonly<{
  retries: number
  minDelay: number
  maxDelay: number
  factor: number
  jitter: boolean
  isTransientError: TransientErrorDetector
}>

// helpers

type ErrorParams = { code: string, message: string }

const createError = ({ code, message }: ErrorParams): Error => {
  const error = new Error(message)
  Object.assign(error, { code })
  return error
}

const failWhen = (percent: number) => (): Promise<string> => {
  console.log(`I have a ${percent * 100}% chance to fail.`)
  return Math.random() < percent
    ? Promise.reject(createError({ code: 'ETIMEDOUT', message: 'Timed out' }))
    : Promise.resolve('It worked!')
}

// utils

const delay = (time: number): Promise<void> =>
  new Promise(resolve =>
    setTimeout(resolve, time)
  )

const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min)

// retry + backoff + jitter

const addJitter = (backoff: number): number =>
  randomBetween(0, backoff) // existem muitos algorítmos de jitter, esse é somente um exemplo de aleatoriedade

const calculateBackoff = (
  {
    minDelay,
    maxDelay,
    factor,
    jitter,
  }: RetryConfig,
  attempt: number
): number => {
  const attemptBackoff = minDelay * factor ** attempt
  const backoff = Math.min(attemptBackoff, maxDelay)
  const jittered = jitter
    ? addJitter(backoff)
    : backoff
  console.log('backoff', jittered)
  return jittered
}

const defaultTransientErrorDetector: TransientErrorDetector = (_error: PromiseError) => true

const shouldHalt = (
  {
    retries,
    isTransientError = defaultTransientErrorDetector,
  }: RetryConfig,
  attempt: number,
  error: PromiseError
): boolean =>
  !isTransientError(error) || attempt >= retries

const invokeAction = (
  config: RetryConfig,
  action: Action,
  args: Parameters<Action>,
  attempt: number
): ReturnType<Action> =>
  action(...args)
    .catch(error =>
      shouldHalt(config, attempt, error)
        ? Promise.reject(error)
        : delay(calculateBackoff(config, attempt))
          .then(() => invokeAction(config, action, args, attempt + 1))
    )

export const retryWithBackOff =
  <T extends Action>(config: RetryConfig, action: T): Retry<T> =>
    (...args: Parameters<T>): ReturnType<T> =>
      invokeAction(config, action, args, 0) as ReturnType<T>

// exemplos de uso

const asyncNumber = (a: number, str: string): Promise<number> =>
  Promise.resolve(a + str.length)
// Promise.reject(new Error('I failed on purpose'))

const retryAsyncNumber = retryWithBackOff(
  {
    retries: 5,
    minDelay: 1000,
    maxDelay: 5000,
    factor: 2,
    jitter: true,
    isTransientError: _error => true,
  },
  asyncNumber
)

// note que o tipo inferido pelo compilador de retryAsyncNumber é (a: number, b: string) => Promise<number>
// (isso pode ser visto visualmente caso vc use um IDE/editor de texto com suporte a typescript)
// ou seja, preservou os tipos dos parâmetros e do retorno
retryAsyncNumber(1, 'aaaa')
  .then(console.log)

const asyncString = (x: string, y: boolean): Promise<string> =>
  Promise.resolve(`${x}${y}`)
// Promise.reject(new Error('I failed on purpose too'))

// note que forçando o tipo no assign não causa erro de compilação
// ou seja, preservou os tipos dos parâmetros e do retorno
const retryAsyncString: (typeof asyncString) = retryWithBackOff(
  {
    retries: 5,
    minDelay: 1000,
    maxDelay: 5000,
    factor: 2,
    jitter: true,
    isTransientError: _error => true,
  },
  asyncString
)

const maybeWillWork = retryWithBackOff(
  {
    retries: 5,
    minDelay: 1000,
    maxDelay: 5000,
    factor: 2,
    jitter: true,
    isTransientError: error => error?.code === 'ETIMEDOUT',
  },
  failWhen(0.3)
)

retryAsyncString('did it work ? ', true)
  .then(console.log)

maybeWillWork()
  .then(console.log.bind(console, 'done: '))
  .catch(console.error)
