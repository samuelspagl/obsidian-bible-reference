// Thanks to Glowstudent for providing a nice idea of how
// to fetch data from YouVersion.
// His repository https://github.com/Glowstudent777/YouVersion-API-NPM was the 
// baseline for the plugin.
import * as cheerio from 'cheerio';
import { requestUrl, RequestUrlParam } from 'obsidian';

interface bookType {
    book: String;
    aliases: Array<String>;
    chapters: Number;
}

class ApiError{
    code: number
    message: string
    constructor(code: number, message: string){
        this.code = code
        this.message = message
    }
}

export async function getVerse( book: string, chapter: string, verses: string, version: string = "NIV") {
    const baseURL = "https://www.bible.com/bible";

    if (!book) throw new ApiError(400, "Missing field 'book'");
    let URL = `${baseURL}/${version}/${book}.${chapter}.${verses}`;

    const response = await requestUrl(URL);
    if (!(response.status >= 200 && response.status <= 301)) throw new ApiError(response.status, response.text)
    const $ = cheerio.load(response.text);

    const lastVerse = $(".ChapterContent_reader__UZc2K").eq(-1).text();
    if (lastVerse) throw new ApiError(400, "Verse not found");

    const versesArray: Array<string> = [];
    const citationsArray: Array<string> = [];
    const wrapper = $(".text-19");
    const citationWrapper = $(".text-text-light");

    wrapper.each((i, p) => {
        let unformattedVerse = $(p).eq(0).text();
        let formattedVerse = unformattedVerse.replace(/\n/g, ' ');
        versesArray.push(formattedVerse)
    })

    citationWrapper.each((i, p) => {
        let citation = $(p).eq(0).text();

        citationsArray.push(citation)
    })

    return {
        citation: citationsArray[0],
        passage: versesArray[0],
        url: URL
    }

}
