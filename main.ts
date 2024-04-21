import { App, DropdownComponent, Editor, FuzzySuggestModal, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian';

import { getVerse } from 'youversion-api/verse';
// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	language: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	language: "en"
}

interface BibleBook{
	book: {[key: string]: string}
	aliases: [String]
	chapters: number
}

interface Book {
	title: string;
	author: string;
  }
  
const ALL_BOOKS = [
{
	title: "How to Take Smart Notes",
	author: "Sönke Ahrens",
},
{
	title: "Thinking, Fast and Slow",
	author: "Daniel Kahneman",
},
{
	title: "Deep Work",
	author: "Cal Newport",
},
];

const BIBLE_INFO: BibleBook[] = require('./youversion-api/resources/books.json').books;

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			editorCallback: (editor: Editor) => {
				new SampleModal(this.app, editor, this.settings.language).open();
			}
		});

		this.addCommand({
			id: "another-sample-modal",
			name: "Another sample modal with selection",
			editorCallback: (editor: Editor) => {
				new ExampleModal(this.app, editor, this.settings.language).open()
			}
		})

		this.addCommand({
			id: "another-sample-modal-2",
			name: "Another sample modal with selection ZZZ",
			editorCallback: (editor: Editor) => {
				new ExampleModal2(this.app).open()
			}
		})


		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const book = "John"
				const chapter = "3"
				const verse = "16"
				const bible = "KJV"
				const verses = await getVerse("John", "3", "16", "KJV")
				const text = `> [!Lehrtext] ${book} ${chapter}, ${verse} (${bible})\n>#${book} #${book}-${chapter}\n>\n> ${verses.passage}\n\n${verses.citation}`
				editor.replaceSelection(text);
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	editor: Editor
	language: string
	constructor(app: App, editor: Editor, language: string) {
		super(app);
		this.editor = editor,
		this.language = language
	}

	async onOpen() {
		const {contentEl} = this;
		const book = "John"
		const chapter = "3"
		const verse = "16"
		const bible = "KJV"
		const verses = await getVerse("John", "3", "16", "KJV")
		const text = `> [!Lehrtext] ${book} ${chapter}, ${verse} (${bible})\n>#${book} #${book}-${chapter}\n\n> ${verses}`
		contentEl.setText(text);
	}

	async onClose() {
		const {contentEl} = this;
		const book = "John"
		const chapter = "3"
		const verse = "16"
		const bible = "KJV"
		const verses = await getVerse("John", "3", "16", "KJV")
		const text = `> [!Lehrtext] ${book} ${chapter}, ${verse} (${bible})\n>#${book} #${book}-${chapter}\n>\n> ${verses.passage}\n\n${verses.citation}`
		contentEl.empty();
		this.editor.replaceSelection(text)
	}
}

export class ExampleModal2 extends SuggestModal<Book> {
	// Returns all available suggestions.
	getSuggestions(query: string): Book[] {
	  return ALL_BOOKS.filter((book) =>
		book.title.toLowerCase().includes(query.toLowerCase())
	  );
	}
  
	// Renders each suggestion item.
	renderSuggestion(book: Book, el: HTMLElement) {
	  el.createEl("div", { text: book.title });
	  el.createEl("small", { text: book.author });
	}
  
	// Perform action on the selected suggestion.
	onChooseSuggestion(book: Book, evt: MouseEvent | KeyboardEvent) {
	  new Notice(`Selected ${book.title}`);
	}
  }


class ExampleModal extends SuggestModal<BibleBook> {
	editor: Editor
	language: string
	constructor(app: App, editor: Editor, language: string) {
		super(app);
		this.editor = editor,
		this.language = language
	}
	// Returns all available suggestions.
	getSuggestions(query: string): BibleBook[] {
		console.log(BIBLE_INFO)
	  return BIBLE_INFO.filter((book: BibleBook) =>
	  	book.book[this.language].toLowerCase().includes(query.toLowerCase())
	  );
	}
  
	// Renders each suggestion item.
	renderSuggestion(book: any, el: HTMLElement) {
	  el.createEl("div", { text: book[this.language] });
	  el.createEl("small", { text: `${book.book[this.language]} - ${book.aliases[0]}` });
	}
  
	// Perform action on the selected suggestion.
	onChooseSuggestion(book: BibleBook, evt: MouseEvent | KeyboardEvent) {
	  new Notice(`Selected ${book.aliases}`);
	}
  }

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Language')
			.addDropdown(dropDown => {
				dropDown.addOption('en', 'English');
				dropDown.addOption('de', 'Deutsch');
				dropDown.onChange(async (value) =>	{
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
				});
			});
		}
}
