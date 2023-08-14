import axios from "axios";
import { env } from "node:process";
import { imageDownloader } from "../fetchers/imageDownloader.mjs";
import { createReadStream, readFileSync, statSync } from "node:fs";
import FormData from "form-data";

async function publishBook(isbn, book, chronicle, authorsIds = [], publishersIds = [], collectionId = []) {
    let coverPath;
    try {
        const formData = new FormData();

        if (book.image) {
            coverPath = await imageDownloader(book.image, isbn + ".jpg");
            const stats = statSync(coverPath);
            if (stats.size > 1000) formData.append("files.cover", createReadStream(coverPath), isbn + ".jpg");
        }

        const payload = {
            isbn,
            title: book.title,
            pageCount: book.pages,
            chronicleContent: chronicle.data.bodySplit,
            publishDate: frenchDateToEnglishDate(chronicle.data.firstDate),
            authors: authorsIds.filter((value) => value !== undefined),
            publishers: publishersIds.filter((value) => value !== undefined),
            collections: collectionId.filter((value) => value !== undefined),
            columnist: 1,
        };

        formData.append("data", JSON.stringify(payload));

        const { data } = await axios.post(`${env.STRAPI_URL}/api/books`, formData, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        return data;
    } catch (err) {
        console.log(err);
        throw new Error(JSON.stringify(err.response.data));
    }
}

function frenchDateToEnglishDate(frenchDate) {
    const monthsInFrench = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const monthsInEnglish = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let [day, month, year] = frenchDate.split(" ");

    month = monthsInEnglish[monthsInFrench.indexOf(month.toLowerCase())];

    const englishDate = `${day} ${month} ${year}`;

    return new Date(Date.parse(englishDate));
}

export { publishBook };
