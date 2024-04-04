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
    //get the lastest 2 conversation base on the timestamp
    const data = await fs.promises
      .readFile(this.filePath, "utf-8")
      .then((data) => JSON.parse(data));

    //get the last 2 conversation
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

export default ConversationHistory;
