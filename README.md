# 食譜製造器

A phone-friendly web app: photograph your ingredients (or skip the photo), pick cuisines and limits, choose dishes, get a combined cooking timeline with calorie estimates, and log what you ate in a calendar.

The first tab also has a today dashboard: a calories-left ring with protein, carbs and fat, a one-tap photo log, a water counter, a weight log (with a chart in "我嘅目標") and a count of days in a row with something logged. Each photo or calorie estimate comes with a one-line comment on the meal, in a tone picked in "我嘅目標" (毒舌, 溫柔, 阿媽碎碎念, or none).

This is the standalone version. It is a static site (no server), so it can be hosted on GitHub Pages and added to a phone's home screen.

## How it works

- `index.html` is the whole app. `app.js` is the bundled bridge to the Claude API (built from `src/shim.js`).
- Dish ideas and recipes are written by Claude. Each person enters their own Anthropic API key in the app ("設定 API key"). The key is stored only in that browser and sent only to Anthropic. Usage is billed to that key.
- Signed out, the calendar, pantry and goal are stored in the browser on that device only.
- Signed in (the "登入同步" button, email and password), they are stored per account in Firebase and follow the account across devices. Other accounts cannot read them. This uses the Firebase project in `firebase-config.js`, the same one as Focus Pebbles, so the same accounts work.

## One-time Firebase step for sync

Add the rule in `firestore-rules-to-add.txt` to that project's Firestore rules (Firebase console, Firestore Database, Rules, Publish). Until then, sign-in works but saving and loading fail.

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
