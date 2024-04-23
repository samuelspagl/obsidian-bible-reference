import {
	App,
	Editor,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	SuggestModal,
	TextAreaComponent,
} from "obsidian";

import { getVerse } from "youversion-api/verse";
// Remember to rename these classes and interfaces!

function format(text: string, args: { [key: string]: string }) {
	for (const attr in args) {
		const rgx = new RegExp("\\{" + attr + "}", "g");
		text = text.replace(rgx, args[attr]);
	}
	return text;
}

interface BibleReferenceSettings {
	language: string;
	template: string;
	standardBible: string;
}

const DEFAULT_SETTINGS: Partial<BibleReferenceSettings> = {
	language: "en",
	template:
		"> [!Lehrtext] {book} {chapter}, {verse} (KJV)\n>#{bookTag} #{bookTag}-{chapter}\n>\n> {verses}\n\n",
	standardBible: "877",
};

interface BibleBook {
	book: { [key: string]: string };
	aliases: [string];
	chapters: number;
}

const BIBLE_INFO: BibleBook[] =
	require("./youversion-api/resources/books.json").books;
const BIBLES_JSON: {
	[key: string]: string;
} = require("./youversion-api/versions.json");

export default class BibleReference extends Plugin {
	settings: BibleReferenceSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		this.addCommand({
			id: "bible-referencing-modal",
			name: "Add Bible Verse",
			editorCallback: (editor: Editor) => {
				new BibleVerseSuggestionFirstWindow(
					this.app,
					editor,
					this.settings,
					this.settings.template
				).open();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new BibleReferencingSettings(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class BibleVerseSuggestionFirstWindow extends SuggestModal<BibleBook> {
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
			return Array.from({ length: this.book.chapters }, (value, index) =>
				(index + 1).toString()
			);
		}
		const converted_query: number = +query;
		if (converted_query > this.book.chapters) {
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

class BibleReferencingSettings extends PluginSettingTab {
	plugin: BibleReference;

	constructor(app: App, plugin: BibleReference) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h1", { text: "Bible Referencing" });
		containerEl.createEl("p", { text: "Created by " }).createEl("a", {
			text: "Säm 👩🏽‍💻",
			href: "https://github.com/samuelspagl",
		});

		new Setting(containerEl).setName("Language").addDropdown((dropDown) => {
			dropDown.addOption("en", "English");
			dropDown.addOption("de", "Deutsch");
			dropDown.setValue(this.plugin.settings.language);
			dropDown.onChange(async (value) => {
				this.plugin.settings.language = value;
				await this.plugin.saveSettings();
			});
		});
		new Setting(containerEl).setName("Bible").addDropdown((dropDown) => {
			for (const opt in BIBLES_JSON) {
				console.log(`${BIBLES_JSON[opt]} - ${opt}`);
				dropDown.addOption(BIBLES_JSON[opt], opt);
			}
			dropDown.setValue(this.plugin.settings.standardBible);
			// dropDown.addOptions(BIBLES_JSON)
			dropDown.onChange(async (value) => {
				console.log(value);
				this.plugin.settings.standardBible = value;
				await this.plugin.saveSettings();
			});
		});

		const stylingTemplateSetting = new Setting(containerEl);
		stylingTemplateSetting.settingEl.setAttribute(
			"style",
			"display: grid; grid-template-columns: 1fr;"
		);
		stylingTemplateSetting
			.setName("Template")
			.setDesc(
				"Create your own template that will be used for inserting the text. You can use the following tags:"+
				"{book} | {chapter} | {verse} | {bookTag} | {verses} | {bibleTag}"
			);

		const templateTextArea = new TextAreaComponent(
			stylingTemplateSetting.controlEl
		);
		templateTextArea.inputEl.setAttribute(
			"style",
			"margin-top: 12px; width: 100%;  height: 32vh;"
		);
		templateTextArea.inputEl.setAttribute("class", "ms-css-editor");
		templateTextArea
			.setPlaceholder(
				"> [!Lehrtext] {book} {chapter}, {verse} (KJV)\n>#{book} #{book}-{chapter}\n>\n> ${verses}\n\n"
			)
			.setValue(this.plugin.settings.template)
			.onChange(async (value) => {
				this.plugin.settings.template = value;
				await this.plugin.saveSettings();
			});
	}
}
