## YTChat

YTChat is a powerful chatbot that allows you to search for YouTube videos, retrieve video metadata, and generate summaries of video transcripts. It uses the Google YouTube Data API, YouTube Transcript API, and the AI language models from Anthropic and OpenAI to provide an intuitive and intelligent interface for interacting with YouTube content.

### Features

- Search for YouTube videos based on keywords or phrases
- Retrieve detailed metadata for a specific video, including title, description, view count, and more
- Generate a summary of a video's transcript using advanced language models
- Keep track of conversation history and context for more accurate responses

### Installation

Clone the repository:

```bash
git clone https://github.com/Sukhendu2002/YTChat
```

Install the required dependencies and build the project:

```bash
npm install
```

##### Set up the required API keys:
Obtain an API key from Anthropic and/or OpenAI.
Obtain an API key from the Google Cloud Console for the YouTube Data API.
Create a .env file in the project root and add the following environment variables:
    
```bash
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
```
To build and run the application, use the following command:

```bash
    npm run bulid
    npm run start
```
This will start the application, and you can interact with it through the command line interface.
