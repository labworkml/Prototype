import { getAI, getGenerativeModel } from "firebase/ai";
import { app } from "../firebase/firebaseConfig";

const ai = getAI(app);

const model = getGenerativeModel(ai, {
  model: "gemini-2.5-flash"
});

export async function askAI(question: string, context: string) {

  const prompt = `
You are an insurance analytics assistant.

Context:
${context}

User Question:
${question}

Rules:
- Use only the provided data
- Do not invent numbers
- Give short clear explanations
`;

  const result = await model.generateContent(prompt);

  return result.response.text();
}

export async function generateInsights(context: string): Promise<string> {
  const prompt = `
You are an expert insurance data analyst.

Analyze the dataset and return key insights.

Rules:
- Provide between 1 and 3 insights depending on what the data actually shows
- Do NOT force insights if they do not exist
- Do NOT repeat the same observation using different wording
- Maximum allowed insights: 3
- Each insight must be one short bullet point starting with •
- Focus only on meaningful patterns such as:
  • trend (overall direction)
  • peak values
  • lowest values
  • sudden increase or decline
  • unusual change in direction

If the dataset contains only one meaningful observation, return only one insight.
If two exist, return two. Never exceed three.

Dataset:
${context}
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
