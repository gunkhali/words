const { readFileSync, writeFileSync } = require("fs");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRawWords() {
  return JSON.parse(readFileSync("./rawWordList.json", "utf8"));
}

fetchDefinitions = async () => {
  const responses = [];
  const rawWords = getRawWords();
  for (const { word } of rawWords) {
    await sleep(1000);
    const response = await fetchDefinition(word);
    responses.push(response);

    console.info(`Fetched definition for ${word}, index is ${responses.length}`);
  }

  return responses;
};

fetchDefinition = async (word) => {
  return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => data[0]);
};

fetchDefinitions().then((responses) => {
  writeFileSync("./definitions.js", "const words = " + JSON.stringify(responses), "utf8");
});
