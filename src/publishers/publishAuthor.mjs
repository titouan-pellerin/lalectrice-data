import axios from "axios";
import { env } from "node:process";

async function publishAuthor(author, isTranslator = false) {
    const { data: existingAuthorData } = await axios.get(`${env.STRAPI_URL}/api/authors?filters[fullname][$eqi]=${author.name}`, {
        headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
    });

    if (existingAuthorData.data.length >= 1) return existingAuthorData.data[0];

    const payload = {
        fullname: author.name,
        translator: isTranslator,
        description: author.description || author.biography,
        nationality: author.nationality,
    };

    const { data } = await axios.post(`${env.STRAPI_URL}/api/authors`, { data: payload }, { headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` } });

    return data.data;
}

export { publishAuthor };
