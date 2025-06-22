{
  "name": "line-bot-v2",
  "version": "1.0.0",
  "description": "LINE Bot with Vercel",
  "main": "api/webhook.js",
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "dev": "vercel dev",
    "start": "node api/webhook.js"
  },
  "dependencies": {
    "@line/bot-sdk": "^7.5.2"
  }
}
