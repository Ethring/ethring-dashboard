# Zomet Crypto Asset Management Platform

## Setup

```bash
# Install all dependencies
npm i
```

```bash
# Local page with hot reload at http://localhost:5173
npm run dev
```

```bash
# Build for production with minification
npm run build
```

```bash
# Debug build production, use this command to analyze bundle
npm run build:debug
```

```bash
# Build for production and view the bundle analyzer report
npm run build --report
```

```bash
# Playwright e2e test report
npm run test:report
```

## Environments

| Environment Variable | Description                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `NODE_ENV`           | Environment mode, can be one of the following values: `development`, `production`, `test`;           |
| `LOG_LEVEL`          | The level of logging, can be one of the following values: `error`, `warn`, `info`, `debug`, `trace`  |
| `CORE_API`           | The main API for obtaining configurations for chains and tokens                                      |
| `TX_MANAGER_API`     | The main API for obtaining transactions for the account, and also for getting the transaction status |
| `DATA_PROVIDER_API`  | The main API for obtaining balance for the account                                                   |
| `BRIDGE_DEX_API`     | The main API for obtaining super-swap transactions                                                   |
| `PROXY_API`          | The main API for obtaining the prices of tokens via the proxy                                        |
| `IS_ANALYZE`         | The main flag for analyzing the bundle for production build                                          |
| `PORTAL_FI_API`      | The main API for make POOL operations                                                                |
| `APPS_API`           | The main API for interacting with the application |

### Important `DATA_PROVIDER_API`

To get the balance for the account, please specify `DATA_PROVIDER_API` in your `.env` file;

## Tests

If you want update snapshot, you need run this code in work dir:

```bash
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash
npm i
npm run test:e2e:updateSnapshot
```

## Тесты с мокированными транзакциями

Для выполнения тестов, в которых подписываются транзакции используется 2 вспомогательных сервиса:

1. <https://git.citadel.one/zomet/services/stubtxmanager>
2. <https://git.citadel.one/zomet/services/evm-fake-node>

### Stubtxmanager

Сервис stubtxmanager является эмулятором поведения менеджреа транзакций. В пайплайне, на этапе тестов уже настроено обращение к поднятому экземпляру stubtxmanager. При локальном запуске тестов stubtxmanager необходимо поднимать вручную. Для этого нужно выкачать репозиторий и в корне прописать:

```bash
  npm run stub
```

Ничего больше для работы со stubtxmanager переопределять и настравивать внутри проекта фронта не нужно.

Важной особенностью работы со stubtxmanager является то - что данные для ответа нужно посылать в пакете запроса, в дополнительных полях. Playwright позволяет модифицировать данные в любом http запросе, отправляемом со страницы.
Поэтому в тестах используем методы modifyDataByPostTxRequest/modifyDataByGetTxRequest/modifyDataByPutTxRequest. В эти методы аргументом необходимо передавать:

- объект который будет отдан stubtxmanager в качестве http ответа на запрос
- объект который будет отдан stubtxmanager в сокет клиента в качестве эвента

Конкретные примеры использования можно увидеть в самих тестах, например в `Case#: Send tx in Polygon`

### Evm-fake-node

Сервис evm-fake-node работает поверх публичного rpc. Он полностью эмулирует работу настоящей evm ноды, за исключением того что он перехватывает http запросы, которые в body содержат значение `eth_sendRawTransaction`. Такие запросы не пропускаются на реальный rpc. Вместо этого метамаску отдаются подложенные фейковые данные, сообщающие о добавлении транзакции в блок и ее корректном исполнении.
Если в value передать значение 0.01, тогда на ММ будут отправленны данные сообщающие о неуспешном исполнении транзакции (json-rpc error)
Для того чтобы настроить тест на работу с фейковым rpc используется метод `setCustomRpc` из `/zomet-dashboard/tests/__fixtures__/fixtureHelper.ts`
