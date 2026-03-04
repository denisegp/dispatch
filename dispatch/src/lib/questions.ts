export const BRAND = "#1800AC";

export const CHANNELS = [
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "newsletter", label: "Client newsletter", icon: "📧" },
  { id: "commentary", label: "Market commentary & press", icon: "📊" },
  { id: "quarterly", label: "Quarterly letters", icon: "📄" },
  { id: "blog", label: "Blog / website", icon: "🌐" },
  { id: "substack", label: "Substack", icon: "✍️" },
  { id: "internal", label: "Internal memos", icon: "🏢" },
];

export const CH_STATUS = [
  { id: "active", label: "Yes, actively" },
  { id: "occasional", label: "Occasionally" },
  { id: "want", label: "Want to start" },
];

export const TOPICS = [
  { id: "rates", label: "Interest rates & Fed", icon: "📈" },
  { id: "private_credit", label: "Private credit", icon: "🏦" },
  { id: "ai_markets", label: "AI & markets", icon: "🤖" },
  { id: "esg", label: "ESG investing", icon: "🌱" },
  { id: "geopolitical", label: "Geopolitical risk", icon: "🌐" },
  { id: "wealth_transfer", label: "Wealth transfer", icon: "👥" },
  { id: "inflation", label: "Inflation & real assets", icon: "💰" },
  { id: "volatility", label: "Market volatility", icon: "📊" },
  { id: "regulation", label: "Regulatory change", icon: "⚖️" },
  { id: "retirement", label: "Retirement & longevity", icon: "🎯" },
  { id: "credit", label: "Credit & fixed income", icon: "📋" },
  { id: "equity", label: "Equity & valuations", icon: "💹" },
];

export const TONES = [
  { id: "analytical", label: "Analytical", tag: "Data-led, mechanism-focused", excerpt: "The 10-year yield reflects three forces: growth expectations, inflation premium, and term premium. When all shift simultaneously, duration is no longer a hedge — it is an exposure." },
  { id: "conversational", label: "Conversational", tag: "Warm, relationship-first", excerpt: "A client asked last week whether they should be worried. I said: worry is not a portfolio strategy. The clients who do best are the ones who trust the most." },
  { id: "direct", label: "Direct", tag: "Conviction-led, says what it means", excerpt: "Diversification is not a strategy. It is a hedge against not having one. Advisors who outperform understood three things deeply and acted on that conviction." },
  { id: "educator", label: "Educator", tag: "Explains complex things simply", excerpt: "Most people think duration is just a number on a fact sheet. What it actually tells you is how much your bond price moves for a given rate change. Once you understand that, a lot of things click." },
];

export const AUDIENCE = [
  { id: "prospects", label: "Mostly prospective clients" },
  { id: "existing", label: "Mostly existing clients" },
  { id: "peers", label: "Mostly industry peers" },
  { id: "other", label: "Other", hasInput: true },
];

export const FOLLOWERS = [
  { id: "f1", label: "Under 1,000" },
  { id: "f2", label: "1,000–5,000" },
  { id: "f3", label: "5,000–20,000" },
  { id: "f4", label: "20,000+" },
  { id: "f5", label: "Not sure" },
];

export const CONNECTIONS = [
  { id: "c1", label: "Under 200" },
  { id: "c2", label: "200–1,000" },
  { id: "c3", label: "1,000–5,000" },
  { id: "c4", label: "5,000+" },
  { id: "c5", label: "Not sure" },
];

export const INTENTS = [
  { id: "trust", label: "Trust — confidence my capital is in thoughtful hands" },
  { id: "informed", label: "Clarity — a clearer understanding of something complex" },
  { id: "ahead", label: "Edge — a sense of being ahead of the mainstream" },
  { id: "contact", label: "Conversation — a reason to reach out" },
  { id: "loyalty", label: "Reassurance — nothing has changed about my approach" },
];

export const BARRIERS = [
  { id: "time", label: "Finding the time" },
  { id: "blank", label: "Knowing where to start" },
  { id: "compliance", label: "Not sure what I am allowed to say" },
  { id: "quality", label: "Turning drafts into something good enough" },
  { id: "audience", label: "Not sure anyone would want to read it" },
  { id: "promo", label: "Worried it will feel self-promotional" },
  { id: "irregular", label: "Staying consistent" },
];

export const WORKING = [
  { id: "frequent", label: "Multiple times a week" },
  { id: "weekly", label: "Once a week" },
  { id: "biweekly", label: "Every two weeks" },
  { id: "monthly", label: "Once a month or less" },
];

export const CONTENT_TYPES = [
  { id: "takes", label: "Original takes & opinions" },
  { id: "updates", label: "Market updates & commentary" },
  { id: "faqs", label: "Answering client questions" },
  { id: "stories", label: "Personal stories & lessons" },
  { id: "data", label: "Data & charts" },
  { id: "career", label: "Career & industry observations" },
];

export const CAT_COLORS: Record<string, string> = {
  CHANNELS: "#1800AC",
  ROLE: "#0062CC",
  TOPICS: "#1a7a4a",
  EXPERTISE: "#6B3FA0",
  STYLE: "#B45309",
  AUDIENCE: "#0F766E",
  INTENT: "#C0152A",
  LINKEDIN: "#374151",
};

export const QUESTIONS = [
  { id: 1, cat: "CHANNELS", label: "How you communicate", q: "Which channels do you use or want to use?", hint: "Select all that apply.", type: "channels", why: "Most professionals communicate across more than one format. Selecting your channels now means we can apply your voice consistently everywhere." },
  { id: 2, cat: "ROLE", label: "How you describe yourself", q: "What do you do, and who do you do it for?", hint: "Include your role, who you serve, how long you have been doing this, your seniority, and how you measure success.", type: "textarea", why: "We use this to frame every piece of content around your actual role — not a generic one." },
  { id: 3, cat: "TOPICS", label: "What you write about", q: "Which topics do you find yourself returning to most?", hint: "Pick as many as feel right.", type: "multi", why: "Your topic selection tells us where your expertise lives and what your audience expects from you." },
  { id: 4, cat: "EXPERTISE", label: "What clients ask you", q: "What do you find yourself explaining to clients over and over?", hint: "The questions you have answered so many times you could do them in your sleep.", type: "textarea", dynamic: true, why: "These become your evergreen content — posts that keep performing because they answer real questions." },
  { id: 5, cat: "STYLE", label: "How you sound", q: "Which of these sounds most like you?", hint: "Pick the one that fits — even if not perfect.", type: "tone", why: "Voice is the hardest thing to fake and the most important thing to get right." },
  { id: 6, cat: "AUDIENCE", label: "Your LinkedIn audience", q: "Who is your LinkedIn audience?", hint: "Who are you primarily writing for on LinkedIn?", type: "audience", why: "Your LinkedIn audience shapes the register, vocabulary, and assumed knowledge level of every post." },
  { id: 7, cat: "INTENT", label: "The outcome you create", q: "When someone reads your content, what should they walk away with?", hint: "Put your primary goal at the top.", type: "rank", why: "Your intent shapes tone, depth, and call to action. Ranking forces a real choice and gives us a priority signal for every draft." },
  { id: 8, cat: "LINKEDIN", label: "Publishing experience", q: "_dynamic_", hint: "No wrong answers.", type: "linkedin_exp", dynamic_q: true, why: "Understanding where you are now helps us remove the right friction — or build on what is already working." },
];
