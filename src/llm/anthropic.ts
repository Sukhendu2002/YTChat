import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

class AnthropicCL {
  private anthropic: Anthropic;
  private youtube: any;

  constructor(anthropicApiKey: string, youtubeApiKey: string | undefined) {
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    this.youtube = google.youtube({
      version: "v3",
      auth: youtubeApiKey,
    });
  }
}

export default AnthropicCL;
