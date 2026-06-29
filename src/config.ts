export interface SiteConfig {
  language: string;
  siteTitle: string;
  siteDescription: string;
}

export interface NavigationLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  brandName: string;
  links: NavigationLink[];
}

export interface HeroConfig {
  eyebrow: string;
  titleLines: string[];
  leadText: string;
  supportingNotes: string[];
}

export interface ManifestoConfig {
  videoPath: string;
  text: string;
}

export interface FacilityArticle {
  title: string;
  paragraphs: string[];
}

export interface FacilityItem {
  slug: string;
  name: string;
  code: string;
  address: string;
  status: string;
  email: string;
  phone: string;
  ctaText: string;
  ctaHref: string;
  image: string;
  utcOffset: number;
  article: FacilityArticle;
}

export interface FacilitiesConfig {
  sectionLabel: string;
  detailBackText: string;
  detailNotFoundText: string;
  detailReturnText: string;
  items: FacilityItem[];
}

export interface ObservationConfig {
  sectionLabel: string;
  videoPath: string;
  statusText: string;
  latLabel: string;
  lonLabel: string;
  initialLat: number;
  initialLon: number;
}

export interface ArchiveItem {
  src: string;
  label: string;
}

export interface ArchivesConfig {
  sectionLabel: string;
  vaultTitle: string;
  closeText: string;
  items: ArchiveItem[];
}

export interface FooterConfig {
  copyrightText: string;
  statusText: string;
}

export const siteConfig: SiteConfig = {
  language: "en",
  siteTitle: "BugRoom — AI Incident War Room",
  siteDescription: "BugRoom turns screenshots of broken UIs into live multi-agent investigations. Upload, paste, or drag-drop a screenshot and watch specialized AI agents investigate from every angle in real time.",
};

export const navigationConfig: NavigationConfig = {
  brandName: "BugRoom",
  links: [
    { label: "Agents", href: "#agents" },
    { label: "Live Feed", href: "#feed" },
    { label: "Archives", href: "#archives" },
  ],
};

export const heroConfig: HeroConfig = {
  eyebrow: "Screenshot-Based AI Incident Room",
  titleLines: ["OPEN A", "WAR ROOM", "AROUND IT"],
  leadText: "BugRoom is not just analyze this screenshot. It is open a live AI war room around this screenshot and show how the investigation happens.",
  supportingNotes: [
    "Upload, paste, drag-drop, or auto-import from a watched folder. Enter your question. BugRoom creates an incident and starts the investigation.",
    "Multiple primary agents investigate in parallel, spawning specialist subagents for narrower tasks. The UI streams their progress in real time.",
    "The system produces a final consensus with the likely root cause, suggested fix, and ordered next steps. Export or promote findings to reusable playbooks.",
  ],
};

export const manifestoConfig: ManifestoConfig = {
  videoPath: "/videos/manifesto-process.mp4",
  text: "You give BugRoom a screenshot of a broken UI, error state, or confusing screen, and it turns that into a live investigation. Instead of showing one flat answer, BugRoom presents a swarm of specialized agents working on the same incident from different angles. Primary agents investigate in parallel, spawn specialist subagents for narrower tasks, and coordinate through a visible timeline of room activity. The UI streams their progress, status changes, and coordination events in real time. When the investigation converges, the system produces a final consensus with the likely root cause, suggested fix, and ordered next actions. Operator controls let you adjust autonomy level, allow or block subagent spawning, and set concurrency limits. Useful specialist outputs can be promoted into reusable room knowledge, building a growing playbook of institutional debugging memory.",
};

