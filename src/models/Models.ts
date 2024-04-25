export interface BibleReferenceSettings {
	language: string;
	template: string;
	standardBible: string;
}


export interface BibleBook {
	book: { [key: string]: string };
	aliases: [string];
	chapters: {[key: string]: string};
}