# genmarkangus.dev v2: Build Plan

> Goal: turn the portfolio from "a site with demos" into proof that Gen can ship **reliable, secure, business-relevant AI automation**. Every decision below serves one question: *does this help a recruiter or client trust me within 60 seconds?*

---

## SECTION 0: POSITIONING & SUCCESS CRITERIA

**Target roles/clients:** AI Automation Engineer (remote/PH-based), automation freelance clients (e-commerce ops, inbound lead handling, support triage).

**Headline (hero):** `Gen Mark D. Angus: AI Automation Engineer`
**Sub-line:** `I build self-hosted n8n + LLM workflows that handle inbound leads, voice and support, with the logging, guardrails and security of someone who also trains as a SOC analyst.`

**Differentiators to make obvious on the page:**
1. Business-outcome workflows (lead enrichment, inbound ops, voice-to-email), not toy demos.
2. Reliability evidence: error handling, retries, logs, live success-rate metrics.
3. Security-first automation (cybersecurity background): prompt-injection defenses, webhook auth, secrets hygiene, audit logs.
4. Case studies that include *what broke and how it was fixed*, plus cost and latency per run.

**Success criteria (measured, not guessed):**
- Analytics installed on day one; baseline traffic recorded before launch.
- At least 3 full case study pages live at launch.
- Every project has: live demo or fallback video, architecture diagram, workflow JSON on GitHub.
- Clear CTA (book a call / download resume) visible without scrolling on desktop and mobile.
- Lighthouse >= 90 on Performance, Accessibility, SEO, Best Practices (mobile).

---

## SECTION 1: ARCHITECTURE & ENVIRONMENT BLUEPRINT

### 1. Root & Workspace Rules

* **Project Folder Name:** `genmarkangus`
* **Domain:** `genmarkangus.dev`
* **Framework:** Astro, **hybrid output** (static pages by default, server endpoints where needed)
* **Interactivity:** Astro **islands** (`client:visible` / `client:load`) only for tiles that need JS (chat, voice recorder, FitSync, live metrics). Everything else ships zero JS.
* **Hosting:** Vercel with `@astrojs/vercel` adapter (required for `src/pages/api/*`)
* **Styling Engine:** Tailwind CSS
* **Design Pattern:** Bento Grid with Glassmorphism (`backdrop-blur-md`, `border-white/10`, deep obsidian `#0B0F17`)
* **Content:** Astro Content Collections (Markdown/MDX) for case studies
* **Backend Infrastructure:** Self-hosted Docker running n8n and PostgreSQL, exposed **only** through a **Cloudflare Tunnel** (no open home ports)
* **Database & RAG:** Supabase (pgvector for RAG, Postgres tables for logs/metrics)
* **Bot protection:** Cloudflare Turnstile on every public workflow trigger
* **Analytics:** Plausible or Umami (privacy-friendly), with custom events for CTA clicks, demo launches and case study opens
* **Media:** short walkthrough video per project (Loom/YouTube unlisted embed, lazy loaded)

### 2. Environment Variables (never committed)

```text
N8N_BASE_URL            N8N_WEBHOOK_SECRET (header auth)
SUPABASE_URL            SUPABASE_SERVICE_KEY (server-side only)
TURNSTILE_SECRET        TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (n8n side)
GEMINI_API_KEY (n8n side, with hard spend cap in Google Cloud)
PUBLIC_ANALYTICS_DOMAIN
```

---

## SECTION 2: COMPONENT & DIRECTORY STRUCTURE

Every tile maps to an isolated Astro component so `index.astro` stays clean.

