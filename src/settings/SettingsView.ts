import BibleReference from "main";
import { PluginSettingTab, App, Setting, TextAreaComponent } from "obsidian";
import { BIBLES_JSON, LANGUAGE } from "src/utils/Const";

export class BibleReferencingSettings extends PluginSettingTab {
	plugin: BibleReference;

	constructor(app: App, plugin: BibleReference) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h1", { text: LANGUAGE.settings.heading[this.plugin.settings.language] });
		containerEl.createEl("p", { text: LANGUAGE.settings.createdBy[this.plugin.settings.language] }).createEl("a", {
			text: "Säm 👩🏽‍💻",
			href: "https://github.com/samuelspagl",
		});

		new Setting(containerEl).setName(LANGUAGE.settings.languageLabel[this.plugin.settings.language])
            .setDesc(LANGUAGE.settings.languageDescription[this.plugin.settings.language])
            .addDropdown((dropDown) => {
			dropDown.addOption("en", "English");
			dropDown.addOption("de", "German");
			dropDown.setValue(this.plugin.settings.language);
			dropDown.onChange(async (value) => {
				this.plugin.settings.language = value;
				await this.plugin.saveSettings();
			});
		});
		new Setting(containerEl).setName(LANGUAGE.settings.bibleLabel[this.plugin.settings.language])
            .setDesc(LANGUAGE.settings.bibleDescription[this.plugin.settings.language])
            .addDropdown((dropDown) => {
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
			.setName(LANGUAGE.settings.templateLabel[this.plugin.settings.language])
			.setDesc(LANGUAGE.settings.templateDescription[this.plugin.settings.language]
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