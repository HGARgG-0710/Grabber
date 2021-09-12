/**
 *
 * This file is basically a "driver" for the grabber.js functions.
 * It is needed for my personal testing only.
 * ! Do not run it, unless you want to get a huge load of meaningless textfiles parsed from
 * ! some random website.
 */

import { generate } from "math-expressions.js"

import {
	clearLinksText,
	getPageHTML,
	getLinksText,
	grabP,
	getNeededHrefs,
} from "./src/grabber.js"

import { writeFile } from "fs"

const htmls = [[], []]
const mainPageURLS = Object.freeze([
	"http://www.volgo-mama.ru/forum/forum/268-%D0%B4%D0%B5%D1%82%D1%81%D0%BA%D0%B8%D0%B9-%D0%BF%D1%81%D0%B8%D1%85%D0%BE%D0%BB%D0%BE%D0%B3/",
	"http://www.volgo-mama.ru/forum/forum/269-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B-%D0%B2%D0%B7%D1%80%D0%BE%D1%81%D0%BB%D0%BE%D0%B9-%D0%BF%D1%81%D0%B8%D1%85%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D0%B8/",
])
const maxPages = Object.freeze([11, 7])
const neededHrefs = [[], []]

const filenames = [[], []]
const filesContents = [[], []]
const pElements = [[], []]

mainPageURLS.forEach(async (page, index) => {
	getPageHTML(page).then((answer) => {
		htmls[index].push(answer)
		generate(2, maxPages[index]).forEach(async (pageNumber) => {
			getPageHTML(page + `pages/${pageNumber}"`).then((answer) => {
				htmls[index].push(answer)
				if (htmls[1].length === maxPages[1]) {
					htmls.forEach((mainPage, index) => {
						mainPage.forEach(async (page, i) => {
							getNeededHrefs(
								"http://www.volgo-mama.ru/forum/topic",
								page
							).then((received) => {
								neededHrefs[index].push(received)
								if (
									i === mainPage.length - 1 &&
									index === mainPageURLS.length - 1
								)
									setTimeout(() => collectFileData(), 1)
							})
						})
					})
				}
			})
		})
	})
})

function collectFileData() {
	function writeFileData() {
		function validate(filepath) {
			for (let i = 0; i < filepath.length; i++) {
				if (filepath[i] === "\t" || filepath[i] === "\n")
					filepath[i] = " "
			}
		}

		filenames[0].forEach((pageSection, sectionIndex) => {
			pageSection.forEach((file, fileIndex) => {
				writeFile(
					"out/0/" + validate(file) + ".txt",
					String(filesContents[0][sectionIndex][fileIndex]),
					(err) => {
						if (err) throw err
					}
				)
			})
		})
	}

	htmls.forEach((mainPage, i) => {
		mainPage.forEach((page, j) => {
			filenames[i].push(getLinksText(neededHrefs[i][j], page))
		})

		if (i === 1) {
			clearLinksText(filenames)

			neededHrefs.forEach(async (toplevel, index) => {
				toplevel.forEach(async (middlelevel) => {
					middlelevel.forEach(async (href, j) => {
						getPageHTML(href).then((answer) => {
							const pElemsOnPage = answer.querySelectorAll(
								"body main div div div div div form article div div div div p"
							)

							pElements[index].push(pElemsOnPage)
							if (j === middlelevel.length - 1) {
								pElements.forEach((section, index) => {
									section.forEach((node) => {
										filesContents[index].push(grabP(node))
									})
								})

								writeFileData()
							}
						})
					})
				})
			})
		}
	})
}
