import { VIEW_TYPE_EXAMPLE } from "main";
import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { BibleReferenceSettings, BibleBook } from "src/models/Models";
import { BIBLE_INFO } from "src/utils/Const";
import { getVerse } from "src/youversion-api/verse";

export class ExampleView extends ItemView {
    settings: BibleReferenceSettings

    selectedBible: string

    selectedBook: BibleBook|null = null
    selectedChapter: number | null = null
    selectedStartVerse: number | null = null
    selectedEndVerse: number | null = null

    constructor(leaf: WorkspaceLeaf, settings: BibleReferenceSettings) {
        super(leaf);
        this.settings = settings
        this.selectedBible = settings.standardBible

    }

    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }

    getDisplayText() {
        return "Example view";
    }

    getIcon(): string {
        return "church"
    }

    async onOpen() {
        // Setup view container
        const container = this.containerEl.children[1];
        container.empty();
        const view = container.createEl("div")
        view.addClass("bible-referencing-view");

        view.createEl("h4", { text: "The Bible" });
        
        const selectedDiv = view.createEl("div", {cls: "selected-div"})
        const selectedBookDiv = selectedDiv.createEl('div', {cls:"selected-button selected-button-book"})
        selectedBookDiv.addClass("bb-rf-hide-div")
        selectedBookDiv.onClickEvent((ev:MouseEvent)=>{
            selectedChapterDiv.addClass("bb-rf-hide-div")
            selectedVersesDiv.addClass("bb-rf-hide-div")
            bibleBookView.removeClass("bb-rf-hide-div")
            hideAllElements(chapterArray)
            hideAllElements(versesArray)
        })
        const selectedChapterDiv = selectedDiv.createEl('div', {cls:"selected-button"})
        selectedChapterDiv.addClass("bb-rf-hide-div")
        selectedChapterDiv.onClickEvent((ev:MouseEvent)=>{
            selectedChapterDiv.addClass("bb-rf-hide-div")
            unhideSelectedElements(chapterArray, Object.keys(this.selectedBook!.chapters).length)     
            hideAllElements(versesArray)
            this.selectedStartVerse = null
            this.selectedEndVerse = null
            selectedVersesDiv.setText("🔛")
            selectedVersesDiv.addClass("bb-rf-hide-div")
        })
        const selectedVersesDiv = selectedDiv.createEl('div', {cls:"selected-button", text:"🔛"})
        selectedVersesDiv.addClass("bb-rf-hide-div")
        selectedVersesDiv.onClickEvent((ev:MouseEvent)=>{
            this.selectedStartVerse = null
            this.selectedEndVerse = null
            unhideSelectedElements(versesArray,parseInt(this.selectedBook!.chapters[`${this.selectedChapter}`]))
            selectedVersesDiv.setText("🔛")
        })

        // Bible Book view
        const bibleBookView = view.createEl('div', { cls: "book-grid" })
        for (const a in BIBLE_INFO) {
            const bookName = BIBLE_INFO[a].book['de']
            bibleBookView.
                createEl('div', { cls: "tree-item-self is-clickable has-focus book-button", text: bookName })
                .onClickEvent((ev: MouseEvent) => {
                    bibleBookView.addClass("bb-rf-hide-div")
                    this.selectedBook = BIBLE_INFO[a]
                    unhideSelectedElements(chapterArray, Object.keys(this.selectedBook!.chapters).length)
                    
                    selectedBookDiv.setText(`📙 ${bookName}`)
                    selectedBookDiv.removeClass("bb-rf-hide-div")
                })
        }

        // Bible Chapter View
        const chapterView = view.createEl('div', { cls: "chapter-grid" })
        const chapterArray: Array<HTMLDivElement> = []
        for (const x of Array(70).keys()) {
            const chButton = chapterView.createEl('div', { cls: "is-clickable has-focus chapter-button", text: `${x + 1}` })
            chButton.onClickEvent((ev:MouseEvent)=> {
                hideAllElements(chapterArray)
                this.selectedChapter = x+1
                selectedChapterDiv.setText(`📖 ${x+1}`)
                selectedChapterDiv.removeClass("bb-rf-hide-div")
                unhideSelectedElements(versesArray,parseInt(this.selectedBook!.chapters[`${this.selectedChapter}`]))
                selectedVersesDiv.removeClass("bb-rf-hide-div")
            })
            chapterArray.push(chButton)
        }
        hideAllElements(chapterArray)


        const versesView = view.createEl('div', {cls: "chapter-grid"})

        const versesArray: Array<HTMLDivElement> = []
        for (const x of Array(176).keys()) {
            const chButton = versesView.createEl('div', { cls: "is-clickable has-focus chapter-button", text: `${x + 1}`})
            chButton.onClickEvent(async (ev:MouseEvent)=> {
                if (this.selectedStartVerse == null || this.selectedStartVerse>(x+1)){
                    this.selectedStartVerse = x+1
                }else{
                    this.selectedEndVerse = x+1
                    hideAllElements(versesArray)
                    const verse = await getVerse(
                        this.selectedBook!.aliases[0],
                        `${this.selectedChapter}`, 
                        `${this.selectedStartVerse}-${this.selectedEndVerse}`, 
                        this.selectedBible
                    )
                    versesElement.setText(verse.passage)
                }
                selectedVersesDiv.setText(`${this.selectedStartVerse} 🔛 ${this.selectedEndVerse}`)
            })
            chButton.onmouseover = () => {
                if (!(this.selectedStartVerse == null || this.selectedStartVerse>(x+1))){
                    const amount = (x+1)- this.selectedStartVerse
                    for (const a of Array(amount).keys()){
                        versesArray[a+this.selectedStartVerse-1].addClass("on-select-hover")
                    }
                }
            }
            chButton.onmouseleave = () =>{
                if (!(this.selectedStartVerse == null || this.selectedStartVerse>(x+1))){
                    const amount = (x+1)-this.selectedStartVerse
                    for (const a of Array(amount).keys()){
                        versesArray[a+this.selectedStartVerse].removeClass("on-select-hover")
                    }
                }
            }
            versesArray.push(chButton)
        }
        hideAllElements(versesArray)


        const contentDiv = view.createEl('div', {cls: "bible-referencing-view-content"})
        const versesElement = contentDiv.createSpan("")
    }




    async onClose() {
        // Nothing to clean up.
    }
}

function hideAllElements(elements: Array<HTMLDivElement>) {
    elements.forEach(element => {
        element.hidden = true
    })
}

function unhideSelectedElements(elements: Array<HTMLDivElement>, amount: number) {
    hideAllElements(elements)
    for (const a of Array(amount).keys()) {
        elements[a].hidden = false
    }
}