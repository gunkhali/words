const { readFileSync, createWriteStream } = require("fs");

const SLEEP_INTERVAL = 1000; // ms between API requests
const RAW_WORDS_FILE = "./rawWordList.json";
const OUTPUT_FILE = "./definitions.js";

// Utility function to read raw words from file
function getRawWords() {
  return JSON.parse(readFileSync(RAW_WORDS_FILE, "utf8"));
}

// Utility function to pause execution for a specified time
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to fetch a word's definition from dictionary API
async function fetchDefinition(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error(`Error fetching definition for ${word}: ${error}`);
    return null;
  }
}

// Function to translate a word from English to Azerbaijani
async function translate(word) {
  try {
    const response = await fetch(
      `https://api.datpmt.com/api/v2/dictionary/translate?string=${word}&from_lang=en&to_lang=az`
    );
    return await response.json();
  } catch (error) {
    console.error(`Error translating word ${word}: ${error}`);
    return null;
  }
}

// Function to fetch definitions and translations with streaming
async function fetchDefinitionsWithStream() {
  const rawWords = getRawWords();
  const writeStream = createWriteStream(OUTPUT_FILE);
  writeStream.write("const words = [\n"); // Start JSON array

  // Signal handling for Ctrl+C interruption
  process.on("SIGINT", () => {
    console.info("\nProcess interrupted. Saving partial data...");
    writeStream.end("\n];\n"); // Close JSON array if interrupted
    process.exit(0);
  });

  try {
    for (const [index, { word }] of rawWords.entries()) {
      await sleep(SLEEP_INTERVAL);

      const [definition, translation] = await Promise.all([
        fetchDefinition(word),
        translate(word),
      ]);

      if (definition && translation) {
        definition.translation = translation;

        // Write each word's data as a JSON string, separated by commas
        const formattedData = JSON.stringify(definition, null, 2);
        writeStream.write(formattedData);

        // Add a comma if it’s not the last item
        if (index < rawWords.length - 1) writeStream.write(",\n");

        console.info(`Fetched data for "${word}", index: ${index + 1}`);
      }
    }
  } finally {
    writeStream.end("\n];"); // Properly close JSON array on normal completion or error
    console.info(`Data streamed to ${OUTPUT_FILE}`);
  }
}

// Main execution function
(async function main() {
  await fetchDefinitionsWithStream();
})();