export const facilitiesConfig: FacilitiesConfig = {
  sectionLabel: "Primary Agent Roster",
  detailBackText: "Back to Roster",
  detailNotFoundText: "Agent not found in the roster.",
  detailReturnText: "Return to Agent Roster",
  items: [
    {
      slug: "ui-analyzer",
      name: "UI Analyzer",
      code: "UIA-01",
      address: "Visual Structure & Layout Division",
      status: "Specialist: DOM tree analysis, CSS cascade inspection, render layer detection",
      email: "confidence: 0.94",
      phone: "avg response: 2.3s",
      ctaText: "View Agent Profile",
      ctaHref: "#",
      image: "/images/agent-ui-analyzer.jpg",
      utcOffset: 0,
      article: {
        title: "UI Analyzer — Visual Structure & Layout Specialist",
        paragraphs: [
          "The UI Analyzer is the first responder for any screenshot-based incident. Its primary function is to decompose the visual structure of the captured interface into a hierarchical model of DOM elements, CSS properties, and computed styles. When an incident begins, this agent performs a rapid visual audit, identifying layout containers, alignment relationships, and style dependencies that may contribute to the observed bug.",
          "Beyond static analysis, the UI Analyzer maintains a live understanding of the CSS cascade, specificity conflicts, and inheritance chains that affect each visible element. It can detect z-index stacking issues, overflow containment failures, flexbox and grid misconfigurations, and responsive breakpoint anomalies. When the visual evidence suggests a deeper structural problem, it spawns subagents specializing in animation frame analysis, render layer isolation, and cross-browser compatibility verification.",
          "The agent outputs a structured visual report with annotated overlays highlighting suspect regions, a ranked list of probable layout causes, and recommended verification steps. Its findings feed directly into the consensus builder, where they are weighted against evidence from the Log Parser, State Inspector, and Network Probe to produce the final incident assessment.",
        ],
      },
    },
    {
      slug: "log-parser",
      name: "Log Parser",
      code: "LOG-02",
      address: "Error Trace & Log Analysis Division",
      status: "Specialist: Stack trace decoding, error pattern matching, log correlation",
      email: "confidence: 0.91",
      phone: "avg response: 1.8s",
      ctaText: "View Agent Profile",
      ctaHref: "#",
      image: "/images/agent-log-parser.jpg",
      utcOffset: 0,
      article: {
        title: "Log Parser — Error Trace & Log Analyst",
        paragraphs: [
          "The Log Parser agent ingests console output, error traces, and application logs to build a temporal narrative of what failed and when. It correlates timestamps across log sources, groups related error instances into clusters, and identifies the earliest observable failure point in a cascade of dependent errors. This temporal reconstruction is critical for distinguishing root causes from downstream symptoms.",
          "Operating with a comprehensive pattern library of known framework errors, browser exceptions, and runtime failure modes, the Log Parser can rapidly classify unfamiliar errors by structural similarity to documented patterns. It performs fuzzy matching against internal knowledge bases and external documentation, extracting relevant fixes and workarounds from community-verified sources.",
          "When log evidence is insufficient or ambiguous, the agent spawns subagents for source map resolution, minified code reconstruction, and third-party dependency audit. Its final output includes a chronological event sequence, error severity classification, correlation confidence scores, and a ranked set of most likely originating code locations with suggested patches.",
        ],
      },
    },
    {
      slug: "state-inspector",
      name: "State Inspector",
      code: "STI-03",
      address: "Data Flow & State Investigation Division",
      status: "Specialist: Component state audit, prop drilling detection, store consistency checks",
      email: "confidence: 0.89",
      phone: "avg response: 3.1s",
      ctaText: "View Agent Profile",
      ctaHref: "#",
      image: "/images/agent-state-inspector.jpg",
      utcOffset: 0,
      article: {
        title: "State Inspector — Data Flow & State Investigator",
        paragraphs: [
          "The State Inspector examines the runtime data architecture of the application at the moment the bug was captured. It maps component hierarchies against their declared state interfaces, identifies prop drilling chains, and verifies store consistency across reactive boundaries. Its analysis reveals when displayed data diverges from source of truth, pinpointing synchronization failures and stale state propagation.",
          "This agent specializes in detecting anti-patterns that lead to state desynchronization: mutable state passed by reference, async race conditions in state transitions, missing dependency arrays in effect hooks, and improper cleanup of subscriptions or event listeners. It models the expected data flow and compares it against observed state snapshots to identify divergence points.",
          "For complex state management architectures, the State Inspector can spawn subagents specializing in Redux store tracing, MobX reaction graph analysis, or Context API performance profiling. Its findings include a state dependency graph, identified inconsistency points with confidence ratings, and recommended state architecture refactorings to prevent recurrence.",
        ],
      },
    },
    {
      slug: "network-probe",
      name: "Network Probe",
      code: "NET-04",
      address: "API & Network Diagnostics Division",
      status: "Specialist: Request tracing, response validation, latency analysis",
      email: "confidence: 0.92",
      phone: "avg response: 2.7s",
      ctaText: "View Agent Profile",
      ctaHref: "#",
      image: "/images/agent-network-probe.jpg",
      utcOffset: 0,
      article: {
        title: "Network Probe — API & Network Diagnostics Specialist",
        paragraphs: [
          "The Network Probe monitors all network activity associated with the application state captured in the screenshot. It traces API request and response pairs, validates payload schemas against documented contracts, and measures latency distributions across the call graph. Its analysis identifies failed requests, timeout patterns, and response corruption that may explain missing or incorrect UI data.",
          "Beyond simple request tracking, this agent performs dependency chain analysis to determine which API calls are blockers for rendered content. It detects N+1 query patterns, cache invalidation failures, authentication token expiration cascades, and CORS configuration errors that manifest as silent data absence rather than explicit error states.",
          "When network analysis suggests infrastructure-level issues, the agent spawns subagents for CDN edge diagnostics, DNS resolution tracing, and TLS handshake verification. Its output includes a complete request waterfall, identified bottleneck calls with latency heatmaps, schema deviation reports, and recommended API contract updates or caching strategy adjustments.",
        ],
      },
    },
  ],
};

export const observationConfig: ObservationConfig = {
  sectionLabel: "Live Investigation Feed",
  videoPath: "/videos/observation-feed.mp4",
  statusText: "Room Active — Streaming",
  latLabel: "AGENTS:",
  lonLabel: "EVENTS:",
  initialLat: 4,
  initialLon: 127,
};

export const archivesConfig: ArchivesConfig = {
  sectionLabel: "Incident Archives",
  vaultTitle: "Open Incident Vault",
  closeText: "Close Vault",
  items: [
    {
      src: "/images/archive-login-bug.jpg",
      label: "Login Form Critical Failure — Resolved",
    },
    {
      src: "/images/archive-layout-bug.jpg",
      label: "CSS Layout Collapse Cascade — Resolved",
    },
    {
      src: "/images/archive-api-bug.jpg",
      label: "API Error Storm 502/504 — Resolved",
    },
    {
      src: "/images/archive-state-bug.jpg",
      label: "State Desync Data Drift — Resolved",
    },
  ],
};

export const footerConfig: FooterConfig = {
  copyrightText: "BugRoom AI Incident Systems",
  statusText: "All Rooms Operational",
};
