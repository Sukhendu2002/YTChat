#!/usr/bin/env node --no-deprecation

import dotenv from "dotenv";
dotenv.config();
import * as fs from "fs";
import * as readline from "readline";
import prompts from "prompts";
import { processInput, LLMType } from "./process";
import { createColors } from "colorette";
import { createSpinner } from "nanospinner";

const spinner = createSpinner("Bot is thinking...");

const CONFIG_FILE_PATH = "./config.json";

const colors = createColors({ useColor: true });

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
        { title: "Anthropic", value: "anthropic" },
        { title: "OpenAI(Under Work/Not Supported)", value: "openai" },
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
  console.log(colors.green("Welcome to YouTube Chatbot CLI!"));
  console.log(colors.yellow('Type "/bye" to exit.'));
  console.log(colors.yellow('Type "/reset" to reset configuration.'));
  console.log(colors.cyan("\nStart chatting below:\n"));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (input: string) => {
    if (input.trim() === "/bye") {
      console.log(colors.magenta("Goodbye! Exiting..."));
      rl.close();
      process.exit(0);
    }

    if (input.trim() === "/reset") {
      console.log(colors.red("Resetting configuration..."));
      fs.unlinkSync(CONFIG_FILE_PATH);
      console.log(
        colors.red("Configuration reset. Please restart the program.")
      );
      rl.close();
      process.exit(0);
    }

    if (input.trim() === "") {
      console.log(colors.yellow("Please enter a message."));
      rl.prompt();
      return;
    }

    try {
      spinner.start();
      const response = await processInput(input, llmType, apiKey);
      spinner.success({
        text: input,
        mark: "✔",
      });
      console.log("");
      console.log(colors.green("Bot:"));
      console.log(response);
      console.log("");
      rl.prompt();
    } catch (error) {
      console.error(colors.red("Error processing input:"), error);
      console.log("");
      spinner.stop();
      rl.prompt();
    }
  });
}
