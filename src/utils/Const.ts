import { BibleBook } from "src/models/Models";

export const BIBLE_INFO: BibleBook[] =
	require("../resources/books.json");
export const BIBLES_JSON: {
	[key: string]: string;
} = require("../resources/versions.json");