# 食譜製造器

A phone-friendly web app: photograph your ingredients (or skip the photo), pick cuisines and limits, choose dishes, get a combined cooking timeline with calorie estimates, and log what you ate in a calendar.

This is the standalone version. It is a static site (no server), so it can be hosted on GitHub Pages and added to a phone's home screen.

## How it works

- `index.html` is the whole app. `app.js` is the bundled bridge to the Claude API (built from `src/shim.js`).
- Dish ideas and recipes are written by Claude. Each person enters their own Anthropic API key in the app ("設定 API key"). The key is stored only in that browser and sent only to Anthropic. Usage is billed to that key.
- The calendar and body profile are stored in the browser on that device. They do not sync between devices.

## Put it on GitHub Pages

1. Push these files to a GitHub repository (the `main` branch).
2. In the repository: Settings, then Pages. Under "Build and deployment" choose "Deploy from a branch", branch `main`, folder `/ (root)`, and save.
3. After a minute the site is at `https://<user>.github.io/<repo>/`.
4. On the phone, open that address, then use "Add to Home Screen" (Safari: Share menu; Chrome: menu, "Install app").

GitHub Pages on a free account needs a public repository. Nothing secret is in these files.

## Rebuild `app.js` after editing `src/shim.js`

```
npm install
npm run build
```
