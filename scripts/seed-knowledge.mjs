import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed Neon knowledge_docs.");
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required to create knowledge embeddings.");

const sql = neon(connectionString);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const docs = [
  {
    title: "Expungement basics (Massachusetts)",
    content: "Massachusetts allows sealing or expunging certain records. Free monthly expungement clinics help you check eligibility and file paperwork. Bring a photo ID and any court documents you have. Sealing hides a record from most employers; expungement destroys it. Eligibility depends on offense type and time elapsed.",
  },
  {
    title: "Ban-the-box and fair-chance hiring",
    content: "Many states have 'ban-the-box' laws that stop employers from asking about criminal history on the initial job application. Fair-chance employers consider your skills first. You generally don't have to volunteer your record before a conditional offer. If asked, be brief, honest, and focus on growth.",
  },
  {
    title: "Resume tips after incarceration",
    content: "Use a skills-based (functional) resume to emphasize abilities over a strict timeline. Account for gaps honestly but briefly — 'personal development' or volunteer/program work counts. Highlight certifications, trades, or coursework completed. Keep it to one page and tailor it to each fair-chance job.",
  },
  {
    title: "Finding transitional housing",
    content: "Transitional housing offers supportive, time-limited living (often up to 12 months) with case management. Halfway houses provide structure for people on supervised release. Apply early; spots fill quickly. Ask reentry organizations for referrals and have your ID and release paperwork ready.",
  },
  {
    title: "Mental health and crisis support",
    content: "The 988 Suicide & Crisis Lifeline offers free, confidential help 24/7 by call or text. SAMHSA's helpline (1-800-662-4357) gives treatment referrals for mental health and substance use. Community mental health centers offer sliding-scale counseling. Reentry is stressful; reaching out is a sign of strength.",
  },
  {
    title: "Replacing lost documents",
    content: "Many services require a photo ID, Social Security card, and birth certificate. Free or low-cost assistance programs help replace these. Start with your state ID, since it's often needed to get the others. Some reentry programs cover the fees.",
  },
];

for (const doc of docs) {
  const result = await openai.embeddings.create({ model: "text-embedding-3-small", input: doc.content });
  const embedding = `[${result.data[0].embedding.join(",")}]`;
  await sql.query(
    `INSERT INTO knowledge_docs (title, content, embedding)
     VALUES ($1, $2, $3::vector)
     ON CONFLICT (title) DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
    [doc.title, doc.content, embedding],
  );
  console.log(`Seeded: ${doc.title}`);
}
console.log("Neon knowledge base seeded.");
