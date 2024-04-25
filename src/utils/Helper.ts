export function format_variables(text: string, args: { [key: string]: string }) {
	for (const attr in args) {
		const rgx = new RegExp("\\{" + attr + "}", "g");
		text = text.replace(rgx, args[attr]);
	}
	return text;
}

export function hideAllElements(elements: Array<HTMLDivElement>){
	elements.forEach(element => {
		element.hidden = true
	})
}

export function unhideSelectedElements(elements: Array<HTMLDivElement>, amount: number){
	hideAllElements(elements)
	for (const a of Array(amount).keys()){
		elements[a].hidden = false
	}
}