interface BibleReferenceSettings {
	language: string;
	template: string;
	standardBible: string;
}


interface BibleBook {
	book: { [key: string]: string };
	aliases: [string];
	chapters: {[key: string]: string};
}