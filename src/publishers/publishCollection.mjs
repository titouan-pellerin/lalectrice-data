import axios from "axios";
import { env } from "node:process";

async function publishCollection(collection) {
    if (!collection) return;

    try {
        const { data: existingCollectionData } = await axios.get(`${env.STRAPI_URL}/api/collections?filters[name][$eqi]=${encodeURIComponent(collection)}`, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        if (existingCollectionData.data.length >= 1) return existingCollectionData.data[0];

        const payload = {
            name: collection,
        };

        const { data } = await axios.post(`${env.STRAPI_URL}/api/collections`, { data: payload }, { headers: { Authorization: `bearer ${env.STRAPI_TOKEN}` } });

        return data.data;
    } catch (err) {
        throw new Error(JSON.stringify(err.response.data));
    }
}

export { publishCollection };
