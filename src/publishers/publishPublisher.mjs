import axios from "axios";
import { env } from "node:process";
import slugify from "slugify";

async function publishPublisher(publisher) {
    if (!publisher) return;

    try {
        const slug = slugify(publisher, { locale: "fr", trim: true, replacement: "-", lower: true, strict: true });

        const { data: existingPublisherData } = await axios.get(`${env.STRAPI_URL}/api/publishers?filters[slug][$eqi]=${encodeURIComponent(slug)}`, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        if (existingPublisherData.data.length >= 1) return existingPublisherData.data[0];

        const payload = {
            name: publisher,
            slug,
        };

        const { data } = await axios.post(`${env.STRAPI_URL}/api/publishers`, { data: payload }, { headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` } });

        return data.data;
    } catch (err) {
        throw new Error(JSON.stringify(err.response.data));
    }
}

async function addCollections(ids = [], publisherId) {
    if (!ids || ids.length === 0 || !publisherId) return;

    try {
        const { data } = await axios.put(
            `${env.STRAPI_URL}/api/publishers/${publisherId}`,
            { data: { collections: ids } },
            { headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` } }
        );
        return data.data;
    } catch (err) {
        throw new Error(JSON.stringify(err.response.data));
    }
}

export { publishPublisher, addCollections };
