import EventEmmiter from "events"
import { generate } from "math-expressions.js"

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
		getBrowserless: () => {
			createBrowserless.createContext()
		},
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
	const hrefs = await grabHrefs(html)
	const final = []

	hrefs.forEach((href) => {
		if (href.indexOf(searchString) > -1) final.push(href)
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

function grabP(pNode) {
	console.log(pNode)
	return pNode
}

function clearEmptyArrays(arrays) {
	const copy = []

	arrays.forEach((array) => {
		if (array.length !== 0) copy.push(array)
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

// To use the functions, you do not need these declarations. They are separate.
const emmiter = new EventEmmiter()

const htmls = [[], []]
const mainPageURLS = Object.freeze([
	"http://www.volgo-mama.ru/forum/forum/268-%D0%B4%D0%B5%D1%82%D1%81%D0%BA%D0%B8%D0%B9-%D0%BF%D1%81%D0%B8%D1%85%D0%BE%D0%BB%D0%BE%D0%B3/",
	"http://www.volgo-mama.ru/forum/forum/269-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B-%D0%B2%D0%B7%D1%80%D0%BE%D1%81%D0%BB%D0%BE%D0%B9-%D0%BF%D1%81%D0%B8%D1%85%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D0%B8/",
])
const maxPages = Object.freeze([11, 7])
const neededHrefs = [[], []]

mainPageURLS.forEach(async (page, index) => {
	htmls[index].push(await getPageHTML(page))
	generate(2, maxPages[index]).forEach(async (pageNumber) => {
		htmls[index].push(await getPageHTML(page + `pages/${pageNumber}"`))
	})
})

// Getting the needed hrefs.
const handle = setInterval(() => {
	if (htmls[1].length === maxPages[1]) {
		htmls.forEach((mainPage, index) => {
			mainPage.forEach(async (page) => {
				neededHrefs[index].push(
					await getNeededHrefs(
						"http://www.volgo-mama.ru/forum/topic",
						page
					)
				)
			})
		})
		// Timeout is for the hrefs to finish.
		setTimeout(() => emmiter.emit("handler is dead"), 1)
		clearInterval(handle)
	}
}, 1)

emmiter.on("handler is dead", () => {
	emmiter.on("async", () => {
		console.log(neededHrefs[1][0][0])
		clearLinksText(filenames)

		neededHrefs.forEach(async (toplevel, index) => {
			toplevel.forEach(async (middlelevel) => {
				middlelevel.forEach(async (href) => {
					const awaited = (await getPageHTML(href)).querySelectorAll(
						"body main div div div div div form article div div div div p"
					)
					if (awaited.length > 0) pElements[index].push(awaited)
				})
			})
			if (index === 1) setTimeout(() => emmiter.emit("finished"), 2000)
		})

		emmiter.on("finished", () => {
			const sync = setInterval(() => {
				console.log(pElements[1].length)
				if (pElements[1].length > 0) {
					pElements.forEach((section, index) => {
						section.forEach((node) => {
							filesContents[index].push(grabP(node))
						})
					})

					clearInterval(sync)
					console.log(filesContents)
				}
			}, 5000)
		})
	})

	const filenames = [[], []]
	const filesContents = [[], []]
	const pElements = [[], []]

	htmls.forEach((mainPage, i) => {
		mainPage.forEach((page, j) => {
			filenames[i].push(getLinksText(neededHrefs[i][j], page))
		})
		if (i === 1) emmiter.emit("async")
	})
})
