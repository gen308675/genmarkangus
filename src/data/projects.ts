export type Project = {
  slug: string;
  title: string;
  tagline: string;
  points: string[];
  tags: string[];
  status: 'live' | 'soon';
  videoId?: string;   // YouTube video ID, the 11 characters after v= in the URL
  caseHref?: string;
  repoHref?: string;  // public GitHub link to the sanitized workflow JSON
};

export const projects: Project[] = [
  {
    slug: 'chat-agent',
    title: 'Neural Mirror: chat agent',
    tagline: 'A 24/7 RAG agent that answers recruiter questions about me from a vector knowledge base.',
    points: [
      'Searches a Supabase pgvector knowledge base before every answer',
      'Per-visitor memory and an injection-resistant prompt, behind Turnstile and rate limits',
      'Every run is logged to Supabase and feeds the live metrics tile',
    ],
    tags: ['n8n', 'Gemini', 'Supabase pgvector', 'RAG'],
    status: 'live',
  },
  {
    slug: 'voice-intake',
    title: 'Voice intake',
    tagline: 'Talk to the AI or leave a voice message: audio in, structured data and email out.',
    points: [
      'Speech-to-text, then the same agent answers out loud',
      'Voice messages become structured JSON: name, email, urgency, action items',
      'Two-step dispatch: the caller reviews the transcript before the email is sent',
    ],
    tags: ['n8n', 'Speech-to-text', 'Gemini', 'Gmail'],
    status: 'live',
  },
  {
    slug: 'inbound-lead-ops',
    title: 'Inbound lead operations',
    tagline: 'Enrichment, scoring and routing for inbound leads, with a human approving every reply.',
    points: [
      'Email verification and enrichment, cached per lead',
      'Explainable 0 to 100 score: deterministic rules plus AI fit, with a breakdown',
      'Triage, drafted reply, HubSpot sync and Slack approval before anything is sent',
    ],
    tags: ['n8n', 'Gemini', 'Supabase', 'HubSpot', 'Slack'],
    status: 'live',
  },
];