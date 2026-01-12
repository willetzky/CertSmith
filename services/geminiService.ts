import { GoogleGenAI } from "@google/genai";

/**
 * Safely retrieves the API Key from the environment.
 */
const getApiKey = () => {
    try {
        // Use globalThis to safely check for process in various environments
        const env = (globalThis as any).process?.env;
        return env?.API_KEY || null;
    } catch (e) {
        return null;
    }
};

/**
 * Analyzes an SSL/TLS certificate using Gemini AI.
 * Uses gemini-3-pro-preview for advanced reasoning on cybersecurity data.
 */
export const analyzeCertificate = async (certPem: string): Promise<string> => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        return "Analysis unavailable: API Key not configured in the environment. If running locally, please ensure process.env.API_KEY is defined.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
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

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });

        return response.text || "No analysis could be generated.";

    } catch (error: any) {
        console.error("Gemini analysis failed:", error);
        return `Failed to analyze certificate: ${error.message || 'Unknown error'}`;
    }
};