import axios from "axios";
import { createWriteStream } from "node:fs";

function imageDownloader(url, filename) {
    const filepath = "./tmp/" + filename;
    return new Promise(async (resolve, reject) => {
        const writeStream = createWriteStream(filepath);
        const axiosStream = await axios.get(url, { responseType: "stream" });

        axiosStream.data.pipe(writeStream);

        let error;

        writeStream.on("error", (err) => {
            error = err;
            writeStream.close();
            reject(err);
        });

        writeStream.on("close", () => {
            if (!error) {
                resolve(filepath);
            }
        });
    });
}

export { imageDownloader };
