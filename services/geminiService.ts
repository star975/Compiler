import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_RUNNER, SYSTEM_INSTRUCTION_HELPER, SYSTEM_INSTRUCTION_COMPLETION, SYSTEM_INSTRUCTION_CHAT, SYSTEM_INSTRUCTION_FORMATTER } from "../constants";

// Initialize Gemini Client
// Note: API Key must be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const runPythonCode = async (code: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: code,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_RUNNER,
        temperature: 0.1, // Low temperature for deterministic code execution simulation
      },
    });
    
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Execution Error:", error);
    return `Traceback (most recent call last):\n  File "remote_runner.py", line 1, in <module>\nGeminiError: ${error.message || "Unknown error occurred"}`;
  }
};

export const explainCode = async (code: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the following Python code:\n\n${code}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_HELPER,
      },
    });
    return response.text || "No explanation provided.";
  } catch (error: any) {
    return `Error generating explanation: ${error.message}`;
  }
};

export const fixCode = async (code: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Fix the bugs or improve the following Python code. Return ONLY the fixed code within markdown code blocks.\n\n${code}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_HELPER,
      },
    });
    
    // Simple extraction of code block if present
    const text = response.text || "";
    const codeMatch = text.match(/```python([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    return text;
  } catch (error: any) {
    return `Error fixing code: ${error.message}`;
  }
};

export const formatCode = async (code: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: code,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_FORMATTER,
      },
    });
    
    let text = response.text || code;
    // Strip backticks if the model accidentally added them
    if (text.startsWith('```')) {
        text = text.replace(/^```(python)?\n/, '').replace(/```$/, '');
    }
    return text.trim();
  } catch (error: any) {
    console.error("Format error:", error);
    return code; // Return original on error
  }
};

export const getCodeCompletion = async (codeContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: codeContext,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_COMPLETION,
        temperature: 0.3, // Slightly creative but focused
        maxOutputTokens: 64, // Limit response length for speed and short completions
      },
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Completion error:", error);
    return "";
  }
};

export const streamChat = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentFileContext: string,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    const contents: any[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    
    const contextPrompt = `
[Context: Current Open File]
\`\`\`python
${currentFileContext}
\`\`\`

[User Query]
${userMessage}
`;
    
    contents.push({
      role: 'user',
      parts: [{ text: contextPrompt }]
    });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_CHAT,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }

  } catch (error: any) {
    console.error("Chat error:", error);
    onChunk(`\n\n*Error: ${error.message || "Failed to generate response."}*`);
  }
};