```text
genmarkangus/
├── public/
│   ├── resume.pdf                        # Downloadable resume (tracked as an analytics event)
│   └── og/                               # Open Graph preview images
├── src/
│   ├── content/
│   │   ├── config.ts                     # Case study schema (title, stack, metrics, repoUrl, videoUrl)
│   │   └── projects/
│   │       ├── neural-mirror.md          # RAG chat agent case study
│   │       ├── lead-enrichment.md        # ICP scoring workflow case study
│   │       ├── inbound-ops.md            # Workflow 04 case study (added when built)
│   │       ├── voice-receptionist.md     # Voice -> transcript -> Gmail dispatch
│   │       └── fit-sync.md               # Personal project
│   │
│   ├── components/
│   │   ├── ui/                           # Base Design Primitives
│   │   │   ├── GlassCard.astro           # Translucent frosted container
│   │   │   ├── StatusBadge.astro         # Glowing status light, driven by /api/health
│   │   │   ├── PrimaryButton.astro       # Gradient CTA button
│   │   │   ├── TurnstileGate.astro       # Bot-check wrapper for demos
│   │   │   ├── ConsentNote.astro         # "Your audio/photo is processed, not stored" notice
│   │   │   └── FallbackVideo.astro       # Shown when a demo backend is offline
│   │   │
│   │   ├── layout/
│   │   │   ├── BaseLayout.astro          # SEO, OG tags, analytics script, theme tokens
│   │   │   ├── Navbar.astro              # Translucent bar + live status + "Book a call"
│   │   │   ├── Footer.astro              # Uptime, GitHub, resume, copyright
│   │   │   └── CaseStudyLayout.astro     # Standard case study template
│   │   │
│   │   └── features/                     # Isolated Tile Components
│   │       ├── HeroTile.astro            # Identity, niche line, primary CTA
│   │       ├── AvailabilityTile.astro    # Open to work, timezone, Calendly/CTA, resume
│   │       ├── NeuralChatTile.astro      # Project 01: RAG chat agent
│   │       ├── LeadEnrichmentTile.astro  # Project 02: lead enrichment + ICP scoring
│   │       ├── InboundOpsTile.astro      # Project 04: inbound ops (placeholder until built)
│   │       ├── ReceptionistTile.astro    # Project 03: voice recorder -> n8n
│   │       ├── SecurityTile.astro        # "Secure by default" controls list
│   │       ├── MetricsTile.astro         # Live execution count, success rate, avg latency
│   │       ├── FitSyncTile.astro         # Personal project (small tile)
│   │       ├── ProofTile.astro           # Testimonial/reference + measurable results
│   │       └── SocialsTile.astro         # GitHub, LinkedIn, Telegram
│   │
│   └── pages/
│       ├── index.astro                   # Main Bento Grid Canvas (< 80 lines)
│       ├── projects/
│       │   └── [slug].astro              # Renders every case study from the content collection
│       ├── demo/
│       │   ├── neural-chat.astro         # Standalone chat window
│       │   ├── voice-receptionist.astro  # Call log & transcripts (demo data only)
│       │   └── fit-sync.astro            # Full-page FitSync dashboard
│       └── api/
│           ├── chat.ts                   # Proxy -> n8n chat (verifies Turnstile, adds secret header)
│           ├── fitness.ts                # Proxy -> n8n FitSync
│           ├── lead.ts                   # Proxy -> n8n lead enrichment demo
│           ├── voice.ts                  # Proxy -> n8n voice workflow (size/duration capped)
│           ├── health.ts                 # Pings n8n; returns online/offline (cached 30-60s)
│           └── metrics.ts                # Reads aggregated stats from Supabase execution_log
```

**Rule:** the browser never calls n8n directly. All traffic goes through `src/pages/api/*`, which verifies Turnstile, rate limits, attaches the webhook secret header, and forwards.

---

## SECTION 3: BENTO GRID LANDING PAGE MAP (`index.astro`)

