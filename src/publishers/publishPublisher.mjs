import axios from "axios";
import { env } from "node:process";

async function publishPublisher(publisher) {
    if (!publisher) return;

    try {
        const { data: existingPublisherData } = await axios.get(`${env.STRAPI_URL}/api/publishers?filters[name][$eqi]=${encodeURIComponent(publisher)}`, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        if (existingPublisherData.data.length >= 1) return existingPublisherData.data[0];

        const payload = {
            name: publisher,
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
