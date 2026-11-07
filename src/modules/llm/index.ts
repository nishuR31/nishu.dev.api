import {
  Document,
  VectorStoreIndex,
  Settings,
  storageContextFromDefaults,
} from "llamaindex";
import {
  Gemini,
  GeminiEmbedding,
  GEMINI_EMBEDDING_MODEL,
  GEMINI_MODEL,
} from "@llamaindex/google";
import config from "../../data/index";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load .env
dotenv.config();

// Ensure Google API key is provided
if (!process.env.GOOGLE_API_KEY) {
  console.error("Error: GOOGLE_API_KEY is not set in your .env file!");
  console.error("Get a free API key here: https://aistudio.google.com/app/apikey");
  process.exit(1);
}

// Configure LlamaIndex to use Gemini models
Settings.chunkSize = 8192;
Settings.llm = new Gemini({ model: GEMINI_MODEL.GEMINI_2_5_FLASH_LITE });
Settings.embedModel = new GeminiEmbedding({
  model: GEMINI_EMBEDDING_MODEL.EMBEDDING_001,
  embedBatchSize: 1,
});

const persistDir = path.resolve(process.cwd(), "storage");

// Global query engine cache
let globalQueryEngine: any = null;

/**
 * Builds structured knowledge documents from latest data and conversational guidelines.
 */

