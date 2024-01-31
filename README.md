# Zomet Crypto Asset Management Platform

## Setup

```bash
# install dependencies
npm i
```

```bash
# serve with hot reload at http://localhost:8080
npm run serve
```

```bash
# build for production with minification
npm run build
```

```bash
# build for production and view the bundle analyzer report
npm run build --report
```

```bash
# playwright e2e test report
npm run test:report
```

## Tests

If you want update snapshot, you need run this code in work dir:

```bash
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash
npm i
npm run test:e2e:updateSnapshot
```
