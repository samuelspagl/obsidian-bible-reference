import {
	Editor,
	Plugin,
	WorkspaceLeaf,
} from "obsidian";
import { BibleReferencingView } from "src/itemViews/BibleReferencingView";
import { BibleVerseSuggestionFirstWindow } from "src/modals/BibleVersesReferenceModal";
import { BibleReferenceSettings } from "src/models/Models";
import { BibleReferencingSettings } from "src/settings/SettingsView";
// Remember to rename these classes and interfaces!

export const VIEW_TYPE_BIBLE_REFERENCING = "bible-referencing-view";

const DEFAULT_SETTINGS: Partial<BibleReferenceSettings> = {
	language: "en",
	template:
		"> [!Lehrtext] {book} {chapter}, {verse} (KJV)\n>#{bookTag} #{bookTag}-{chapter}\n>\n> {verses}\n\n",
	standardBible: "877",
};


export default class BibleReference extends Plugin {
	settings: BibleReferenceSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_BIBLE_REFERENCING,
			(leaf) => new BibleReferencingView(leaf, this.settings)
		);

		this.addRibbonIcon("church", "Open Bible Referencing view", () => {
			this.activateView();
		});

		this.addCommand({
			id: "bible-referencing-open-view",
			name: "Open Bible Referencing View",
			callback: ()=>{
				this.activateView()
			}
		})

		this.addCommand({
			id: "bible-referencing-modal",
			name: "Add Bible Verse",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "b" }],
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

	onunload() { }

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_BIBLE_REFERENCING);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_BIBLE_REFERENCING, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf){
			workspace.revealLeaf(leaf);
		}
	}

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