Section 3 grid map: replace the 11-tile map with the 7 tiles in the table above.
Phases 3-5: instead of building separate tiles, each phase now means "add the slide data in projects.ts, the demo page and the case study" for Neural Mirror and Lead Enrichment (Phase 3), Voice (Phase 4) and FitSync (Phase 5). The separate tile files for those projects are dropped.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ [NAV] genmarkangus.dev                              [🟡 Checking...]  [ Book a call ]   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ROW 1                                                                                  │
│  ┌─────────────────────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │ HeroTile (Span 8)                               │ │ AboutProofTile (Span 4)        │ │
│  │ [🟢 Open to work]                               │ │ About + Proof / Value Prop     │ │
│  │ Gen Mark D. Angus • AI Automation Engineer      │ │                                │ │
│  │ "I help e-commerce and service businesses turn  │ │                                │ │
│  │  inbound leads, calls and support requests into │ │                                │ │
│  │  automated, reliable workflows..."             │ │                                │ │
│  │ [ Book a call ]  [ Download resume ]            │ │                                │ │
│  └─────────────────────────────────────────────────┘ └────────────────────────────────┘ │
│  ROW 2                                                                                  │
│  ┌─────────────────────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │ ProjectsSliderTile (Span 8)                     │ │ MetricsTile (Span 4)           │ │
│  │ [🟢 Live]                             [ ← ] [ → ]│ │ Live Metrics                   │ │
│  │ Swipeable Carousel:                             │ │ Executions counter & uptime    │ │
│  │ • Neural Mirror (RAG Chat Agent)                │ │ (real data arrives in Phase 2) │ │
│  │ • Lead Enrichment & ICP Scoring                 │ │                                │ │
│  │ • Voice Receptionist / FitSync                  │ │                                │ │
│  │ Stack Badges: n8n • Supabase pgvector • RAG     │ │                                │ │
│  │ [ Slide Indicators:  🟢 ⚪ ⚪ ⚪ ]               │ │                                │ │
│  └─────────────────────────────────────────────────┘ └────────────────────────────────┘ │
│  ROW 3                                                                                  │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────────────┐ │
│  │ SecurityTile (Span 4)│ │ StackTile (Span 4)   │ │ SocialsTile (Span 4)             │ │
│  │ Secure by Default    │ │ Core Infrastructure  │ │ GitHub • LinkedIn • Telegram     │ │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

Every project tile has two actions: **Try it** (demo) and **Read case study** (`/projects/[slug]`).

---

## SECTION 4: CASE STUDY STANDARD (`src/content/projects/*.md`)

Every case study uses the same structure so recruiters can skim:

1. **Problem:** the business pain in 2-3 sentences.
2. **Outcome:** headline result (use real numbers only; if unmeasured, say what was tested).
3. **Architecture diagram:** nodes, services, data flow (SVG or Mermaid).
4. **Stack:** n8n, Gemini model, Supabase, integrations used.
5. **How it works:** step-by-step sequence.
6. **What broke and how I fixed it:** at least 2 real issues.
7. **Reliability:** error handling, retries, fallback, logging, human-in-the-loop steps.
8. **Security:** auth, rate limits, input validation, prompt-injection handling.
9. **Cost and latency:** average cost per run, average response time.
10. **Links:** live demo, 60-90s walkthrough video, workflow JSON on GitHub.
11. **CTA:** "Need something like this? Book a call."

Frontmatter schema: `title, summary, stack[], role, status, metrics{runs, successRate, avgLatencyMs, costPerRun}, repoUrl, videoUrl, order`.

---

## SECTION 5: WORKFLOW ENGINEERING STANDARDS (apply to ALL workflows)

### 1. Reliability
* Dedicated **Error Trigger workflow** that logs the failure and sends a Telegram alert.
* Retry-on-fail with backoff on all LLM and HTTP nodes; timeouts set explicitly.
* Every run writes one row to Supabase `execution_log` (`workflow`, `status`, `latency_ms`, `tokens`, `est_cost`, `mode`, `created_at`). This table powers `MetricsTile`.
* LLM output is validated against a JSON schema; invalid output triggers one retry, then a safe fallback response.
* Human-in-the-loop approval (Telegram/email) for any workflow that sends external messages on a client's behalf.
* Small **eval set** per AI workflow (10-20 test inputs with expected outcomes), run before each major change; results summarized in the case study.

