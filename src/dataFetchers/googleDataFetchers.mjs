import axios from "axios";

async function fetchGoogleBooksBook(isbn) {
    try {
        const { data } = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_API_KEY}`, { timeout: 60000 });
        const title = data.items[0].volumeInfo.title;
        const publisher = data.items[0].volumeInfo.publisher;
        const date = new Date(data.items[0].volumeInfo.publishedDate);
        const description = data.items[0].volumeInfo.description;
        const pages = data.items[0].volumeInfo.pageCount ? data.items[0].volumeInfo.pageCount : 0;
        const image = data.items[0].volumeInfo.imageLinks ? data.items[0].volumeInfo.imageLinks.thumbnail : null;
        const authors = data.items[0].volumeInfo.authors?.map((author) => ({ name: author }));
        const collection = null;
        const translators = null;

        return { title, publisher, date, description, pages, image, authors, collection, translators };
    } catch (err) {
        throw new Error(err);
    }
}

export { fetchGoogleBooksBook };
