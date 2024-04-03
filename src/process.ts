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

      response = "Response from Anthropic API";
    } else {
      throw new Error("Invalid LLM provider");
    }

    return response;
  } catch (error) {
    throw error;
  }
}

// async function extractSearchQuery(
//   input: string,
//   anthropic: Anthropic
// ): Promise<string> {
//   let prompt = `Extract the youtube search query from the following text: "${input}"`;
//   const msg = await anthropic.messages.create({
//     model: "claude-3-opus-20240229",
//     max_tokens: 1024,
//     messages: [{ role: "user", content: prompt }],
//   });

//   return msg.content[0].text;
// }

// async function searchVideos(query: string): Promise<string> {
//   const response = await youtube.search.list({
//     part: ["snippet"],
//     maxResults: 5,
//     q: query,
//     type: ["video"],
//   });

//   console.log(response.data.items);

//   if (response.data.items && response.data.items.length > 0) {
//     const searchResults = response.data.items.map((item) => {
//       const videoId = extractVideoIdFromURL(item.id.videoId);
//       const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
//       return `- ${item.snippet.title} (${videoUrl})`;
//     });

//     return searchResults.join("\n");
//   }

//   return "No search results found.";
// }

// function extractVideoIdFromURL(url: string): string {
//   const videoIdRegex =
//     /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
//   const match = url.match(videoIdRegex);
//   return match && match[7].length === 11 ? match[7] : "";
// }

// async function fetchVideoDetails(videoId: string) {
//   const response = await youtube.videos.list({
//     part: ["snippet"],
//     id: [videoId],
//   });
//   console.log(response.data.items);

//   // if (response.data.items && response.data.items.length > 0) {
//   //   const video = response.data.items[0];
//   //   return {
//   //     title: video.snippet.title,
//   //     description: video.snippet.description,
//   //   };
//   // }

//   // throw new Error(`Failed to fetch video details for videoId: ${videoId}`);
// }
