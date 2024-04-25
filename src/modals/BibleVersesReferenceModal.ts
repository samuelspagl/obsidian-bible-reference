import { SuggestModal, Editor, App } from "obsidian";
import { BIBLE_INFO } from "src/utils/Const";
import { format } from "util";
import { getVerse } from "src/youversion-api/verse";
import { BibleBook, BibleReferenceSettings } from "src/models/Models";

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
		return [query];
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
		const text = format(this.template, {
			book: this.book.book[this.settings.language],
			bookTag: bookTag,
			chapter: this.chapter,
			verse: value,
			verses: verses.passage,
			bibleTag: this.settings.standardBible
		});
		this.editor.replaceSelection(text);
	}
}