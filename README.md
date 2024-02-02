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
# If you want to use the video command, add IS_ANALYZE=true
IS_ANALYZE=true vite build
```

```bash
# Build for production and view the bundle analyzer report
npm run build --report
```

```bash
# Playwright e2e test report
npm run test:report
```

## Tests

If you want update snapshot, you need run this code in work dir:

```bash
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash
npm i
npm run test:e2e:updateSnapshot
```