### 2. Security
* Webhooks require a secret header (set by the Astro proxy). No unauthenticated webhook is exposed.
* **Turnstile** token verified server-side in the Astro endpoint before forwarding.
* Rate limit per IP (e.g., a few demo calls per minute and a daily cap).
* Hard caps: image <= 5 MB, audio <= 15 s / 2 MB, text <= 1,000 characters.
* **Prompt-injection defenses:** system prompt isolation, treat all user and retrieved text as data, output schema enforcement, and a documented test list of injection attempts against the RAG agent.
* Secrets only in environment variables or n8n credentials, never in workflow JSON exports. Scrub before publishing to GitHub.
* Spend cap and alerts on the Gemini API key.
* **Privacy:** ConsentNote on photo/voice demos stating the data is processed for the demo and not retained; demo mode never writes visitor content to the database beyond anonymous metrics.

### 3. Graceful degradation
* `/api/health` checks n8n through the tunnel. If offline, StatusBadge turns amber/red, demos swap to `FallbackVideo`, and the CTA still works. Offline demos must never show a raw error.

---

## SECTION 6: PROJECT SPECIFICATIONS

### Project 01: Neural Mirror (RAG chat agent)
* Existing 24/7 agent that answers recruiter questions on Gen's behalf; Supabase pgvector ingestion workflow loads portfolio context.
* v2 additions: suggested-question chips, source citations in answers, injection test log, link to case study, logging to `execution_log`.

### Project 02: Lead Enrichment + ICP Scoring
* Existing workflow. v2 additions: public demo accepting a company name/domain only, returns enrichment summary and ICP score with reasoning, case study showing the scoring rubric and accuracy on a small test set.

