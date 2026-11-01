# Swipe City source export

Game source, server, tests, and asset download manifest. Large assets are downloaded from the current hosted game rather than stored in GitHub.

Requires Node.js 22 or later. Run:

```sh
npm ci
node scripts/download-assets.mjs
npm run dev
```

For multiplayer, run `npm run server` in a second terminal. The asset download depends on the hosted site remaining available. API keys, environment files, and hosting identity are excluded.

# Swipe City

Source upload in progress. Game source, assets and local setup instructions will follow. Credentials and private hosting settings are excluded.
