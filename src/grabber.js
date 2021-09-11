import pk from "browserless"
const { createBrowserless } = pk

import getHTML from "html-get"

import pckg from "node-html-parser"
const { parse } = pckg

function grabText(node) {
	const text = []

	node.childNodes.forEach((child) => {
		if (child._rawText && child._rawText !== "<!DOCTYPE html>")
			text.push(child._rawText)
		else text.push(...grabText(child))
	})

	return text
}

async function getPageHTML(url) {
	const parsed = getHTML(url, {
		getBrowserless: () => createBrowserless.createContext(),
	}).then(({ html }) => parse(html))

	return await parsed
}

async function grabHrefs(node) {
	const hrefs = []
	const a = node.querySelectorAll("a") // a html elements

	a.forEach((a) => hrefs.push(parseHref(a)))
	return hrefs
}

function parseHref(node) {
	let href = ""

	for (let i = node.rawAttrs.indexOf("href"); i < node.rawAttrs.length; i++) {
		if (node.rawAttrs[i] === "=") {
			while (node.rawAttrs[i] !== '"' && node.rawAttrs[i] !== "'") i++
			i++
			while (node.rawAttrs[i] !== '"' && node.rawAttrs[i] !== "'")
				href += node.rawAttrs[i++]
		}
	}

	return href
}

async function getNeededHrefs(searchString, html) {
	const final = []

	grabHrefs(html).then((hrefs) => {
		hrefs.forEach((href) => {
			if (href.indexOf(searchString) > -1) final.push(href)
		})
	})

	return final
}

function getLinksText(hrefs, html) {
	const links = []
	const text = []

	html.querySelectorAll("a").forEach((link) => {
		if (hrefs.indexOf(parseHref(link)) > -1) links.push(link)
	})

	links.forEach((link) => text.push(grabText(link)))
	return text
}

function grabP(pNodes) {
	function getChildrenText(childrenArray) {
		const children = []

		childrenArray.forEach((child) => {
			children.push(grabText(child))
		})

		return children
	}

	function concatenate(...piecesOfText) {
		let final = ""
		piecesOfText.forEach((element, i) => {
			piecesOfText[i] = clearEmptyArrays(element)
		})
		for (let i = 0; i < piecesOfText.length; i++) final += piecesOfText[i]
		return final
	}

	const ps = [] // array for storing p elements data 

	pNodes.forEach((p) => {
		ps.push(concatenate(getChildrenText(p.childNodes)))
	})

	return clearEmptyArrays(ps)
}

function clearEmptyArrays(arrays) {
	const copy = []

	arrays.forEach((array) => {
		if (array.length) copy.push(array)
	})

	return copy
}

function clearLinksText(linksText) {
	function clearArray(array) {
		function hasLettersOrNumbers(string) {
			function isLetter(char) {
				return "abcdefghijklmnopqrstuvwxyz".indexOf(char) > -1
			}

			function isNumber(char) {
				return "0123456789".indexOf(char) > -1
			}

			for (let i = 0; i < string.length; i++)
				if (isNumber(string[i]) || isLetter(string[i])) return true

			return false
		}

		array.forEach((element, index) => {
			if (
				(element.indexOf("\n") > -1 || element.indexOf("\t") > -1) &&
				!hasLettersOrNumbers(element)
			)
				array[index] = ""
		})

		return array
	}

	function clearSpaces(array) {
		const final = []

		array.forEach((element) => {
			if (element !== "") final.push(element)
		})

		return final
	}

	linksText.forEach((mainPage) => {
		mainPage.forEach((section, index) => {
			section.forEach((array, index) => {
				section[index] = clearSpaces(clearArray(array))
			})

			mainPage[index] = clearEmptyArrays(section)
		})
	})
}

export {
	grabText,
	clearLinksText,
	getPageHTML,
	getLinksText,
	clearEmptyArrays,
	grabP,
	getNeededHrefs,
	grabHrefs,
	parseHref,
}
