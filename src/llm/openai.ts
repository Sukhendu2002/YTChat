import OpenAI from "openai";
import { google } from "googleapis";
import { YoutubeTranscript } from "youtube-transcript";
import ConversationHistoryCL from "../utils/ConversationHistory";
import { Conversation } from "../utils/ConversationHistory";

class GPTCL {
  private openai: any;
  private youtube: any;
  private conversation: any;

  constructor(openaiApiKey: string, youtubeApiKey: string | undefined) {
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    this.youtube = google.youtube({
      version: "v3",
      auth: youtubeApiKey,
    });

    this.conversation = new ConversationHistoryCL();
  }

  async analyzeInput(input: string): Promise<string> {
    try {
      let conversationHistory =
        await this.conversation.getConversationHistory();
      const systemPrompt = `You are a chatbot. From the given text, tell me what the user wants to know. Is it a search query or a request to search for videos or request to search for video details or request for video summary or something from the previous conversation?

      Input: ${input}
      Previous conversation: ${conversationHistory
        .map(
          (item: any) => `User: ${item.userInput}\nBot: ${item.systemResponse}`
        )
        .join("\n")}
      
      Please provide the answer in the following format:
      search query: <query>
      search videos: <query>
      search video details: <videoId>
      video summary: <videoId>
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
      });

      const result = response.data.choices[0].text;
      const [action, value] = result.split(":").map((item: any) => item.trim());

      // console.log(action, value);
      if (action === "search query") {
        const query = await this.extractSearchQuery(value);
        const searchResults = await this.searchVideos(query);
        this.conversation.saveConversation({
          userInput: input,
          systemResponse: searchResults,
          timestamp: new Date().toISOString(),
        });
        return searchResults;
      } else if (action === "search videos") {
        const searchResults = await this.searchVideos(value);
        this.conversation.saveConversation({
          userInput: input,
          systemResponse: searchResults,
          timestamp: new Date().toISOString(),
        });
        return searchResults;
      } else if (action === "search video details") {
        let videoId = this.extractVideoIdFromInput(input);
        if (!videoId) {
          videoId = this.extractVideoIdFromPreviousConversation(
            value,
            conversationHistory
          );
        }
        if (!videoId) {
          videoId = value;
        }
        if (videoId) {
          const videoMetadata = await this.fetchVideoMetadata(videoId);
          const meta = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `Provide a summary of the video: "${videoMetadata.snippet.title}"`,
              },
            ],
          });
          this.conversation.saveConversation({
            userInput: input,
            systemResponse: meta.data.choices[0].text,
            timestamp: new Date().toISOString(),
          });
          return meta.data.choices[0].text;
        } else {
          return "Unable to find the requested video in the previous conversation.";
        }
      } else if (action === "video summary") {
        const videoId =
          value ||
          this.extractVideoIdFromPreviousConversation(
            input,
            conversationHistory
          );
        if (videoId) {
          const words = await this.fetchVideoTranscript(videoId);
          const summary = await this.openai.completions.create({
            model: "gpt-3.5-turbo",
            prompt: `Summarize the video transcript: "${words.join(" ")}"`,
          });
          this.conversation.saveConversation({
            userInput: input,
            systemResponse: summary.data.choices[0].text,
            timestamp: new Date().toISOString(),
          });
          return summary.data.choices[0].text;
        } else {
          return "Unable to find the requested video or video ID.";
        }
      } else {
        return "Invalid action. Please try again.";
      }
    } catch (error) {
      console.error("Error:", error);
      return "Error processing input.";
    }
  }

  extractVideoIdFromPreviousConversation(
    value: string,
    conversationHistory: Conversation[]
  ): string {
    const matchingConversation = conversationHistory.find((item) =>
      item.systemResponse.includes(value)
    );

    if (matchingConversation && matchingConversation.systemResponse) {
      const match = matchingConversation.systemResponse.match(/\((.*?)\)/);
      if (match && match[1]) {
        const videoUrl = match[1];
        return this.extractVideoIdFromURL(videoUrl);
      }
    }

    return "";
  }

  async chackIfVideoIdExistInPreviousConversation(videoId: string) {
    let conversationHistory = await this.conversation.getConversationHistory();
    let videoIdExist = conversationHistory.some((item: any) =>
      item.systemResponse.includes(videoId)
    );
    return videoIdExist;
  }

  async extractSearchQuery(input: string) {
    let prompt = `Extract the youtube search query from the following text: "${input}"`;
    const msg = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
    });

    return msg.data.choices[0].text;
  }

  extractVideoIdFromInput(input: string): string {
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (videoIdRegex.test(input)) {
      return input;
    }
    return "";
  }

  async searchVideos(query: string) {
    const response = await this.youtube.search.list({
      part: ["snippet"],
      maxResults: 5,
      q: query,
      type: ["video"],
    });
    if (response.data.items && response.data.items.length > 0) {
      const searchResults = response.data.items.map((item: any) => {
        const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
        return `- ${item.snippet.title} (${videoUrl})`;
      });
      return searchResults.join("\n");
    }
    return "No search results found.";
  }

  extractVideoIdFromURL(url: string) {
    const videoIdRegex =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(videoIdRegex);
    return match && match[7].length === 11 ? match[7] : "";
  }

  async fetchVideoMetadata(videoId: string) {
    const response = await this.youtube.videos.list({
      part: ["snippet", "statistics"],
      id: videoId,
    });
    return response.data.items[0];
  }

  async fetchVideoTranscript(videoId: string) {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    let words = transcript.map((item) => item.text);
    words = words.slice(0, 250);
    return words;
  }
}

export default GPTCL;
