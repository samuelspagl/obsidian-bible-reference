import BibleReference from "main";
import { PluginSettingTab, App, Setting, TextAreaComponent } from "obsidian";
import { BIBLES_JSON } from "src/utils/Const";

export class BibleReferencingSettings extends PluginSettingTab {
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