### Project 03: Voice Receptionist
* Existing voice transcriber with Gmail dispatch. v2: 15s browser recorder, Turnstile + consent notice, transcript and summary shown on screen, demo email routed to a controlled inbox (not the visitor's), call log page uses demo data only.

### Project 04: AI Inbound Operations (to be built next)
* Placeholder tile at launch ("Coming soon") that links to a short roadmap. Swap to a full tile and case study once built. Scope to be defined step by step when we build it.

### Personal Project: FitSync AI (small tile)
**Dual-operating logic**
* **Personal Mode (your account / PIN):** n8n parses the food photo or audio, calculates macros, inserts the record into Supabase `fitness_logs`.
* **Visitor Mode (public demo):** n8n parses the meal, returns live macros to the visitor's screen, **skips the database save**, and sends an instant Telegram alert to Gen.

**n8n sequence**
1. Webhook Listener: receives `mode`, and `image_binary` OR `text_prompt` (after Astro proxy verification).
2. Gemini 2.5 Flash node: strict system instructions, returns JSON with items, calories, protein, carbs, fats.
3. Schema validation (retry once, then fallback).
4. If/Switch: **Branch A (Personal)** inserts into `fitness_logs`; **Branch B (Visitor)** triggers Telegram notification.
5. Log to `execution_log`.
6. Response node: structured JSON to the Astro card for real-time macro progress bars.

*Table name is standardized as `fitness_logs` everywhere.*

---

## SECTION 7: CONVERSION & TRACTION

### On-site
* Primary CTA ("Book a call") in navbar, hero, availability tile and every case study.
* Secondary CTA: resume download.
* Analytics events: `cta_book_click`, `resume_download`, `demo_launch_<project>`, `case_study_open_<slug>`, `video_play`.
* SEO: unique title/description per page, canonical URLs, sitemap, `robots.txt`, JSON-LD `Person` schema, Open Graph and Twitter preview images per project.
* Performance: optimized images (Astro `<Image>`), lazy-loaded embeds, fonts self-hosted.
* Accessibility: keyboard navigation, focus states, contrast checks on glass cards, `prefers-reduced-motion` support.

### Off-site distribution (the part that actually brings traffic)
* One LinkedIn post or short video per project, linking to its case study.
* Publish workflow templates to the n8n community and workflow JSONs to GitHub with a clean README per project.
* Add the site link to resume, LinkedIn headline, GitHub profile and every job application.
* Review analytics every 2 weeks and double down on what gets clicks.

---

## SECTION 8: STRICT EXECUTION PHASES

* **Phase 1: Foundation**
  Astro hybrid + Vercel adapter, Tailwind, `BaseLayout`, `GlassCard`, `StatusBadge`, `PrimaryButton`, basic `index.astro` grid, analytics installed.
  *Done when:* grid renders responsively and analytics receives a pageview.

* **Phase 2: Core Tiles + Live Infrastructure Signals**
  `HeroTile`, `AvailabilityTile`, `SocialsTile`, `Navbar`, `Footer`, `/api/health`, `execution_log` table, `/api/metrics`, `MetricsTile`.
  *Done when:* StatusBadge reflects real n8n state and MetricsTile shows real numbers.

* **Phase 3: Business Workflows + Case Studies**
  Content collection + `CaseStudyLayout` + `[slug].astro`. Port `NeuralChatTile` and `LeadEnrichmentTile` with Turnstile, proxy endpoints, logging and case studies. Add `SecurityTile`.
  *Done when:* two full case studies are live with diagram, video, repo link and working demo.

* **Phase 4: Voice Receptionist + Placeholder**
  `ReceptionistTile` with consent note and caps, `InboundOpsTile` placeholder, voice case study.

* **Phase 5: FitSync (lightweight)**
  `FitSyncTile` and `/demo/fit-sync` page using the dual-mode workflow.

* **Phase 6: Hardening & Launch**
  Rate limiting, spend caps, injection test log, fallback videos, Lighthouse and accessibility pass, SEO/OG, `ProofTile` content, final copy review.
  *Done when:* all quality gates in Section 9 pass.

* **Phase 7: Distribution**
  Publish posts, push repos/templates, update resume and LinkedIn, begin bi-weekly analytics review. Then build Workflow 04 and add its case study.

---

## SECTION 9: QUALITY GATES (must pass before launch)

- [ ] No browser-to-n8n direct calls; all demos go through the proxy with Turnstile.
- [ ] Offline test: stop Docker, confirm graceful fallbacks everywhere.
- [ ] Abuse test: oversized file, rapid repeated requests, and injection prompts are all handled.
- [ ] No secrets in repo or exported workflow JSON.
- [ ] Every metric on the page comes from real data (no invented numbers).
- [ ] Mobile layout reviewed on a real phone.
- [ ] Lighthouse >= 90 across categories (mobile).
- [ ] Each case study includes "what broke" and cost/latency.
- [ ] CTA, resume download and analytics events verified end to end.

---

## SECTION 10: ITEMS TO CONFIRM BEFORE BUILDING

1. Calendly: the link goes in an env variable, PUBLIC_BOOKING_URL, so you can add it whenever it's ready.
2. Who I help (draft, edit freely): "I help e-commerce and service businesses turn inbound leads, calls and support requests into automated, reliable workflows, self-hosted and secure."
3. Proof statement instead of a quote (draft): "I don't just demo AI, I run it. Three workflows live on my own infrastructure, a 24/7 agent that answers questions on my behalf, and a Blue Team SOC lab I built during my internship. Coming from hospitality, maritime and international gaming, I automate for how businesses actually operate." I built it only from things we know are true. If you earned Latin honors, add it as a line of its own, since it's a strong credential.
4. Real numbers: n8n prunes old executions by default (roughly 14 days), so export or screenshot your execution counts and success rates soon. Phase 2 sets up logging so every future run is recorded.
5. Fresh Vercel project: keep v1 live on the domain until v2 is ready, use the .vercel.app preview URL while building, and move the domain over at launch.
