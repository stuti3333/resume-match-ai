# ResumeMatch AI 🎯

An AI-powered resume analyzer that instantly tells you how well your resume matches a job description — with ATS scoring, missing keyword detection, rewritten bullet points, and a tailored cover letter opener.

**Built with React + Claude Sonnet API**

---

## 🚀 Live Demo
[your-deployed-link-here]

## 📸 Screenshots
> Add screenshots after deployment

---

## Features

- **ATS Score (0–100)** — Know exactly how likely your resume is to pass automated screening
- **Keyword Analysis** — Matched ✅, Missing ❌, and Partial ⚡ keywords highlighted
- **Strengths & Gaps** — What the JD needs vs what you have
- **AI Bullet Rewrites** — Your existing bullets rewritten to match JD language
- **Cover Letter Opener** — Compelling first paragraph generated for this specific role
- **Top Tip** — Single most impactful action you can take right now

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite |
| AI | Claude Sonnet (Anthropic API) |
| Styling | Pure CSS with CSS variables |
| Fonts | Syne, DM Sans, DM Mono |
| Deployment | Vercel |

---

## Getting Started

```bash
git clone https://github.com/yourusername/resume-match-ai
cd resume-match-ai
npm install
```

Create a `.env` file:
```
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

> ⚠️ For production, move the API call to a backend (Node/Express or Vercel serverless function) to protect your API key.

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Project Structure

```
resume-match-ai/
├── src/
│   ├── App.jsx        # Main app component (upload → analyze → results)
│   └── main.jsx       # React entry point
├── index.html
├── vite.config.js
└── package.json
```

---

## How It Works

1. User pastes resume text + job description
2. App sends both to Claude Sonnet with a structured prompt
3. Claude returns JSON with score, keywords, strengths, gaps, rewrites, and cover letter
4. Results are displayed across 3 tabs: Analysis, Bullet Rewrites, Cover Letter

---

## Roadmap

- [ ] PDF parsing (pdf.js integration)
- [ ] Save multiple JD analyses to a dashboard (Supabase)
- [ ] Chrome extension to auto-extract JD from LinkedIn/Naukri
- [ ] User auth + history
- [ ] Export analysis as PDF

---

## Why I Built This

I was applying for internships and spending hours manually tailoring my resume for each JD. I built ResumeMatch AI to automate the analysis and give actionable feedback in seconds — solving my own problem.

---

## Author

**Stuti** — [GitHub](https://github.com/stuti3333) | [LinkedIn](https://linkedin.com/in/yourprofile)
