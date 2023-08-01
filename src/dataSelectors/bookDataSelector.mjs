function chooseBookData(google, openLivray, bnf, { openlibraryWeight, bnfWeight }) {
    const first = bnfWeight === 2 ? bnf : openlibraryWeight === 2 ? openLivray : google;
    const second = bnfWeight === 1 ? bnf : openlibraryWeight === 1 ? openLivray : google;
    const third = bnfWeight === 0 ? bnf : openlibraryWeight === 0 ? openLivray : google;

    return first ? first : second ? second : third ? third : null;
}

function combineBookData({ google, openLibrary, bnf }) {
    const returnData = {
        title: null,
        authors: null,
        publisher: null,
        date: null,
        description: null,
        pages: null,
        image: null,
        collection: null,
        translators: null,
    };

    if (bnf) returnData.translators = bnf?.translators;

    returnData.title = chooseBookData(google?.title, openLibrary?.title, bnf?.title, { openlibraryWeight: 1, bnfWeight: 2 });

    returnData.authors = chooseBookData(google?.authors, openLibrary?.authors, bnf?.authors, { openlibraryWeight: 1, bnfWeight: 2 });

    returnData.publisher = chooseBookData(google?.publisher, openLibrary?.publisher, bnf?.publisher, { openlibraryWeight: 1, bnfWeight: 2 });
    returnData.date = chooseBookData(google?.date, openLibrary?.date, bnf?.date, { openlibraryWeight: 2, bnfWeight: 0 });
    returnData.description = chooseBookData(google?.description, openLibrary?.description, bnf?.description, { openlibraryWeight: 1, bnfWeight: 2 });
    returnData.pages = chooseBookData(google?.pages, openLibrary?.pages, bnf?.pages, { openlibraryWeight: 2, bnfWeight: 0 });
    returnData.image = chooseBookData(google?.image, openLibrary?.image, bnf?.image, { openlibraryWeight: 1, bnfWeight: 0 });
    returnData.collection = chooseBookData(google?.collection, openLibrary?.collection, bnf?.collection, { openlibraryWeight: 1, bnfWeight: 2 });

    return returnData;
}

export { combineBookData };
