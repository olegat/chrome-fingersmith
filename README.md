# Fingersmith

A simple Chrome Extension for simulating Touch Events with the Mouse

Usage:
- Click the "+☝️" Button
- Click the page: This will simulate a `touchstart` event.
- Click and drag a Visual Touch circle: This will simulate a `touchmove` event.
- Double-click Visual Touch circle: This will simulate a `touchend` event.

You can use the "+☝️" button repeatedly to create multiple target touches.

# Building

Prerequistes:
- Node.js
- Ninja-Build

```
npm install # installs Typescript compiler
ninja # builds the extension in ./dist
```
