import { Document, VectorStoreIndex, Settings, storageContextFromDefaults } from "llamaindex";
import { Gemini, GeminiEmbedding, GEMINI_MODEL_INFO_MAP } from "@llamaindex/google";
import { BACKEND_URL } from "../../config/envConfig";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

// Load .env if running directly
dotenv.config();

const url: string = BACKEND_URL || "http://localhost:4000";

// Ensure the free Gemini API key is provided
if (!process.env.GOOGLE_API_KEY) {
    console.error("Error: GOOGLE_API_KEY is not set in your .env file!");
    console.error("Get a free API key here: https://aistudio.google.com/app/apikey");
    process.exit(1);
}

// PATCH: The current LlamaIndex package doesn't know about the new 'gemini-3.6-flash' model
// We add it to the internal map so it doesn't crash
GEMINI_MODEL_INFO_MAP["gemini-3.5-flash-lite"] = { contextWindow: 2000000 };

// Configure LlamaIndex to use Gemini models instead of OpenAI
Settings.chunkSize = 8192;
Settings.llm = new Gemini({ model: "gemini-3.5-flash-lite" });
Settings.embedModel = new GeminiEmbedding({ model: "gemini-embedding-2", embedBatchSize: 1 });

// Initialize queryEngine once globally to massively improve retrieval speed
let globalQueryEngine: any = null;

export default async function llm(question: string = "who is this?") {
    try {
        if (!globalQueryEngine) {
            let index;
            const persistDir = "./storage";
            
            // 1. Check if we have already vectorized and stored the data on disk
            if (fs.existsSync(persistDir)) {
                const storageContext = await storageContextFromDefaults({ persistDir });
                index = await VectorStoreIndex.init({ storageContext });
            } else {
                // 2. Otherwise, fetch the data, vectorize it, and save it to disk!
                const response = await axios.get(`${url}/api/portfolio`);
                const payload = JSON.stringify(response.data, null, 2);
                
                const document = new Document({ text: payload });
                
                // This is the magic that saves it to the persistDir
                const storageContext = await storageContextFromDefaults({ persistDir });
                index = await VectorStoreIndex.fromDocuments([document], { storageContext });
            }
            
            globalQueryEngine = index.asQueryEngine();
        }

        const systemPrompt = `You are a highly professional, polite, and enthusiastic AI assistant of Nishan Rajak, a talented Backend Software Engineer and DevOps engineer.
Your goal is to answer questions about Nishan's portfolio, skills, experience, and projects based on the provided data.
If a user asks a question that isn't covered in the portfolio data, politely let them know that you only have information regarding Nishan's professional portfolio. Do not invent information.

CRITICAL INSTRUCTIONS FOR FORMATTING:
- You MUST format your entire response in valid HTML. Do NOT use markdown.
- Use <b>text</b> instead of **text** for bolding.
- Use <i>text</i> instead of *text* for italics.
- If you mention a project, a social media profile, an email, or a phone number, you MUST wrap it in an HTML anchor tag. For example: <a href="url" class="text-blue-400 hover:underline" target="_blank">Project Name</a> or <a href="mailto:email" class="text-blue-400 hover:underline">email</a>.
- Always include these exact class names for links: class="text-blue-400 hover:underline".
- Structure your answer with <p> tags for paragraphs and <ul>/<li> for lists if needed.

User's Query: ${question}`;

        const res = await globalQueryEngine.query({ query: systemPrompt });
        
        return res.response;
        
    } catch (error) {
        console.error("Error running LLM query:", error);
    }
}

// Execute the code if we run `bun run src/modules/llm/index.ts`
if (require.main === module || process.argv[1]?.includes('llm/index.ts')) {
    llm().then(console.log);
}