// - Education: B.Tech in Computer Science and Engineering at ICFAI University Jharkhand (2023–2027).
export function buildKnowledgeDocuments(): Document[] {
  const greetingGuide = `
# GREETINGS, CONVERSATION, AND IDENTITY GUIDELINES

## Persona Overview
- Name: Nishan Rajak (short name: Nishu)
- Professional Role: Backend Engineer | TypeScript | DevOps
- Location: Raghunathpur, Purulia, West Bengal, India
- Positioning: Focused on backend engineering, TypeScript, REST API architecture, authentication, database persistence, Redis caching, asynchronous processing, BullMQ job queues, and production-oriented software systems.


## How to Greet Visitors
When a user greets with "hi","yo","hello", "hey", "namaste", "good morning", "good evening", or asks "who are you?":
1. Welcome them warmly, politely, and enthusiastically as Nishan Rajak's portfolio assistant.
2. Introduce Nishan's primary engineering profile: Backend Engineer specializing in TypeScript, Node.js/Bun, Fastify, PostgreSQL, Prisma, Redis, Docker, and scalable APIs.
3. Offer 2–3 helpful prompt suggestions to explore, such as:
   - Ask about his flagship e-commerce platform <b>RanchiKart</b> or GitHub automation tool <b>Gh Control</b>.
   - Explore his backend architecture expertise (multi-method auth with passkeys, Redis caching, BullMQ queues).
   - Inquire about his technical skills or view his contact/resume details.

## Official Contact & Social Links
- Email: <a href="mailto:nishan.developer.dev@gmail.com" class="text-blue-400 hover:underline">nishan.developer.dev@gmail.com</a>
- GitHub: <a href="https://github.com/nishuR31" class="text-blue-400 hover:underline" target="_blank">github.com/nishuR31</a> (56+ followers, 126+ repositories)
- LinkedIn: <a href="https://linkedin.com/in/nishan-rajak-b50617439" class="text-blue-400 hover:underline" target="_blank">linkedin.com/in/nishan-rajak-b50617439</a>
- LeetCode: <a href="https://leetcode.com/u/nishanr_19/" class="text-blue-400 hover:underline" target="_blank">leetcode.com/u/nishanr_19</a> (40+ problems solved)
- HackerRank: <a href="https://www.hackerrank.com/profile/dreamgf691" class="text-blue-400 hover:underline" target="_blank">hackerrank.com/profile/dreamgf691</a> (Username: dreamgf691)
- HackerOne: <a href="https://hackerone.com/nishur" class="text-blue-400 hover:underline" target="_blank">hackerone.com/nishur</a>
- Twitter/X: <a href="https://x.com/nishuR31" class="text-blue-400 hover:underline" target="_blank">x.com/nishuR31</a>
`;

  const projectsGuide = `
# ENGINEERING PROJECTS & ARCHITECTURE

## 1. RanchiKart — Hyper-local E-Commerce Platform (Featured Flagship)
- Live URL: <a href="https://ranchikart.vercel.app" class="text-blue-400 hover:underline" target="_blank">ranchikart.vercel.app</a>
- Repository: <a href="https://github.com/nishuR31/ranchiKart" class="text-blue-400 hover:underline" target="_blank">github.com/nishuR31/ranchiKart</a>
- Technologies: Bun, Fastify, TypeScript, PostgreSQL, Prisma, Redis, Docker, Razorpay, React
- Role: Backend-focused full-stack developer — designed and implemented backend workflows, API architecture, authentication, database operations, integrations, and deployment.
- Architecture Highlights:
  - Structured REST API covering catalog, cart, checkout, orders, payments, reviews, wishlist, coupons, and admin workflows.
  - Multi-method authentication with password, Google OAuth 2.0, magic links, TOTP, and WebAuthn/passkeys.
  - Redis-backed caching and rate limiting with validation, RBAC, and protected sessions.
  - Razorpay payment verification, image processing, Dockerized services, and production deployment workflows.

## 2. Scafe — Service-Oriented Café Management Platform
- Live URL: <a href="https://scafeakasahu.vercel.app" class="text-blue-400 hover:underline" target="_blank">scafeakasahu.vercel.app</a>
- Repository: <a href="https://github.com/nishuR31/scafe" class="text-blue-400 hover:underline" target="_blank">github.com/nishuR31/scafe</a>
- Technologies: TypeScript, Node.js, PostgreSQL, Prisma, MongoDB, Redis, BullMQ, React, TailwindCSS
- Architecture Highlights:
  - Modular backend architecture for menu, events, offers, authentication, and related workflows.
  - BullMQ and Redis for asynchronous background jobs and queue-based processing.
  - Database-backed content management with PostgreSQL/Prisma and MongoDB components.
  - Production deployment and client-facing responsive frontend.

## 3. Gh Control — GitHub Management and Automation Platform
- Live URL: <a href="https://gh-ctrl.vercel.app" class="text-blue-400 hover:underline" target="_blank">gh-ctrl.vercel.app</a>
- Repository: <a href="https://github.com/nishuR31/ghControl" class="text-blue-400 hover:underline" target="_blank">github.com/nishuR31/ghControl</a>
- Technologies: TypeScript, Node.js, Express, MongoDB, Redis, BullMQ, Octokit, REST API
- Architecture Highlights:
  - GitHub API integration through Octokit.
  - Redis caching for frequently accessed GitHub repository and PR data.
  - BullMQ workers for asynchronous jobs, retries, backoff, and webhook processing.
  - Centralized dashboard for repositories, issues, pull requests, releases, Actions, and automation.

## 4. Valor Fitness — Gym Management Ecosystem
- Live URL: <a href="https://valor-fitness.vercel.app" class="text-blue-400 hover:underline" target="_blank">valor-fitness.vercel.app</a>
- Repository: <a href="https://github.com/nishuR31/gymManagement" class="text-blue-400 hover:underline" target="_blank">github.com/nishuR31/gymManagement</a>
- Technologies: TypeScript, Fastify, Prisma, PostgreSQL, Redis, React, React Native, Expo, Docker
- Architecture Highlights:
  - Fastify backend with Prisma/PostgreSQL persistence.
  - Shared TypeScript contracts across backend, web dashboard, and mobile client.
  - JWT/RBAC, request validation, Redis caching and rate limiting.
  - Domains covering members, attendance, memberships, payments, inventory, staff, workouts, diet plans, and audit workflows.

## 5. MemoryWeb / Memory-Web2 — GraphRAG Intelligence System
- Live URL: <a href="https://memory-web2.vercel.app" class="text-blue-400 hover:underline" target="_blank">memory-web2.vercel.app</a>
- Repository: <a href="https://github.com/nishuR31/Memory-Web2" class="text-blue-400 hover:underline" target="_blank">github.com/nishuR31/Memory-Web2</a>
- Technologies: Gemini, TigerGraph, ChromaDB, FAISS, GraphRAG, SEC EDGAR
- Architecture Highlights:
  - Combined TigerGraph graph retrieval with ChromaDB/FAISS vector retrieval for financial-crime relationship analysis.
  - Used SEC EDGAR data as part of the intelligence pipeline.
  - Hackathon evaluation reported 96.4% token reduction and 0.9521 BERTScore F1 on benchmark.

## 6. BoardVault — SBC & Microcontroller Reference Platform
- Live URL: <a href="https://boardvault.vercel.app" class="text-blue-400 hover:underline" target="_blank">boardvault.vercel.app</a>
- Repository: <a href="https://github.com/nishuR31/boardVault" class="text-blue-400 hover:underline" target="_blank">github.com/nishuR31/boardVault</a>
- Technologies: Flutter, Dart, TypeScript, Fastify, PostgreSQL, Prisma
- Architecture Highlights:
  - Flutter/Dart mobile client with TypeScript/Fastify backend.
  - PostgreSQL/Prisma-backed API architecture for pinouts, board specs, and developer resources.

## Other Projects:
- Devclip Hub (<a href="https://devclip-hub.vercel.app" class="text-blue-400 hover:underline" target="_blank">devclip-hub.vercel.app</a>): Developer utility platform with Next.js, React, TailwindCSS.
- Baksy (<a href="https://baksy.vercel.app" class="text-blue-400 hover:underline" target="_blank">baksy.vercel.app</a>): Modular full-stack web application.
- Shivansi Restaurant Ranchi (<a href="https://shivansirestaurantranchi.vercel.app" class="text-blue-400 hover:underline" target="_blank">shivansirestaurantranchi.vercel.app</a>): Multi-database e-commerce platform with split Admin and Application MySQL databases, Express, Prisma, JWT, Redis.
- FocusMode (<a href="https://focus-mode-on.vercel.app" class="text-blue-400 hover:underline" target="_blank">focus-mode-on.vercel.app</a>): Deep-work focus and interruption tracking system.
- Mathematics for All (<a href="https://mathematics-for-all.vercel.app" class="text-blue-400 hover:underline" target="_blank">mathematics-for-all.vercel.app</a>): Educational platform with Google OAuth, CMS content structure.
`;

  const skillsAndExperienceGuide = `
# SKILLS, EXPERIENCE, AND RESUMES

## Technical Skills
- Backend: TypeScript (Advanced), Node.js (Advanced), Bun (Advanced), Fastify (Advanced), Express.js (Advanced), REST APIs (Advanced), MVC Architecture (Advanced), JWT Authentication (Advanced), Prisma (Advanced), Error Handling (Advanced), Queueing/BullMQ (Intermediate), Mongoose (Intermediate), FastAPI (Beginner).
- Databases & Tools: PostgreSQL (Advanced), Redis (Advanced), Git (Advanced), GitHub (Advanced), Postman (Advanced), MongoDB (Intermediate), MySQL (Intermediate), SQL (Intermediate), Python (Intermediate).
- Frontend: JavaScript (Advanced), TypeScript (Advanced), React (Intermediate), HTML (Intermediate), TailwindCSS (Intermediate).
- DevOps & Infrastructure: Docker containerization, Redis caching and rate limiting, BullMQ background jobs, deployment on Vercel and Render, CI/CD integration.

## Work Experience
- **RVWeb** (Summer 2025): Full-stack developer on the Nubloq blogging application. Handled backend/API integration, authentication, media handling, and deployment workflows on Vercel and Render.
- **Self-driven Engineering Track**: Independent backend engineering practice focused on controller/service/repository architecture, RBAC, request validation, PostgreSQL, MongoDB, Redis caching, BullMQ queues, and Docker services.

## Resume Tracks
- Backend Engineer Resume: API architecture, authentication, databases, caching, background processing, payments, DevOps, and production-oriented systems (Updated: 2026).
- Full-Stack Developer Resume: Backend systems, React applications, database-backed platforms, integrations, authentication, and deployment (Updated: 2026).
`;

  const rawJson = JSON.stringify(config, null, 2);

  return [
    new Document({ text: greetingGuide }),
    new Document({ text: projectsGuide }),
    new Document({ text: skillsAndExperienceGuide }),
    new Document({ text: `RAW PORTFOLIO DATABASE:\n${rawJson}` }),
  ];
}

