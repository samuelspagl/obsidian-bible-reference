import * as cheerio from 'cheerio';
import { requestUrl, RequestUrlParam } from 'obsidian';

interface bookType {
    book: String;
    aliases: Array<String>;
    chapters: Number;
}

export async function getVerse( book: string, chapter: string, verses: string, version: string = "NIV") {

    const versions = require('./versions.json');
    const bookList = require('./resources/books.json');
    const baseURL = "https://www.bible.com/bible";

    function apiError(code: number, message: string) {
        return {
            "code": code,
            "message": message
        };
    }

    if (!book) return apiError(400, "Missing field 'book'");

    // let versionFinder: any = {
    //     version: Object.keys(versions)[Object.keys(versions).indexOf(version.toLocaleString().toLocaleUpperCase())] ??= "NIV",
    //     id: versions[version.toString().toLocaleUpperCase()] ??= 1,
    // }

    let URL = `${baseURL}/${version}/${book}.${chapter}.${verses}`;
    console.log(URL)
    try {
        const response = await requestUrl(URL);
        console.log(response.status)
        console.log(response.text)
        const $ = cheerio.load(response.text);

        const lastVerse = $(".ChapterContent_reader__UZc2K").eq(-1).text();
        if (lastVerse) return apiError(400, "Verse not found");

        const versesArray: Array<String> = [];
        const citationsArray: Array<String> = [];
        const wrapper = $(".text-19");
        const citationWrapper = $(".text-text-light");

        await wrapper.each((i, p) => {
            let unformattedVerse = $(p).eq(0).text();
            let formattedVerse = unformattedVerse.replace(/\n/g, ' ');
            versesArray.push(formattedVerse)
        })

        await citationWrapper.each((i, p) => {
            let citation = $(p).eq(0).text();

            citationsArray.push(citation)
        })

        return {
            citation: citationsArray[0],
            passage: versesArray[0]
        }
    } catch (err) {
        console.error(err);
    }
}
