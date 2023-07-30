import axios from "axios";
import { parseStringPromise } from "xml2js";
async function fetchBnfBook(isbn) {
    let title = null,
        publisher = null,
        description = null,
        pages = null,
        authors = null,
        collection = null,
        translators = null,
        date = null,
        image = null;

    try {
        const { data } = await axios.get(`http://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=bib.isbn%20adj%20%22${isbn}%22`);
        const parsedData = await parseStringPromise(data);
        const records = parsedData["srw:searchRetrieveResponse"]["srw:records"];

        if (records.length > 0 && records[0]) {
            const datafields = records[0]["srw:record"][0]["srw:recordData"][0]["mxc:record"][0]["mxc:datafield"];

            const titleArray = datafields.filter((field) => field.$.tag == 200);
            if (titleArray.length > 0) title = titleArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;

            const descriptionArray = datafields.filter((field) => field.$.tag == 330);
            if (descriptionArray.length > 0) description = descriptionArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;

            const collectionArray = datafields.filter((field) => field.$.tag == 225);
            if (collectionArray.length > 0) collection = collectionArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;

            const pagesArray = datafields.filter((field) => field.$.tag == 215);
            if (pagesArray.length > 0) pages = extractPageCount(pagesArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._);

            const publisherArray1 = datafields.filter((field) => field.$.tag == 210);
            let publisher1;
            if (publisherArray1.length > 0) publisher1 = publisherArray1[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "c")[0]._;

            const publisherArray2 = datafields.filter((field) => field.$.tag == 214);
            let publisher2;
            if (publisherArray2.length > 0) publisher2 = publisherArray2[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "c")[0]._;

            publisher = publisher1 ? publisher1 : publisher2 ? publisher2 : null;

            const authorsArray = datafields.filter(
                (field) => field.$.tag == 700 || field.$.tag == 701 || field.$.tag == 702 || field.$.tag == 710 || field.$.tag == 711 || field.$.tag == 712
            );
            if (authorsArray.length > 0) {
                translators = await Promise.all(
                    authorsArray
                        .filter((authorField) => {
                            const translatorField = authorField["mxc:subfield"].filter((subfield) => subfield.$.code == "4");
                            if (translatorField.length > 0) return translatorField[0]._ == 730;
                        })
                        .map((translatorField) => {
                            let firstName, lastname, id;
                            const firstnameArray = translatorField["mxc:subfield"].filter((subfield) => subfield.$.code == "b");
                            if (firstnameArray.length > 0) firstName = firstnameArray[0]._;

                            const lastnameArray = translatorField["mxc:subfield"].filter((subfield) => subfield.$.code == "a");
                            if (lastnameArray.length > 0) lastname = lastnameArray[0]._;

                            const idArray = translatorField["mxc:subfield"].filter((subfield) => subfield.$.code == "3");

                            if (idArray.length > 0) id = idArray[0]._;

                            return { name: firstName + " " + lastname, id };
                        })
                        .map((author) => fetchBnfAuthor(author))
                );

                authors = await Promise.all(
                    authorsArray
                        .filter((authorField) => {
                            const translatorField = authorField["mxc:subfield"].filter((subfield) => subfield.$.code == "4");
                            if (translatorField.length > 0) return translatorField[0]._ != 730;
                        })
                        .map((authorField) => {
                            let firstName, lastname, id;

                            const firstnameArray = authorField["mxc:subfield"].filter((subfield) => subfield.$.code == "b");
                            if (firstnameArray.length > 0) firstName = firstnameArray[0]._;

                            const lastnameArray = authorField["mxc:subfield"].filter((subfield) => subfield.$.code == "a");
                            if (lastnameArray.length > 0) lastname = lastnameArray[0]._;

                            const idArray = authorField["mxc:subfield"].filter((subfield) => subfield.$.code == "3");

                            if (idArray.length > 0) id = idArray[0]._;

                            return { name: firstName + " " + lastname, id };
                        })
                        .map((author) => fetchBnfAuthor(author))
                );
            }

            return {
                title,
                publisher,
                date,
                pages,
                authors,
                translators,
                collection,
                description,
                image,
            };
        }
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
}

async function fetchBnfAuthor(author) {
    let name = null,
        biography = null,
        nationality = null,
        photo = null,
        description = null;

    try {
        const { data } = await axios.get(`https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=(aut.recordId%20adj%20"${author.id}")`);

        const parsedData = await parseStringPromise(data);
        const records = parsedData["srw:searchRetrieveResponse"]["srw:records"];

        let datafields;
        if (records.length > 0 && records[0]) {
            datafields = records[0]["srw:record"][0]["srw:recordData"][0]["mxc:record"][0]["mxc:datafield"];

            const personNameArray = datafields.filter((field) => field.$.tag == 200);
            const collectivityNameArray = datafields.filter((field) => field.$.tag == 210);

            let personName, collectivityName;
            if (personNameArray.length > 0) {
                const lastname = personNameArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;
                const firstnameArray = personNameArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "b");
                let firstname = "";
                if (firstnameArray.length > 0) firstname = firstnameArray[0]._;

                personName = firstname + " " + lastname;
                personName = personName.trim();
            }
            if (collectivityNameArray.length > 0) {
                const collectivityFirstName = collectivityNameArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;
                const collectivitySubNameArray = collectivityNameArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "b");

                let collectivitySubName = "";
                if (collectivitySubNameArray.length > 0) collectivitySubName = collectivitySubNameArray[0]._;

                collectivityName = collectivityFirstName + " " + collectivitySubName;
                collectivityName = collectivityName.trim();
            }

            name = personName ? personName : collectivityName;

            const descriptionArray = datafields.filter((field) => field.$.tag == 300);
            if (descriptionArray.length > 0) {
                description = descriptionArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;
            }

            const biographyArray = datafields.filter((field) => field.$.tag == 340);
            if (biographyArray.length > 0) {
                biography = biographyArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;
            }

            const nationalityArray = datafields.filter((field) => field.$.tag == 102);
            if (nationalityArray.length > 0) {
                nationality = nationalityArray[0]["mxc:subfield"].filter((subfield) => subfield.$.code == "a")[0]._;
            }
        }
    } catch (err) {
        console.error(err);
        throw new Error(author);
    }

    return {
        name,
        biography,
        nationality,
        photo,
        description,
    };
}

function extractPageCount(string) {
    const pageCountRegex = /\d{2,4}/;
    let match;
    if ((match = pageCountRegex.exec(string)) !== null) return Number(match[0]);
    return null;
}

export { fetchBnfBook, fetchBnfAuthor };
