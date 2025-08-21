import { createRoot } from 'react-dom/client';
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});

    const prompt = "Come up with one conversation topic.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
}

function GenerateConversationTopicResult() {

  let result = run();

  return <h1>{result}</h1>;
}

GenerateConversationTopicResult();

const domNode = document.getElementById('ai-conversation-starter');
const root = createRoot(domNode);
root.render(<GenerateConversationTopicResult />);
