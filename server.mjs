import { readdirSync, writeFileSync } from "node:fs";
import { parseInfos } from "./src/docParser.mjs";
import { fetchBnfBook, fetchGoogleBooksBook, fetchOpenLibraryBook } from "./src/dataFetchers/index.mjs";
import Bottleneck from "bottleneck";
import { combineBookData } from "./src/dataSelectors/bookDataSelector.mjs";

const docsFolder = "./chroniques";
const outDir = "./json";
const docs = readdirSync(docsFolder).map((file) => docsFolder + "/" + file);

const chroniclesErrors = [];
const chroniclesKeys = new Map();
const booksErrors = [];
const googleErrors = [];
const openLibraryErrors = [];
const bnfErrors = [];

const limiter = new Bottleneck({
    minTime: 500, //minimum time between requests
    maxConcurrent: 5, //maximum concurrent requests
});

const chroniclesInfos = Object.fromEntries(
    (
        await Promise.all(
            docs.map(async (filepath) => {
                try {
                    const data = await parseInfos(filepath);
                    if (chroniclesKeys.has(data.isbn)) console.warn("Warning duplicate filepath: " + chroniclesKeys.get(data.isbn) + " and " + filepath);
                    chroniclesKeys.set(data.isbn, filepath);
                    return [data.isbn, data];
                } catch (err) {
                    chroniclesErrors.push(err.message);
                }
            })
        )
    ).filter((infos) => infos !== undefined)
);
const chroniclesInfosCount = Object.keys(chroniclesInfos).length;

const booksData = Object.fromEntries(
    (
        await Promise.all(
            Object.values(chroniclesInfos)
                // .slice(0, 10)
                .map(({ isbn }, i) =>
                    limiter.schedule(async () => {
                        const data = { google: null, openLibrary: null, bnf: null };

                        let errorCount = 0;
                        try {
                            // console.log("Fetching Google...");
                            data.google = await fetchGoogleBooksBook(isbn);
                        } catch (err) {
                            googleErrors.push(isbn);
                            errorCount++;
                        }

                        try {
                            // console.log("Fetching Open Library...");
                            data.openLibrary = await fetchOpenLibraryBook(isbn);
                        } catch (err) {
                            openLibraryErrors.push(isbn);
                            errorCount++;
                        }

                        try {
                            // console.log("Fetching BnF...");
                            data.bnf = await fetchBnfBook(isbn);
                        } catch (err) {
                            bnfErrors.push(isbn);
                            errorCount++;
                        }

                        if (errorCount === 3) booksErrors.push(isbn);

                        console.log(i + 1 + "/" + chroniclesInfosCount);

                        const combinedResults = combineBookData(data);
                        // const openAiResults = await checkForConflicts(combinedResults);

                        return [isbn, combinedResults];
                    })
                )
        )
    ).filter((infos) => infos !== undefined)
);

writeFileSync(outDir + "/chroniclesInfos.json", JSON.stringify(chroniclesInfos));
writeFileSync(outDir + "/chroniclesErrors.json", JSON.stringify(chroniclesErrors));
writeFileSync(outDir + "/booksData.json", JSON.stringify(booksData));
writeFileSync(outDir + "/booksErrors.json", JSON.stringify(booksErrors));

writeFileSync(
    outDir + "/statistics.json",
    JSON.stringify({
        chroniclesErrorsCount: chroniclesErrors.length,
        chroniclesInfosCount: chroniclesInfos.length,
        chroniclesTotal: docs.length,
        booksDataCount: Object.keys(booksData).length,
        booksErrosCount: {
            total: booksErrors.length,
            google: googleErrors.length,
            openLibrary: openLibraryErrors.length,
            bnf: bnfErrors.length,
        },
    })
);
