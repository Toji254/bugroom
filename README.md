# BugRoom

BugRoom is a real-time AI incident room for your screen. Upload a screenshot or run the built-in demo, and a Gemma 4 31B swarm on Cerebras diagnoses the issue, shows visible agent collaboration, measures speed, and exports an incident report.

## Why Cerebras + Gemma 4

The product only feels good if multiple agents can respond quickly. BugRoom uses `gemma-4-31b` on Cerebras as the primary runtime model and displays latency/tokens-per-second in the UI.

## Local setup

```bash
npm install
cp .env.example .env.local
# Add CEREBRAS_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000.

## API

- `GET /api/analyze` health check
- `POST /api/analyze` with JSON:

```json
{
  "prompt": "What is wrong with this screen?",
  "imageDataUri": "data:image/png;base64,..."
}
```

## Submission positioning

- Track 1: Multi-agent + multimodal
- Track 2: Visual 60-second demo for X/Twitter
- Track 3: Enterprise incident response/support workflow

Development can be assisted by AI coding tools. Runtime inference is powered primarily by Gemma 4 31B on Cerebras.