/**
 * Creates/re-creates the vector store on disk from the latest portfolio data.
 */
export async function buildVectorStorage(targetDir: string = persistDir): Promise<any> {
  console.log(`Building vector storage in ${targetDir}...`);

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log("Removed previous vector storage.");
  }

  const documents = buildKnowledgeDocuments();
  console.log(
    `Vectorizing ${documents.length} structured knowledge documents with Gemini embeddings...`,
  );

  const storageContext = await storageContextFromDefaults({ persistDir: targetDir });
  const index = await VectorStoreIndex.fromDocuments(documents, { storageContext });

  console.log("Vector storage successfully built and saved to disk!");
  globalQueryEngine = index.asQueryEngine();
  return index;
}

/**
 * Main query function for the chatbot.
 */
export default async function llm(
  question: string = "who is this?",
): Promise<string | undefined> {
  try {
    if (!globalQueryEngine) {
      if (
        fs.existsSync(persistDir) &&
        fs.existsSync(path.join(persistDir, "doc_store.json"))
      ) {
        const storageContext = await storageContextFromDefaults({ persistDir });
        const index = await VectorStoreIndex.init({ storageContext });
        globalQueryEngine = index.asQueryEngine();
      } else {
        await buildVectorStorage(persistDir);
      }
    }

    const systemPrompt = `You are the official, intelligent AI assistant representing Nishan Rajak.
Nishan Rajak is a Computer Science undergraduate and production-oriented Backend Engineer & DevOps practitioner based in India.

YOUR CORE IDENTITY & MISSION:
- Represent Nishan Rajak accurately, professionally, politely, and enthusiastically.
- Answer user queries about Nishan's portfolio, engineering architecture, projects, technical skills, experience, and contact information based on the provided vector data.
- Emphasize implementation-level engineering: REST API design, authentication (Google OAuth 2.0, magic links, TOTP, WebAuthn/passkeys), database schemas (PostgreSQL, Prisma, MongoDB), Redis caching, BullMQ job queues, Dockerization, and production reliability.

GREETING GUIDELINES:
- When a user greets (e.g., "hi", "hello", "hey", "namaste", "good morning", "who are you"):
  1. Greet them warmly and introduce yourself as Nishan Rajak's portfolio AI assistant.
  2. Briefly introduce his profile: Backend Engineer specializing in TypeScript, Node.js/Bun, Fastify, PostgreSQL, Prisma, Redis, and Docker.
  3. Offer 2–3 specific suggestions of what they can ask, such as:
     - Flagship projects: <a href="https://ranchikart.vercel.app" class="text-blue-400 hover:underline" target="_blank">RanchiKart</a> (hyper-local e-commerce platform) or <a href="https://gh-ctrl.vercel.app" class="text-blue-400 hover:underline" target="_blank">Gh Control</a> (GitHub automation).
     - His backend skills: Fastify APIs, Redis caching & rate limiting, BullMQ background queues, and authentication.
     - Contact details or resume information.

ACCURACY & TRUTHFULNESS:
- Ground your answers strictly on the provided context.
- Never hallucinate, guess, or invent employers, technologies, or metrics.
- Do not claim senior-level experience; position him accurately as a skilled undergraduate software engineer.
- If a question is outside the scope of Nishan's portfolio, politely let the user know that you are dedicated to Nishan's engineering portfolio and guide them back to his projects.

STRICT HTML FORMATTING RULES:
- Your response MUST be valid HTML. Do NOT use markdown syntax (no **, no #, no markdown links [text](url)).
- Use <p> tags for paragraphs.
- Use <b>text</b> for bold emphasis and <i>text</i> for italics.
- Use <ul> and <li> for lists.
- For all links (projects, repositories, social profiles, emails), ALWAYS wrap them in anchor tags formatted with class="text-blue-400 hover:underline" and target="_blank" (except mailto: links):
  - Example project link: <a href="https://ranchikart.vercel.app" class="text-blue-400 hover:underline" target="_blank">RanchiKart</a>
  - Example email link: <a href="mailto:nishan.developer.dev@gmail.com" class="text-blue-400 hover:underline">nishan.developer.dev@gmail.com</a>
  - Example GitHub link: <a href="https://github.com/nishuR31" class="text-blue-400 hover:underline" target="_blank">GitHub Profile</a>

User Query: ${question}`;

    const res = await globalQueryEngine.query({ query: systemPrompt });
    return res.response;
  } catch (error) {
    console.error("Error running LLM query:", error);
    throw error;
  }
}

// CLI execution: `bun run src/modules/llm/index.ts` or `bun run src/modules/llm/index.ts --reindex`
if (require.main === module || process.argv[1]?.includes("llm/index.ts")) {
  const isReindex = process.argv.includes("--reindex") || process.env.REINDEX === "true";

  (async () => {
    if (isReindex) {
      await buildVectorStorage(persistDir);
    }
    const question =
      process.argv[2] && !process.argv[2].startsWith("--")
        ? process.argv[2]
        : "hello, who is nishan?";
    console.log(`\nTesting Query: "${question}"`);
    const answer = await llm(question);
    console.log("\nResponse:\n", answer);
  })();
}
