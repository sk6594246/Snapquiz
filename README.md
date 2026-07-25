# 📸 SnapQuiz - AI Quiz Generator

Turn any textbook page, storybook, or handwritten note into a fun, interactive quiz instantly using Google's Gemini AI.

## ✨ Features

- **📷 Snap & Quiz** — Take a photo or upload from gallery
- **🤖 AI-Powered** — Gemini 2.0 Flash reads text AND understands diagrams
- **🎯 Age-Adaptive** — Questions tailored for 5-7, 8-10, or 11-13 year olds
- **🎮 Gamified** — Progress bars, animations, confetti, and encouraging feedback
- **🔒 Privacy-First** — All client-side. Images go directly to Google AI. No backend.
- **📱 PWA Ready** — Install to home screen, works offline

## 🚀 Quick Start

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open `index.html` in any modern browser (or serve via any static host)
3. Select age group, paste your API key
4. Snap a photo of any page and play!

## 📁 File Structure

```
snapquiz/
├── index.html          # Main HTML structure
├── styles.css          # All styling & animations
├── app.js              # Application logic & AI integration
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── assets/
│   ├── icon-192.png    # PWA icon (192x192)
│   └── icon-512.png    # PWA icon (512x512)
└── README.md           # This file
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | Vanilla HTML5 + CSS3 + JavaScript |
| Camera | `getUserMedia` API |
| AI | Google Gemini 2.0 Flash (multimodal) |
| Storage | `localStorage` (API key only) |
| PWA | Service Worker + Web App Manifest |

## 📝 How It Works

```
[ User Takes Photo ]
        ↓
[ Browser captures image via getUserMedia ]
        ↓
[ Image + age prompt sent to Gemini Vision API ]
        ↓
[ AI returns structured JSON with 5 MCQs ]
        ↓
[ App renders interactive quiz UI ]
        ↓
[ Score tracking, feedback, confetti! ]
```

## 🔑 API Key Setup

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy and paste into the app
4. Key is saved locally in your browser

> **Note:** The free tier includes 1,500 requests/day — more than enough for personal use.

## 🎨 Customization

### Change Colors
Edit CSS variables in `styles.css`:
```css
:root {
  --primary: #6366f1;    /* Main brand color */
  --secondary: #f59e0b;   /* Accent color */
  --success: #10b981;     /* Correct answer */
  --danger: #ef4444;      /* Wrong answer */
}
```

### Change Number of Questions
In `app.js`, modify the prompt:
```javascript
Generate exactly 5 multiple-choice quiz questions...
```
Change `5` to your desired number.

### Change AI Model
In `app.js`, update the API endpoint:
```javascript
models/gemini-2.0-flash-exp:generateContent
```
Replace with `gemini-1.5-flash` or `gemini-1.5-pro` as needed.

## 🌐 Deployment Options

### Option 1: Static Hosting (Recommended)
- **Vercel** — Drag & drop folder
- **Netlify** — Drag & drop folder
- **GitHub Pages** — Push to repo, enable Pages
- **Firebase Hosting** — `firebase deploy`

### Option 2: Local Server
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

### Option 3: Mobile App Wrapper
- **Capacitor** — Wrap as iOS/Android app
- **PWA** — Add to home screen from browser

## 🔒 Privacy & Security

- **No backend server** — Everything runs in the browser
- **API key stored locally** — In `localStorage`, never transmitted to us
- **Images sent directly to Google** — Via their official API endpoint
- **No tracking or analytics** — Zero third-party scripts

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Use "Upload Photo" instead, or check browser permissions |
| "API key invalid" | Regenerate key at AI Studio |
| "No questions generated" | Ensure photo has clear, readable text |
| Questions too easy/hard | Change age group in settings |
| App won't install | Must be served over HTTPS for PWA install |

## 📄 License

MIT License — free for personal and commercial use.

## 🙏 Credits

- Fonts: [Google Fonts - Quicksand](https://fonts.google.com/specimen/Quicksand)
- AI: [Google Gemini](https://deepmind.google/technologies/gemini/)
- Icons: Emoji (no external icon library needed)
