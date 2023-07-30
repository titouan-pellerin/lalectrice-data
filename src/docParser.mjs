import WordExtractor from "word-extractor";

const extractor = new WordExtractor();

async function parseInfos(path) {
    const docBody = await getDocBody(path);

    const firstDate = getFirstDate(docBody);
    const isbn = getISBN(docBody);

    if (firstDate && isbn) {
        const bodySplit = docBody.split(firstDate)[1].split("Cécile Pellerin")[0].trim();
        return { isbn, bodySplit, firstDate };
    } else throw new Error(path);
}

async function getDocBody(path) {
    try {
        const doc = await extractor.extract(path);
        return doc.getBody();
    } catch (err) {
        throw new Error(err);
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

// function convertDate(date) {
//     let newDate;

//     if (date.includes("janvier")) newDate = date.replace("janvier", "jan");
//     else if (date.includes("février") || date.includes("fevrier")) newDate = date.replace(/février|fevrier/gi, "feb");
//     else if (date.includes("mars")) newDate = date.replace("mars", "mar");
//     else if (date.includes("avril")) newDate = date.replace("avril", "apr");
//     else if (date.includes("mai")) newDate = date.replace("mai", "may");
//     else if (date.includes("juin")) newDate = date.replace("juin", "jun");
//     else if (date.includes("juillet")) newDate = date.replace("juillet", "jul");
//     else if (date.includes("août") || date.includes("aout")) newDate = date.replace(/août|aout/gi, "aug");
//     else if (date.includes("septembre")) newDate = date.replace("septembre", "sep");
//     else if (date.includes("octobre")) newDate = date.replace("octobre", "oct");
//     else if (date.includes("novembre")) newDate = date.replace("novembre", "nov");
//     else if (date.includes("décembre") || date.includes("decembre")) newDate = date.replace(/decembre|décembre/gi, "dec");

//     return newDate;
// }

export { parseInfos };
