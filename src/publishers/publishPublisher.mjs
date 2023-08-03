import axios from "axios";
import { env } from "node:process";

async function publishPublisher(publisher) {
    if (!publisher) return;

    try {
        const { data: existingPublisherData } = await axios.get(`${env.STRAPI_URL}/api/publishers?filters[name][$eqi]=${publisher}`, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        if (existingPublisherData.data.length >= 1) return existingPublisherData.data[0];

        const payload = {
            name: publisher,
        };

        const { data } = await axios.post(`${env.STRAPI_URL}/api/publishers`, { data: payload }, { headers: { Authorization: `bearer ${env.STRAPI_TOKEN}` } });
        return data.data;
    } catch (err) {
        console.error(err.response.data.error.details.errors, publisher);
    }
}

export { publishPublisher };
