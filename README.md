Hello Citadel.dashboard!

If you want update snapshot, you need run this code in work dir:
```bash
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.39.0-jammy /bin/bash
npm i
xvfb-run npx playwright test --update-snapshots```