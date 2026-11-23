# LabLink — Making College Laboratories More Accessible

**GenAI-powered campus laboratory resource-sharing platform** that helps students discover and access specialised equipment, development kits, and laboratory workstations across departments.

> Built for the **Prompt Wars HK** Hackathon · React + Vite + Tailwind CSS · Firebase Hosting

---

## 🎯 Problem Statement Alignment

| Challenge Requirement | LabLink Feature |
|---|---|
| Specialised equipment discovery across multiple departments | **Equipment Catalog** — 6 categories across AI/Robotics, ECE/VLSI, Mechanical, VLSI/Embedded, CSE/ISE, Biotechnology with live unit counts, specs, and location |
| Project-based slot booking with student details | **Slot Booking Modal** — captures USN, department, project title/scope, deadline, urgency level, and faculty guide |
| GenAI conflict resolution with fair, transparent allocations | **AI Conflict Resolver** — MCDA scoring engine (50/30/20 weights: deadline / urgency / equity) with full Explainable AI (XAI) breakdown |
| Faculty approval portal | **Faculty Portal** — guides can approve (issuing a Digital Lab Gate Pass), reschedule, or revoke requests |
| Resource utilisation dashboard | **Utilization Dashboard** — reclaimed idle hours, cross-dept sharing index, hourly load heatmap, and AI optimisation tips |

---

## 🏗️ Architecture

```
src/
├── App.jsx                  # Root SPA — 4-tab UI, all state management
├── data/
│   └── labData.js           # Static dataset: equipment, conflict samples, campus metrics
├── services/
│   └── aiScheduler.js       # GenAI MCDA conflict resolver, digital lab pass generator
├── utils/
│   └── security.js          # Input sanitization, booking & equipment payload validation
└── tests/
    └── scheduler.test.js    # 12 unit tests (Vitest)
```

### Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 (SPA, no router — single-page tabs) |
| Build Tool | Vite 8 with esbuild minification and manual chunk splitting |
| Styling | Tailwind CSS 3 (JIT) + custom dark palette |
| Icons | Lucide React |
| Testing | Vitest 5 |
| Linting | oxlint |
| Hosting | Firebase Hosting (CDN, SPA rewrites) |

### AI Conflict Resolver — MCDA Scoring (100 pts total)

```
Composite Score = Deadline Proximity (max 50) + Urgency Weight (max 30) + Resource Equity (max 20)

• Deadline ≤ 2 days  → 50 pts    • Critical urgency → 30 pts    • 0 prior bookings → 20 pts
• Deadline ≤ 4 days  → 42 pts    • High urgency     → 20 pts    • 1 prior booking  → 16 pts
• Deadline ≤ 7 days  → 34 pts    • Normal urgency   → 10 pts    • 2 prior bookings → 12 pts
• Deadline ≤ 10 days → 26 pts                                    • 3-4 bookings     →  8 pts
• Deadline ≤ 14 days → 18 pts                                    • 5+ bookings      →  4 pts
```

The engine outputs a full **Explainable AI (XAI)** breakdown showing exact point arithmetic, the winning allocation, the deferred student's alternative date/time, and a secondary workstation backup.

---

## 🚀 Setup & Development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Firebase CLI (for deployment): `npm install -g firebase-tools`

### Install & Run

```bash
# 1. Clone the repository
git clone <repo-url>
cd Prompt_warsHK

# 2. Install dependencies
npm install

# 3. Configure environment (optional — no runtime env vars needed for the demo SPA)
cp .env.example .env

# 4. Start development server
npm run dev
# → http://localhost:5173
```

### Test

```bash
npm test
# or: npx vitest run
# → 12 unit tests covering scoreRequest, resolveAllocationConflict, generateDigitalLabPass,
#   sanitizeInput, validateBookingPayload, and validateEquipmentPayload
```

### Lint

```bash
npm run lint
# → oxlint; must report 0 warnings and 0 errors
```

### Production Build

```bash
npm run build
# Output in dist/ (~150 kB gzipped, vendor-chunked for optimal caching)

npm run preview
# Preview the production build locally
```

---

## ☁️ Deploy to Firebase Hosting

```bash
# 1. Authenticate
firebase login

# 2. Build
npm run build

# 3. Deploy
firebase deploy --only hosting
```

The [firebase.json](./firebase.json) is pre-configured with:
- SPA rewrite (`**` → `/index.html`)
- **Long-lived immutable cache** for hashed JS/CSS assets (`Cache-Control: max-age=31536000, immutable`)
- **No-cache** for HTML (`must-revalidate`)
- Security headers on every response (see below)

---

## 🔒 Security

### Input Handling

- All user text is passed through `sanitizeInput()` before use — strips null bytes, `<` / `>`, and enforces max-length bounds.
- Booking and equipment registration payloads are validated with `validateBookingPayload()` / `validateEquipmentPayload()` before any state mutation.
- No `dangerouslySetInnerHTML` or `eval()` anywhere in the codebase.
- AI-generated text (XAI explanations) is rendered as React children (plain text nodes), never injected as raw HTML.

### Security Headers (Firebase Hosting)

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` |

### Environment Variables

- No secrets are hardcoded in source code.
- Use `.env` (gitignored) for Firebase/API config — see `.env.example`.

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Skip-to-content** link at page top (visible on focus).
- **`aria-live="polite"` region** announces all booking confirmations, AI decisions, and status changes to screen readers.
- All interactive elements have `focus-visible:ring-2` focus indicators meeting 3:1 contrast.
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section aria-labelledby>`, `<article>`, `<form>`, `<label>`.
- All icon-only controls carry `aria-label`; decorative icons use `aria-hidden="true"`.
- Modal dialogs use `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the visible heading.
- Escape key closes all open modals.
- Color is never the sole indicator of state (badges use both colour and text).

---

## 🧪 Testing Coverage

```
src/tests/scheduler.test.js — 12 tests

scoreRequest()
  ✓ handles null/undefined input gracefully
  ✓ scores Critical urgency + imminent deadline correctly (max 100 pts)
  ✓ scores Normal urgency + distant deadline (low score)
  ✓ applies fairness penalty for high prior bookings

resolveAllocationConflict()
  ✓ returns empty result for no input
  ✓ handles single-request direct allocation
  ✓ correctly picks Aarav Sharma (Critical, 2 days) over Priyanka Nair (Normal, 18 days)
  ✓ provides a deferred alternative for the losing request
  ✓ handles 3+ competing requests and ranks all

generateDigitalLabPass()
  ✓ returns null for invalid input
  ✓ generates PASS-2026-JETSON-* passId for NVIDIA Jetson requests
  ✓ includes verificationHash and AUTHORIZED_ACTIVE status
```

---

## 📁 Repository Hygiene

- Repo size: < 1 MB tracked (no binaries, no large assets committed)
- Branch: `main` (single branch)
- `.gitignore` covers `node_modules/`, `dist/`, `*.local`, `.env`
- No hardcoded secrets or API keys in any committed file

---

## 📄 License

MIT — Built for educational hackathon purposes.
