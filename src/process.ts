import AnthropicCL from "./llm/anthropic";

export type LLMType = "openai" | "anthropic";

export async function processInput(
  input: string,
  llmType: LLMType,
  apiKey: string
): Promise<string> {
  try {
    let response: string;
    const inputLines = input.trim().split("\n");
    const command = inputLines[0].toLowerCase();
    if (llmType === "openai") {
      response = "Response from OpenAI API";
    } else if (llmType === "anthropic") {
      const anthropic = new AnthropicCL(apiKey, process.env.YOUTUBE_API_KEY);
      const res = await anthropic.analyzeInput(input);
      response = res;
    } else {
      throw new Error("Invalid LLM provider");
    }

    return response;
  } catch (error) {
    throw error;
  }
}
