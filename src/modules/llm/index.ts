import {
  Document,
  Settings,
  VectorStoreIndex,
  storageContextFromDefaults,
} from "llamaindex";
import {
  Gemini,
  GeminiEmbedding,
  GEMINI_EMBEDDING_MODEL,
  GEMINI_MODEL_INFO_MAP,
  GEMINI_MODEL,
} from "@llamaindex/google";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import prisma from "../../providers/db.provider";

dotenv.config();

if (!process.env.GOOGLE_API_KEY) {
  console.error("Error: GOOGLE_API_KEY is not set in your .env file!");
  console.error("Get a free API key here: https://aistudio.google.com/app/apikey");
  process.exit(1);
}

Settings.chunkSize = 8192;
const currentChatModel = "gemini-3.8-flash" as GEMINI_MODEL;
(GEMINI_MODEL_INFO_MAP as Record<string, { contextWindow: number }>)[currentChatModel] = {
  contextWindow: 1_000_000,
};
Settings.llm = new Gemini({
  model: currentChatModel,
});
Settings.embedModel = new GeminiEmbedding({
  model: "gemini-embedding-001" as GEMINI_EMBEDDING_MODEL,
  embedBatchSize: 1,
});

const persistDir = path.resolve(process.cwd(), "storage");
let globalQueryEngine: any = null;

/**
 * Loads the current portfolio record and all public content managed by the admin.
 */
export async function buildKnowledgeDocuments(): Promise<Document[]> {
  const portfolio = await prisma.portfolioData.findFirst({
    include: {
      social: true,
      navItems: true,
      projects: true,
      skills: { include: { skills: true } },
      experiences: true,
      certificates: true,
      cvs: true,
      services: true,
      testimonials: true,
      education: true,
    },
  });

  if (!portfolio) {
    throw new Error("Cannot build vector storage: no portfolio data exists.");
  }

  const portfolioJson = JSON.stringify(portfolio, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  const assistantGuidance = `
# PORTFOLIO ASSISTANT GUIDELINES

Answer questions using only the current portfolio data in the companion document.
Never invent employers, projects, technologies, metrics, links, or personal details.
If requested information is absent, say so instead of guessing.

Return valid HTML: use <p> for paragraphs, <ul>/<li> for lists, <b>/<i> for
emphasis, and <a href="..." class="text-blue-400 hover:underline"
target="_blank">...</a> for links. For greetings, introduce the portfolio owner
using the current name, role, and tagline from the data, then suggest relevant
projects or skills from that same data.
`;

  return [
    new Document({ text: assistantGuidance }),
    new Document({ text: `CURRENT PORTFOLIO DATA:\n${portfolioJson}` }),
  ];
}

export async function buildVectorStorage(targetDir: string = persistDir): Promise<any> {
  console.log(`Loading current portfolio data from Prisma...`);
  const documents = await buildKnowledgeDocuments();

  console.log(`Building vector storage in ${targetDir}...`);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log("Removed previous vector storage.");
  }

  console.log(
    `Vectorizing ${documents.length} current portfolio documents with Gemini embeddings...`,
  );
  const storageContext = await storageContextFromDefaults({ persistDir: targetDir });
  const index = await VectorStoreIndex.fromDocuments(documents, { storageContext });

  console.log("Vector storage successfully built and saved to disk!");
  globalQueryEngine = index.asQueryEngine();
  return index;
}

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

    const systemPrompt = `Answer the following question using only the current
portfolio vector data. Be accurate and return valid HTML. If the answer is not
present in the portfolio, say that clearly instead of guessing.

User question: ${question}`;
    const result = await globalQueryEngine.query({ query: systemPrompt });
    return result.response;
  } catch (error) {
    console.error("Error running LLM query:", error);
    throw error;
  }
}

if (process.argv[1]?.includes("llm/index.ts")) {
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
  })().catch((error) => {
    console.error("Vectorization failed:", error);
    process.exitCode = 1;
  });
}
