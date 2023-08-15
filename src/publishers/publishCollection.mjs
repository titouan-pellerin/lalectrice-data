import axios from "axios";
import { env } from "node:process";
import slugify from "slugify";

async function publishCollection(collection) {
    if (!collection) return;

    try {
        const slug = slugify(collection, { locale: "fr", trim: true, replacement: "-", lower: true, strict: true });

        const { data: existingCollectionData } = await axios.get(`${env.STRAPI_URL}/api/collections?filters[slug][$eqi]=${encodeURIComponent(slug)}`, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        if (existingCollectionData.data.length >= 1) return existingCollectionData.data[0];

        const payload = {
            name: collection,
            slug,
        };

        const { data } = await axios.post(`${env.STRAPI_URL}/api/collections`, { data: payload }, { headers: { Authorization: `bearer ${env.STRAPI_TOKEN}` } });

        return data.data;
    } catch (err) {
        throw new Error(JSON.stringify(err.response.data));
    }
}

export { publishCollection };
