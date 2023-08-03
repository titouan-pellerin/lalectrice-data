import axios from "axios";
import { env } from "node:process";

async function publishBook(isbn, book, chronicle, authorsIds = [], publishersIds = [], collectionId = []) {
    const payload = {
        isbn,
        title: book.title,
        pageCount: book.pages,
        chronicleContent: chronicle.bodySplit,
        publishDate: frenchDateToEnglishDate(chronicle.firstDate),
        authors: authorsIds.filter((value) => value),
        publishers: publishersIds.filter((value) => value),
        collections: collectionId.filter((value) => value),
    };

    const { data } = await axios.post(`${env.STRAPI_URL}/api/books`, { data: payload }, { headers: { Authorization: `bearer ${env.STRAPI_TOKEN}` } });
    return data;
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
