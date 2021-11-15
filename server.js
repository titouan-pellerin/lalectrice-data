const fs = require("fs").promises;
const axios = require("axios");
const WordExtractor = require("word-extractor");

const extractor = new WordExtractor();

const docErrors = [];
const strapiBooksErrors = [];
const strapiChroniquesErrors = [];

const chroniques = [];

readDir("./chroniques").then(() => {
  fs.writeFile("./json/docsErrors.json", JSON.stringify(docErrors));
  fs.writeFile(
    "./json/strapiBooksErrors.json",
    JSON.stringify(strapiBooksErrors)
  );
  fs.writeFile(
    "./json/strapiChroniquesErrors.json",
    JSON.stringify(strapiChroniquesErrors)
  );

  fs.writeFile("./json/chroniques.json", JSON.stringify(chroniques));

  console.log(chroniques.length);
  console.log(docErrors.length);
});

async function readDir(path) {
  const files = await fs.readdir(path);
  for (const file of files) {
    await parseInfo(path + "/" + file);
  }
}

async function parseInfo(path) {
  const docBody = await getDocBody(path);

  const firstDate = getFirstDate(docBody);
  const isbn = getISBN(docBody);

  if (firstDate && isbn) {
    const bodySplit = docBody.split(firstDate)[1].split("Cécile Pellerin")[0];

    // const editTime = await getFileEditTime(path);
    chroniques.push({
      isbn,
      bodySplit,
      firstDate,
    });

    const strapiBook = await postBook(isbn);
    if (strapiBook) await postChronique(strapiBook.id, bodySplit, firstDate);
    console.log(convertDate(firstDate));
  } else docErrors.push(path);
}

async function getFileEditTime(path) {
  try {
    const { mtime } = await fs.stat(path);
    return mtime;
  } catch (err) {
    console.error(err);
  }
}

async function getDocBody(path) {
  try {
    const doc = await extractor.extract(path);
    return doc.getBody();
  } catch (err) {
    console.error(err);
  }
}

function getISBN(body) {
  const isbnRegex = /\d{13}|\d{10}/;
  let match;
  if ((match = isbnRegex.exec(body)) !== null) return match[0];
  return null;
}

function getFirstDate(body) {
  const dateRegex =
    /(\d{1,2} janvier \d{4})|(\d{1,2} fevrier \d{4})|(\d{1,2} mars \d{4})|(\d{1,2} avril \d{4})|(\d{1,2} mai \d{4})|(\d{1,2} juin \d{4})|(\d{1,2} juillet \d{4})|(\d{1,2} aout \d{4})|(\d{1,2} septembre \d{4})|(\d{1,2} octobre \d{4})|(\d{1,2} novembre \d{4})|(\d{1,2} decembre \d{4})|(\d{1,2} février \d{4})|(\d{1,2} décembre \d{4})|(\d{1,2} août \d{4})/i;
  let match;
  if ((match = dateRegex.exec(body)) !== null) return match[0];
  return null;
}

function convertDate(date) {
  let newDate;

  if (date.includes("janvier")) newDate = date.replace("janvier", "jan");
  else if (date.includes("février") || date.includes("fevrier"))
    newDate = date.replace(/février|fevrier/gi, "feb");
  else if (date.includes("mars")) newDate = date.replace("mars", "mar");
  else if (date.includes("avril")) newDate = date.replace("avril", "apr");
  else if (date.includes("mai")) newDate = date.replace("mai", "may");
  else if (date.includes("juin")) newDate = date.replace("juin", "jun");
  else if (date.includes("juillet")) newDate = date.replace("juillet", "jul");
  else if (date.includes("août") || date.includes("aout"))
    newDate = date.replace(/août|aout/gi, "aug");
  else if (date.includes("septembre"))
    newDate = date.replace("septembre", "sep");
  else if (date.includes("octobre")) newDate = date.replace("octobre", "oct");
  else if (date.includes("novembre")) newDate = date.replace("novembre", "nov");
  else if (date.includes("décembre") || date.includes("decembre"))
    newDate = date.replace(/decembre|décembre/gi, "dec");

  return newDate;
}

async function postBook(isbn) {
  try {
    const { data } = await axios.post(
      "https://strapi-lalectrice.herokuapp.com/livres",
      { isbn }
    );
    return data;
  } catch (err) {
    console.error(err);
    strapiBooksErrors.push({ isbn, err });
    console.log("Strapi Books Errors", strapiBooksErrors.length);
  }
}

async function postChronique(livre, contenu, publication) {
  // const date = new Date(publication);
  // console.log(date);
  try {
    if (!publication) throw "Date incorrecte";
    const { data } = await axios.post(
      "https://strapi-lalectrice.herokuapp.com/chroniques",
      {
        publication: new Date(convertDate(publication)),
        contenu,
        livre,
      }
    );
    return data;
  } catch (err) {
    console.log(err);
    strapiChroniquesErrors.push({ livre, contenu, publication, err });
    console.log("Strapi Chroniques Errors", strapiChroniquesErrors.length);
  }
}
