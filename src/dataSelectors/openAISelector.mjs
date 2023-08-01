import { Configuration, OpenAIApi } from "openai";
import { env } from "node:process";
import { btoa } from "node:buffer";

const configuration = new Configuration({
    apiKey: env.OPENAI_API_KEY,
});

const previousAuthors = new Map();
const previousTranslators = new Map();
const previousPublishers = new Set();
const previousCollections = new Set();

const openai = new OpenAIApi(configuration);

const uniqueFieldsDescription = {
    author: `
        I need you to check if the provided author doesn't already
        exist in the following list, maybe written in a different way.`,
    translator: `
        I need you to check if the provided translator doesn't already
        exist in the following list, maybe written in a different way.`,
    publisher: `
        I need you to check if the provided publisher doesn't already
        exist in the following list, maybe written in a different way.`,
    collection: `
        I need you to check if the provided collection doesn't already
        exist in the following list, maybe written in a different way.`,
};

async function checkForConflicts(combinedResults) {
    const authors = [];
    for (const author in combinedResults.authors) {
        const newAuthor = await checkConflict(author, uniqueFieldsDescription.author, [...previousAuthors.values()].join("||"));
        authors.push(newAuthor);
        if (!previousAuthors.has(btoa(JSON.stringify(newAuthor)))) previousAuthors.set(btoa(JSON.stringify(newAuthor)), newAuthor);
    }
    combinedResults.authors = authors;

    const translators = [];
    for (const translator in combinedResults.translators) {
        const newTranslator = await checkConflict(translator, uniqueFieldsDescription.translator, [...previousTranslators.values()].join("||"));
        translators.push(newTranslator);
        if (!previousTranslators.has(btoa(JSON.stringify(newTranslator)))) previousTranslators.set(btoa(JSON.stringify(newTranslator)), newTranslator);
    }
    combinedResults.translators = translators;

    const newPublisher = await checkConflict(combinedResults.publisher, uniqueFieldsDescription.publisher, [...previousPublishers.values()].join("||"));
    combinedResults.publisher = newPublisher;
    if (!previousPublishers.has(newPublisher)) previousPublishers.add(newPublisher);

    const newCollection = await checkConflict(combinedResults.collection, uniqueFieldsDescription.collection, [...previousCollections.values()].join("||"));
    combinedResults.collection = newCollection;
    if (!previousCollections.has(newCollection)) previousCollections.add(newCollection);

    return combinedResults;
}

async function checkConflict(field, fieldDescription, previousFiedls) {
    try {
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `
                ${fieldDescription}

                The field : ${field}

                The list : ${previousFiedls}

                If you find a match in the list, return only the matching field exactly as written in the list.
                If you find no match or the list is empty, return only the provided field exactly as written.
                `,
            temperature: 0,
        });
        console.log(completion.data.choices[0].text);
        return completion.data.choices[0].text;
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
}

export { checkForConflicts };
