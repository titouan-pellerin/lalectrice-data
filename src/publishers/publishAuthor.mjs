import axios from "axios";
import { env } from "node:process";
import { imageDownloader } from "../fetchers/index.mjs";
import FormData from "form-data";
import { createReadStream, statSync } from "node:fs";
import slugify from "slugify";

async function publishAuthor(author, isTranslator = false) {
    try {
        const formData = new FormData();

        let slug = null;
        if (author.name) slug = slugify(author.name, { locale: "fr", trim: true, replacement: "-", lower: true, strict: true });

        const { data: existingAuthorData } = await axios.get(`${env.STRAPI_URL}/api/authors?filters[slug][$eqi]=${encodeURIComponent(slug)}`, {
            headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` },
        });

        if (existingAuthorData.data.length >= 1) return existingAuthorData.data[0];

        let photoPath;
        if (author.photo) {
            photoPath = await imageDownloader(author.photo, author.photo.split("/").pop().split(".")[0] + ".jpg");

            const stats = statSync(photoPath);
            if (stats.size > 1000) formData.append("files.picture", createReadStream(photoPath), author.name + ".jpg");
        }

        const payload = {
            fullname: author.name,
            translator: isTranslator,
            description: author.description || author.biography,
            nationality: author.nationality,
            slug,
        };

        formData.append("data", JSON.stringify(payload));

        const { data } = await axios.post(`${env.STRAPI_URL}/api/authors`, formData, { headers: { Authorization: `Bearer ${env.STRAPI_TOKEN}` } });

        return data.data;
    } catch (err) {
        throw new Error(JSON.stringify(err.response.data));
    }
}

export { publishAuthor };
