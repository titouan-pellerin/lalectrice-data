import { readdirSync, writeFileSync } from "node:fs";
import Bottleneck from "bottleneck";

import { parseInfos } from "./src/parsers/docParser.mjs";

import { fetchGoogleBooksBook } from "./src/fetchers/googleDataFetchers.mjs";
import { fetchOpenLibraryBook } from "./src/fetchers/openLibraryDataFetchers.mjs";
import { fetchBnfBook } from "./src/fetchers/bnfDataFetchers.mjs";

import { combineBookData } from "./src/selectors/bookDataSelector.mjs";

import { publishAuthor } from "./src/publishers/publishAuthor.mjs";
import { publishPublisher } from "./src/publishers/publishPublisher.mjs";
import { publishCollection } from "./src/publishers/publishCollection.mjs";
import { publishBook } from "./src/publishers/publishBook.mjs";

import booksData from "./json/booksData.json" assert { type: "json" };
import chroniclesInfos from "./json/chroniclesInfos.json" assert { type: "json" };

const limiter = new Bottleneck({
    minTime: 500, //minimum time between requests
    maxConcurrent: 5, //maximum concurrent requests
});

publishData();

async function publishData() {
    const publishersCollections = new Map();

    Object.entries(booksData)
        // .slice(0, 15)
        .forEach(async ([isbn, book]) => {
            limiter.schedule(async () => {
                const authorsIds = [],
                    translatorsIds = [];

                try {
                    if (book.authors && Array.isArray(book.authors)) {
                        const ids = (await Promise.all(book.authors?.map((author) => author && publishAuthor(author)))).map((author) => author.id);
                        authorsIds.push(...ids);
                    }

                    if (book.translators && Array.isArray(book.translators)) {
                        const ids = (await Promise.all(book.translators?.map((translator) => translator && publishAuthor(translator, true)))).map((translator) => translator.id);
                        translatorsIds.push(...ids);
                    }

                    const publisherId = await publishPublisher(book.publisher)?.id;
                    const collectionId = await publishCollection(book.collection)?.id;

                    console.log(authorsIds, translatorsIds, publisherId, collectionId);

                    if (!publishersCollections.has(publisherId)) publishersCollections.set(publisherId, new Set());
                    publishersCollections.get(publisherId).add(collectionId);

                    const newBook = await publishBook(isbn, book, chroniclesInfos[isbn], [...authorsIds, ...translatorsIds], [publisherId], [collectionId]);
                } catch (err) {
                    console.error(err.response.data.error.details.path);
                }
            });
        });
}

async function parseDocs() {
    const docsFolder = "./chroniques";
    const outDir = "./json";
    const docs = readdirSync(docsFolder).map((file) => docsFolder + "/" + file);

    const chroniclesErrors = [];
    const chroniclesKeys = new Map();
    const booksErrors = [];
    const googleErrors = [];
    const openLibraryErrors = [];
    const bnfErrors = [];

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
}
