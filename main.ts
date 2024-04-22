import { App, DropdownComponent, Editor, FuzzySuggestModal, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian';

import { getVerse } from 'youversion-api/verse';
// Remember to rename these classes and interfaces!


function format(text: string, args:{[key: string]: string}) {
    for(var attr in args){
        var rgx = new RegExp('\\{' + attr + '}','g');
        text = text.replace(rgx, args[attr]);
    }
    return text
};

interface BibleReferenceSettings {
    mySetting: string;
    language: string;
    template: string;
    standardBible: string;
}

const DEFAULT_SETTINGS: Partial<BibleReferenceSettings> = {
    mySetting: 'default',
    language: "en",
    template: "> [!Lehrtext] {book} {chapter}, {verse} (KJV)\n>#{bookTag} #{bookTag}-{chapter}\n>\n> {verses}\n\n",
    standardBible: "877"
}

interface BibleBook{
    book: {[key: string]: string}
    aliases: [string]
    chapters: number
}

const BIBLE_INFO: BibleBook[] = require('./youversion-api/resources/books.json').books;
const BIBLES_JSON: {[key: string]: string} = require("./youversion-api/versions.json")

export default class BibleReference extends Plugin {
    settings: BibleReferenceSettings;

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
                new SampleModal(this.app, editor, this.settings).open();
            }
        });

        this.addCommand({
            id: "another-sample-modal",
            name: "Another sample modal with selection",
            editorCallback: (editor: Editor) => {
                new ExampleModal(this.app, editor, this.settings, this.settings.template).open()
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
    settings: BibleReferenceSettings
    constructor(app: App, editor: Editor, settings: BibleReferenceSettings) {
        super(app);
        this.editor = editor,
        this.settings = settings
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

class ExampleModal extends SuggestModal<BibleBook> {
    editor: Editor
    settings: BibleReferenceSettings
    template: string
    constructor(app: App, editor: Editor, settings: BibleReferenceSettings, template: string) {
        super(app);
        this.editor = editor,
        this.settings = settings,
        this.template = template
    }
    // Returns all available suggestions.
    getSuggestions(query: string): BibleBook[] {
        console.log(BIBLE_INFO)
      return BIBLE_INFO.filter((book: BibleBook) =>
        book.book[this.settings.language].toLowerCase().includes(query.toLowerCase())
      );
    }
  
    // Renders each suggestion item.
    renderSuggestion(book: any, el: HTMLElement) {
      el.createEl("div", { text: book[this.settings.language] });
      el.createEl("small", { text: `${book.book[this.settings.language]} - ${book.aliases[0]}` });
    }
  
    // Perform action on the selected suggestion.
    onChooseSuggestion(book: BibleBook, evt: MouseEvent | KeyboardEvent) {
      new SecondModal(this.app, this.editor, this.settings, this.template, book).open()
    }
  }

class SecondModal extends SuggestModal<string>{
    editor: Editor
    settings: BibleReferenceSettings
    template: string
    book: BibleBook

    constructor(app: App, editor: Editor, settings: BibleReferenceSettings, template: string, book: BibleBook){
        super(app)
        this.settings = settings
        this.template = template
        this.book = book
        this.editor = editor
    }

    getSuggestions(query: string): string[] | Promise<string[]> {
        if (query == ""){
            return Array.from({length:this.book.chapters}, (value, index) => (index+1).toString())
        }
        var converted_query: number = +query;
        if (converted_query > this.book.chapters){
            return []
        }
        return [query]
    }

    renderSuggestion(value: string, el: HTMLElement) {
        el.createEl("small", { text: `${this.book.book[this.settings.language]} (${this.book.aliases[0]}) ${value}`});
    }

    onChooseSuggestion(value: string, evt: MouseEvent | KeyboardEvent) {
        new ThirdModal(this.app, this.editor, this.settings,this.template, this.book, value).open()
      }
}

class ThirdModal extends SuggestModal<string>{
    editor: Editor
    settings: BibleReferenceSettings
    template: string
    book: BibleBook
    chapter: string

    constructor(app: App, editor: Editor, settings: BibleReferenceSettings, template: string, book: BibleBook, chapter: string){
        super(app)
        this.settings = settings
        this.template = template
        this.book = book
        this.editor = editor
        this.chapter = chapter
    }

    getSuggestions(query: string): string[] | Promise<string[]> {
        return [query]
    }

    renderSuggestion(value: string, el: HTMLElement) {
        el.createEl("small", { text: `${this.book.book[this.settings.language]} (${this.book.aliases[0]}) - ${this.chapter}, ${value}`});
    }

    async onChooseSuggestion(value: string, evt: MouseEvent | KeyboardEvent) {
		console.log(this.settings.standardBible)
		const verses = await getVerse(this.book.aliases[0], this.chapter, value, this.settings.standardBible)
        console.log(verses)
        var bookTag = this.book.book[this.settings.language].replace('.','').replace(/\s+\(.+\)/, '').replace(' ','')
        console.log(`bookTag is "${bookTag}`)
        console.log(`template: "${this.template}"`)
        var text =  format(this.template,{
                    'book': this.book.book[this.settings.language],
                    'bookTag':bookTag,
                    'chapter': this.chapter, 
                    'verse': value, 
                    'verses': verses.passage})
        //const text = `> [!Lehrtext] ${this.book.book[this.settings.language]} ${this.chapter}, ${value} (KJV)\n>#${this.book.book[this.settings.language]} #${this.book.book[this.settings.language]}-${this.chapter}\n>\n> ${verses.passage}\n\n`
        this.editor.replaceSelection(text)
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: BibleReference;

    constructor(app: App, plugin: BibleReference) {
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
				dropDown.setValue(this.plugin.settings.language)
                dropDown.onChange(async (value) =>  {
                    this.plugin.settings.language = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('Template')
            .addTextArea(textarea => textarea
                            .setPlaceholder("> [!Lehrtext] {book} {chapter}, {verse} (KJV)\n>#{book} #{book}-{chapter}\n>\n> ${verses}\n\n")
                            .setValue(this.plugin.settings.template)
                            .onChange(async (value) =>{
                                this.plugin.settings.template = value;
                                await this.plugin.saveSettings()
                            })
            )
        new Setting(containerEl)
            .setName('Bible')
            .addDropdown(dropDown => {
                for(var opt in BIBLES_JSON){
					console.log(`${BIBLES_JSON[opt]} - ${opt}`)
                    dropDown.addOption(BIBLES_JSON[opt], opt)
                }
				dropDown.setValue(this.plugin.settings.standardBible)
                // dropDown.addOptions(BIBLES_JSON)
                dropDown.onChange(async (value) =>  {
					console.log(value)
                    this.plugin.settings.standardBible = value;
                    await this.plugin.saveSettings();
                });
            })
        }
}

