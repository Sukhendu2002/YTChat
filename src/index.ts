#!/usr/bin/env node --no-warnings
import dotenv from "dotenv";
dotenv.config();
import * as fs from "fs";
import * as readline from "readline";
import prompts from "prompts";
import { processInput, LLMType } from "./process";

const CONFIG_FILE_PATH = "./config.json";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Welcome to YouTube Chatbot CLI!");

if (fs.existsSync(CONFIG_FILE_PATH)) {
  const configData = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
  startProgram(configData.llmType, configData.apiKey);
} else {
  promptUserForSetup();
}

async function promptUserForSetup() {
  const response = await prompts([
    {
      type: "select",
      name: "llmType",
      message: "Choose LLM provider",
      choices: [
        { title: "OpenAI", value: "openai" },
        { title: "Anthropic", value: "anthropic" },
      ],
      initial: 0,
    },
    {
      type: "text",
      name: "apiKey",
      message: ({ llmType }: { llmType: LLMType }) =>
        `Enter your ${llmType === "openai" ? "OpenAI" : "Anthropic"} API key:`,
    },
  ]);

  console.log(
    `API key set for ${
      response.llmType === "openai" ? "OpenAI" : "Anthropic"
    }.\n`
  );
  saveConfig(response.llmType, response.apiKey);
  console.log("Configuration saved. Restart the program to start chatting.");
}

function saveConfig(llmType: LLMType, apiKey: string) {
  const configData = { llmType, apiKey };
  fs.writeFileSync(
    CONFIG_FILE_PATH,
    JSON.stringify(configData, null, 2),
    "utf-8"
  );
}

function startProgram(llmType: LLMType, apiKey: string) {
  console.log('Type "/bye" to exit.\n');
  console.log('Type "/reset" to reset configuration.\n');

  rl.on("line", async (input: string) => {
    if (input.trim() === "/bye") {
      console.log("Goodbye! Exiting...");
      rl.close();
      process.exit(0);
    }

    if (input.trim() === "/reset") {
      console.log("Resetting configuration...");
      fs.unlinkSync(CONFIG_FILE_PATH);
      console.log("Configuration reset. Please restart the program.");
      rl.close();
      process.exit(0);
    }

    if (input.trim() === "") {
      console.log("Please enter a message.");
      return;
    }

    try {
      const response = await processInput(input, llmType, apiKey);
      console.log("Bot:", response);
    } catch (error) {
      console.error("Error processing input:", error);
    }
  });
}
