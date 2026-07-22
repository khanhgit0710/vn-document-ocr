require('dotenv').config({ path: 'd:/Front-end/vn-document-ocr/backend/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you there?");
        console.log(`Success with ${modelName}:`, result.response.text());
    } catch (e) {
        console.error(`Error with ${modelName}:`, e.message);
    }
}

async function run() {
    await testModel("gemini-3.5-flash");
    await testModel("gemini-flash-latest");
}
run();
