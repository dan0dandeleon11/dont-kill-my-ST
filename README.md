# Keep Alive (Mobile) — SillyTavern Extension

Prevents mobile browsers (especially Huawei/Honor devices) from killing your SillyTavern tab by maintaining a looping silent audio session in the background.

## How it works

Creates an HTML5 `<audio>` element that loops a 1-second silent MP3 at volume 0. This tricks the browser into thinking media is playing, preventing tab suspension.

## Install

### From Termux (recommended)

```bash
cd ~/SillyTavern/data/default-user/extensions
git clone https://github.com/dan0dandeleon11/dont-kill-my-ST.git keep-alive
```

Then restart SillyTavern and enable the extension.

### Manual

Copy `manifest.json`, `index.js`, and `silence.mp3` into:
```
SillyTavern/data/default-user/extensions/keep-alive/
```

## Usage

1. Open the Extensions panel (wand icon)
2. Find **Keep Alive (Mobile)** in the list
3. Click the **Keep Alive** toggle button
4. Green dot = active, gray dot = inactive

The toggle state persists across sessions via localStorage. If autoplay is blocked, it will automatically start after your first tap/click on the page.

## Compatibility

- Tested on Huawei/Honor browsers, Chrome Android, Firefox Android
- Works in Termux + SillyTavern setups accessed via mobile browser
- No external dependencies — uses only jQuery (already in ST)
