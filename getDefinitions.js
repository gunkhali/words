const { readFileSync, writeFileSync } = require("fs");

async function translate(word) {
  const response = await fetch(
    `https://api.datpmt.com/api/v2/dictionary/translate?string=${word}&from_lang=en&to_lang=az`
  );
  return await response.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRawWords() {
  return JSON.parse(readFileSync("./rawWordList.json", "utf8"));
}

async function fetchDefinitions() {
  const responses = [];
  const rawWords = getRawWords();
  for (const { word } of rawWords) {
    await sleep(1000);
    const response = await fetchDefinition(word);
    const translation = await translate(word);
    response.translation = translation;
    responses.push(response);

    console.info(`Fetched definition for ${word}, index is ${responses.length}`);
  }

  return responses;
}

async function fetchDefinition(word) {
  return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => data[0]);
}

fetchDefinitions().then(saveDefinitions);

async function saveDefinitions(response) {
  writeFileSync("./definitions.js", "const words = " + JSON.stringify(response), "utf8");
}
