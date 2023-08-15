import axios from "axios";
import { env } from "node:process";
import { imageDownloader } from "../fetchers/imageDownloader.mjs";
import { createReadStream, readFileSync, statSync } from "node:fs";
import FormData from "form-data";
import slugify from "slugify";

async function publishBook(isbn, book, chronicle, authorsIds = [], publishersIds = [], collectionId = []) {
    let coverPath;
    try {
        const formData = new FormData();

        if (book.image) {
            coverPath = await imageDownloader(book.image, isbn + ".jpg");
            const stats = statSync(coverPath);
            if (stats.size > 1000) formData.append("files.cover", createReadStream(coverPath), isbn + ".jpg");
        }

        let slug;
        if (book.title) slug = slugify(book.title, { locale: "fr", trim: true, replacement: "-", lower: true, strict: true });

        const payload = {
            isbn,
            title: book.title,
            pageCount: isNaN(book.pages) ? 0 : book.pages,
            chronicleContent: chronicle?.data?.bodySplit,
            publishDate: chronicle?.data?.firstDate ? frenchDateToEnglishDate(chronicle.data.firstDate) : null,
            authors: authorsIds.filter((value) => value !== undefined),
            publishers: publishersIds.filter((value) => value !== undefined),
            collections: collectionId.filter((value) => value !== undefined),
            columnist: 2,
            slug,
        };

        formData.append("data", JSON.stringify(payload));

        const { data } = await axios.post(`${env.STRAPI_URL}/api/books`, formData, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        return data;
    } catch (err) {
        throw new Error(JSON.stringify(err.response.data));
    }
}

function frenchDateToEnglishDate(frenchDate) {
    const monthsInFrench = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

    let [day, month, year] = frenchDate.split(" ");

    const monthIndex = monthsInFrench.indexOf(month.toLowerCase());

    const monthNumber = (monthIndex + 1).toString().padStart(2, "0");

    day = parseInt(day, 10).toString().padStart(2, "0");

    return `${year}-${monthNumber}-${day}`;
}

export { publishBook };
