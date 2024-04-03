import { LanguageServiceClient } from "@google-cloud/language";
export type LLMType = "openai" | "anthropic";

export async function processInput(
  input: string,
  llmType: LLMType,
  apiKey: string
): Promise<string> {
  try {
    let response: string;

    if (llmType === "openai") {
      response = "Response from OpenAI API";
    } else {
      response = "Response from Anthropic API";
    }

    return response;
  } catch (error) {
    throw error;
  }
}
