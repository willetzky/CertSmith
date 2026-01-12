
import { GoogleGenAI } from "@google/genai";

/**
 * Initializes the Gemini client using the environment's API key.
 */
const getGeminiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes an SSL/TLS certificate using Gemini AI.
 * Uses gemini-3-pro-preview for advanced reasoning on cybersecurity data.
 */
export const analyzeCertificate = async (certPem: string): Promise<string> => {
    try {
        const client = getGeminiClient();
        
        const prompt = `
        You are a cybersecurity expert. Analyze the following SSL/TLS Certificate (PEM format).
        
        Please provide:
        1. A summary of the certificate (Subject, Issuer, Validity Period).
        2. Verify if the certificate is self-signed or signed by a public CA.
        3. Check for any potential security weaknesses (e.g., weak algorithm, short key length) if visible.
        4. Provide the exact OpenSSL command one would use to view this certificate's details in a terminal.
        
        Format the output in clear Markdown.
        
        Certificate:
        ${certPem}
        `;

        // Using gemini-3-pro-preview for complex analysis task
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });

        // Access the .text property directly (not a method)
        return response.text || "No analysis could be generated.";

    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return "Failed to analyze certificate. Please ensure the API key is valid and try again.";
    }
};
