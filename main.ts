import {
	App,
	Editor,
	ItemView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	SuggestModal,
	TextAreaComponent,
	WorkspaceLeaf,
} from "obsidian";
import { ExampleView } from "src/itemViews/BibleReferencingView";
import { BibleVerseSuggestionFirstWindow } from "src/modals/BibleVersesReferenceModal";
import { BibleReferencingSettings } from "src/settings/SettingsView";
import { BIBLE_INFO } from "src/utils/Const";

import { getVerse } from "src/youversion-api/verse";
// Remember to rename these classes and interfaces!

export const VIEW_TYPE_EXAMPLE = "example-view";

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
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		);

		this.addRibbonIcon("church", "Activate view", () => {
			this.activateView();
		});

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
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
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