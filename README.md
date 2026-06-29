# BugRoom

BugRoom is a smart picture helper.

You give it a screenshot.
BugRoom looks at the picture, thinks about what is wrong, and tells you what to do next.

It can also:
- use demo pictures
- show little AI worker roles in the room
- keep a queue of screenshots from your computer
- make a report after it finishes

## What you need

Please make sure you have these:
- Node.js installed
- npm installed
- a Cerebras API key

BugRoom needs the Cerebras key for live analysis.

## Super easy setup

1. Open a terminal in this project.
2. Install the app.
3. Copy the example env file.
4. Add your Cerebras key.
5. Start the app.

Run these commands:

```bash
npm install
cp .env.example .env.local
```

Now open `.env.local` and put your real key here:

```bash
CEREBRAS_API_KEY=your_real_key_here
```

Then start the app:

```bash
npm run dev
```

Now open this in your browser:

```text
http://localhost:3000
```

## How to use it

1. Open BugRoom in your browser.
2. Drop in a screenshot, or pick a demo picture.
3. Wait a moment.
4. Read the answer.
5. Follow the next step BugRoom gives you.

## Want the screenshot watcher too?

This is optional.

It watches common screenshot folders and puts new screenshots into BugRoom's queue.

Start it with:

```bash
npm run watch:screenshots
```

If you want to watch a special folder, run:

```bash
BUGROOM_WATCH_DIR=/full/path/to/your/screenshots npm run watch:screenshots
```

## Quick check

If BugRoom is working, you should be able to:
- open the site
- choose a demo image or upload your own screenshot
- see the room start analyzing
- get a result back

## Tiny developer note

- Main app: `src/app/page.tsx`
- Analyze API: `src/app/api/analyze/route.ts`
- Screenshot watcher: `scripts/screenshot-watcher.mjs`

That is it. Put in a screenshot, let BugRoom think, and follow the answer.
