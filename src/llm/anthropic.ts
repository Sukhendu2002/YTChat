import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import fs from "fs";

type Conversation = {
  userInput: string;
  systemResponse: string;
  timestamp?: string;
};

class ConversationHistory {
  private filePath: string;
  constructor(filePath = "conversation-history.json") {
    this.filePath = filePath;
    fs.promises
      .access(this.filePath)
      .then(() => {
        console.log("File exists");
      })
      .catch(() => {
        console.log("File doesn't exist. Creating new file");
        fs.promises.writeFile(this.filePath, "[]");
      });
  }

  async saveConversation(conversation: Conversation) {
    const data = await fs.promises.readFile(this.filePath, "utf-8");
    const conversationHistory = JSON.parse(data);
    conversationHistory.push(conversation);
    await fs.promises.writeFile(
      this.filePath,
      JSON.stringify(conversationHistory, null, 2)
    );
  }
  async getConversationHistory() {
    const data = await fs.promises
      .readFile(this.filePath, "utf-8")
      .then((data) => JSON.parse(data));
    const conversationHistory = data
      .filter((item: Conversation) => item.timestamp)
      .sort((a: Conversation, b: Conversation) => {
        return (
          new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
        );
      })
      .slice(0, 2);

    return conversationHistory;
  }
}

class AnthropicCL {
  private anthropic: Anthropic;
  private youtube: any;
  private conversation: any;

  constructor(anthropicApiKey: string, youtubeApiKey: string | undefined) {
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    this.youtube = google.youtube({
      version: "v3",
      auth: youtubeApiKey,
    });

    this.conversation = new ConversationHistory();
  }

  // async analyzeInput(input: string): Promise<string> {
  //   try {
  //     let conversationHistory =
  //       await this.conversation.getConversationHistory();
  //     console.log(conversationHistory);
  //     const systemMessage = `You are a chatbot. From the given text, tell me what the user wants to know. is it a search  query or a request to search for videos or request to search for video details or request for vedio summary or something from the previous conversation.

  //     Input: ${input}
  //     Priveous conversation: ${this.conversation.getConversationHistory()}

  //       please provide the answer in the following format:
  //       search query: <query>
  //       search videos: <query>
  //       search video details: <videoId>
  //       video summary: <videoId>
  //       `;

  //     const msg = await this.anthropic.messages.create({
  //       model: "claude-3-opus-20240229",
  //       max_tokens: 1024,
  //       messages: [{ role: "user", content: systemMessage }],
  //     });

  //     const response = msg.content[0].text;
  //     const [action, value] = response.split(":").map((item) => item.trim());

  //     console.log(action, value);
  //     if (action === "search query") {
  //       const query = await this.extractSearchQuery(value);
  //       const searchResults = await this.searchVideos(query);
  //       this.conversation.saveConversation({
  //         userInput: input,
  //         systemResponse: searchResults,
  //         timestamp: new Date().toISOString(),
  //       });
  //       return searchResults;
  //     } else if (action === "search videos") {
  //       const searchResults = await this.searchVideos(value);
  //       this.conversation.saveConversation({
  //         userInput: input,
  //         systemResponse: searchResults,
  //         timestamp: new Date().toISOString(),
  //       });
  //       return searchResults;
  //     } else if (action === "search video details") {
  //       const videoMetadata = await this.fetchVideoMetadata(value);
  //       const meta = await this.anthropic.messages.create({
  //         model: "claude-3-opus-20240229",
  //         max_tokens: 512,
  //         messages: [
  //           {
  //             role: "user",
  //             content: `${input} Videometadata: ${JSON.stringify(
  //               videoMetadata
  //             )}`,
  //           },
  //         ],
  //       });
  //       this.conversation.saveConversation({
  //         userInput: input,
  //         systemResponse: meta.content[0].text,
  //         timestamp: new Date().toISOString(),
  //       });
  //       return meta.content[0].text;
  //     } else if (action === "video summary") {
  //       const words = await this.fetchVideoTranscript(value);
  //       const summary = await this.anthropic.messages.create({
  //         model: "claude-3-opus-20240229",
  //         max_tokens: 512,
  //         messages: [
  //           {
  //             role: "user",
  //             content: `Summarize the following text: "${words.join(" ")}"`,
  //           },
  //         ],
  //       });
  //       this.conversation.saveConversation({
  //         userInput: input,
  //         systemResponse: summary.content[0].text,
  //         timestamp: new Date().toISOString(),
  //       });
  //       return summary.content[0].text;
  //     } else {
  //       return "Invalid action. Please try again.";
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     return "Error processing input.";
  //   }
  // }
  async analyzeInput(input: string): Promise<string> {
    try {
      let conversationHistory =
        await this.conversation.getConversationHistory();
      const systemMessage = `You are a chatbot. From the given text, tell me what the user wants to know. is it a search query or a request to search for videos or request to search for video details or request for video summary or something from the previous conversation.

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

      const msg = await this.anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: [{ role: "user", content: systemMessage }],
      });

      const response = msg.content[0].text;
      const [action, value] = response.split(":").map((item) => item.trim());

      console.log(action, value);
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
          const meta = await this.anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 512,
            messages: [
              {
                role: "user",
                content: `${input} Video metadata: ${JSON.stringify(
                  videoMetadata
                )}`,
              },
            ],
          });
          this.conversation.saveConversation({
            userInput: input,
            systemResponse: meta.content[0].text,
            timestamp: new Date().toISOString(),
          });
          return meta.content[0].text;
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
          const summary = await this.anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 512,
            messages: [
              {
                role: "user",
                content: `Summarize the following text: "${words.join(" ")}"`,
              },
            ],
          });
          this.conversation.saveConversation({
            userInput: input,
            systemResponse: summary.content[0].text,
            timestamp: new Date().toISOString(),
          });
          return summary.content[0].text;
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
    const msg = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    return msg.content[0].text;
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

export default AnthropicCL;
