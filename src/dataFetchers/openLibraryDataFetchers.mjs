import axios from "axios";

async function fetchOpenLibraryBook(isbn) {
    try {
        const { data } = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);

        const title = data.title;
        const publisher = data.publishers ? data.publishers[0] : null;
        const date = new Date(data.publish_date);
        const pages = data.number_of_pages;
        const authors = await Promise.all(data.authors.map((author) => fetchOpenLibraryAuthor(author)));
        const collection = data.series ? data.series[0] : null;
        const description = data.description ? data.description.value : null;
        const image = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        const translators = null;

        return { title, publisher, date, pages, authors, collection, description, image, translators };
    } catch (err) {
        throw new Error(err);
    }
}

async function fetchOpenLibraryAuthor(author) {
    let name = null,
        biography = null,
        nationality = null, // always null
        photo = null,
        description = null; // always null

    if (author.key) {
        try {
            let key = author.key;
            if (key.includes("authors")) key = key.split("/")[2];
            const { data } = await axios.get(`https://openlibrary.org/authors/${key}.json`);

            name = data.name;
            biography = data.bio ? (typeof data.bio == "string" ? data.bio : data.bio.value ? data.bio.value : "") : "";

            photo = `https://covers.openlibrary.org/a/olid/${key}-L.jpg`;
        } catch (err) {
            throw new Error(author);
        }
    } else {
        try {
            const { data } = await axios.get(`https://openlibrary.org/search/authors.json?q=${encodeURI(author)}`);
            if (data.docs[0]) {
                return await fetchOpenLibraryAuthor(data.docs[0]);
            }
        } catch (err) {
            throw new Error(author);
        }
    }

    return {
        name,
        biography,
        nationality,
        photo,
        description,
    };
}

export { fetchOpenLibraryBook };
