# Face-to-Face

A complete mobile-first multilingual communication application.

## Included
- Premium responsive UI
- Text translation workflow
- Voice input using browser speech recognition
- Spoken translation using browser speech synthesis
- Photo workflow ready for OCR integration
- South African and international languages
- Language swapping
- Local conversation history
- Light/dark theme
- Configurable translation endpoint
- No Lovable credits required

## Run locally

```bash
npm install
npm run dev
```

## Translation service

Create a `.env` file:

```env
VITE_TRANSLATE_URL=https://your-libretranslate-compatible-server/translate
```

The app uses a configurable LibreTranslate-compatible API so you can run your own service and avoid platform-specific credits.

## Deploy
The project can be deployed to Vercel, Netlify, GitHub Pages (with configuration), Railway, or another static hosting provider.
