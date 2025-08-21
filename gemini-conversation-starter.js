import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log(process.env.API_KEY);

const genAI = new GoogleGenerativeAI("AIzaSyAeJ14ecoQlAAjD2Bk9_SPsy0LSJVWtJfQ");

async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});

    const prompt = "Come up with one conversation topic.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
}

run();