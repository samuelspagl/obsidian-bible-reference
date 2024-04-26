import { SuggestModal, Editor, App } from "obsidian";
import { BIBLE_INFO } from "src/utils/Const";
import { format } from "util";
import { getVerse } from "src/youversion-api/verse";
import { BibleBook, BibleReferenceSettings } from "src/models/Models";
import { format_variables } from "src/utils/Helper";

export class BibleVerseSuggestionFirstWindow extends SuggestModal<BibleBook> {
	editor: Editor;
	settings: BibleReferenceSettings;
	template: string;
	constructor(
		app: App,
		editor: Editor,
		settings: BibleReferenceSettings,
		template: string
	) {
		super(app);
		(this.editor = editor),
			(this.settings = settings),
			(this.template = template);
	}
	// Returns all available suggestions.
	getSuggestions(query: string): BibleBook[] {
		console.log(BIBLE_INFO);
		return BIBLE_INFO.filter((book: BibleBook) =>
			book.book[this.settings.language]
				.toLowerCase()
				.includes(query.toLowerCase())
		);
	}

	// Renders each suggestion item.
	renderSuggestion(book: any, el: HTMLElement) {
		el.createEl("div", { text: book[this.settings.language] });
		el.createEl("small", {
			text: `${book.book[this.settings.language]} - ${book.aliases[0]}`,
		});
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(book: BibleBook, evt: MouseEvent | KeyboardEvent) {
		new BibleVerseSuggestionSecondWindow(
			this.app,
			this.editor,
			this.settings,
			this.template,
			book
		).open();
	}
}

class BibleVerseSuggestionSecondWindow extends SuggestModal<string> {
	editor: Editor;
	settings: BibleReferenceSettings;
	template: string;
	book: BibleBook;

	constructor(
		app: App,
		editor: Editor,
		settings: BibleReferenceSettings,
		template: string,
		book: BibleBook
	) {
		super(app);
		this.settings = settings;
		this.template = template;
		this.book = book;
		this.editor = editor;
	}

	getSuggestions(query: string): string[] | Promise<string[]> {
		if (query == "") {
			return Array.from({ length: Object.keys(this.book.chapters).length }, (value, index) =>
				(index + 1).toString()
			);
		}
		const converted_query: number = +query;
		if (converted_query > Object.keys(this.book.chapters).length) {
			return [];
		}
		return [query];
	}

	renderSuggestion(value: string, el: HTMLElement) {
		el.createEl("small", {
			text: `${this.book.book[this.settings.language]} (${
				this.book.aliases[0]
			}) ${value}`,
		});
	}

	onChooseSuggestion(value: string, evt: MouseEvent | KeyboardEvent) {
		new BibleVerseSuggestionThirdWindow(
			this.app,
			this.editor,
			this.settings,
			this.template,
			this.book,
			value
		).open();
	}
}

class BibleVerseSuggestionThirdWindow extends SuggestModal<string> {
	editor: Editor;
	settings: BibleReferenceSettings;
	template: string;
	book: BibleBook;
	chapter: string;

	constructor(
		app: App,
		editor: Editor,
		settings: BibleReferenceSettings,
		template: string,
		book: BibleBook,
		chapter: string
	) {
		super(app);
		this.settings = settings;
		this.template = template;
		this.book = book;
		this.editor = editor;
		this.chapter = chapter;
	}

	getSuggestions(query: string): string[] | Promise<string[]> {
        query = query.replace(" ", "")
        const matcherSingle = query.match(/^([1-9][0-9]*)$/)
        console.log(matcherSingle)
        console.log(matcherSingle?.[0])
        console.log(matcherSingle?.[1])
        if (matcherSingle){
            console.log("Matcher single matches")
            return [`${query}`, "ℹ️ You can also select a range of verses with a query like eg. '1-10'."]
        }

        const matcherMinus = query.match(/^([1-9][0-9]*)-$/)
        if (matcherMinus){
            console.log("Matcher minus matches")
            const firstVerse = parseInt(matcherMinus[1])
            const amountVerses = parseInt(this.book.chapters[this.chapter])
            if (firstVerse>amountVerses){
                return [`This book only has ${this.book.chapters[this.chapter]} verses.`]
            }else{
                const suggestions:Array<string> = []
                const amount = amountVerses-firstVerse
                    for (const a of Array(amount).keys()){
                        suggestions.push(`${firstVerse}-${a+firstVerse+1}`)
                    }
                return suggestions
            }
        }


        const matcherFull = query.match(/^([1-9][0-9]*)-([1-9][0-9]*)$/)
        if (matcherFull){
            if (parseInt(matcherFull[1]) > parseInt(matcherFull[2])){
                return ["Please use a correct formatting like '5' or '10-12'. The first verse cannot be greater than the second."]
            }
            return [query]
        }
        
        const amountVerses = parseInt(this.book.chapters[this.chapter])
        const suggestions = Array.from({length: amountVerses}, (_, i) => `${i + 1}`)
		return suggestions;
	}

	renderSuggestion(value: string, el: HTMLElement) {
		el.createEl("small", {
			text: `${this.book.book[this.settings.language]} (${
				this.book.aliases[0]
			}) - ${this.chapter}, ${value}`,
		});
	}

	async onChooseSuggestion(value: string, evt: MouseEvent | KeyboardEvent) {
		console.log(this.settings.standardBible);
		const verses = await getVerse(
			this.book.aliases[0],
			this.chapter,
			value,
			this.settings.standardBible
		);
		console.log(verses);
		const bookTag = this.book.book[this.settings.language]
			.replace(".", "")
			.replace(/\s+\(.+\)/, "")
			.replace(" ", "");
		console.log(`bookTag is "${bookTag}`);
		console.log(`template: "${this.template}"`);
		const text = format_variables(this.template, {
			book: this.book.book[this.settings.language],
			bookTag: bookTag,
			chapter: this.chapter,
			verse: value,
			verses: verses.passage,
			bibleTag: this.settings.standardBible,
            url: verses.url
		});
		this.editor.replaceSelection(text);
	}
}