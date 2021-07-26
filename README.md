![](https://storage.googleapis.com/golden-wind/experts-club/capa-github.svg)

# Patterns de Resiliência: Retry + Backoff + Jitter

Nessa aula vamos aprender sobre uma técnica para comunicação resiliente entre serviços/sistemas: retries + backoff + jitter.

Utilizaremos javascript para implementar um _"decorator" (higher-order function)_ 
que transforma uma função assíncrona qualquer em uma função que implementa esses padrões - de acordo com configuração passada como parâmetro.

## Código em etapas

O código será construido em etapas seguindo a seguinte evolução:

- [01.retry.js](./src/01.retry.js): 
    retry simples
- [02.retry.backoff.js](./src/02.retry.backoff.js): 
    retry com backoff exponencial
- [03.retry.backoff.jitter.js](./src/03.retry.backoff.jitter.js): 
    retry com backoff exponencial + jitter
- [04.retry.backoff.jitter.transient.js](./src/04.retry.backoff.jitter.transient.js): 
    retry com backoff exponencial + jitter + detecção customizada de erros transientes
- [05.retry.backoff.jitter.transient.ts](./src/05.retry.backoff.jitter.transient.ts): 
    retry com backoff exponencial + jitter + detecção customizada de erros transientes em typescript (produzindo uma função que preserva os tipos dos argumentos e retorno da função original)

## Referências
- https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
- https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- https://github.com/Polly-Contrib/Polly.Contrib.WaitAndRetry#wait-and-retry-with-jittered-back-off
- https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing
- https://martinfowler.com/articles/microservices.html#DesignForFailure

## Expert

| [<img src="https://avatars.githubusercontent.com/u/5365992?v=4" width="75px">](https://github.com/rodrigobotti) |
| :-: |
| [Rodrigo Botti](https://github.com/rodrigobotti) |
