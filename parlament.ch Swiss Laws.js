{
	"translatorID": "54af9575-32ed-4bb4-b753-f2a0024ccacd",
	"label": "parlament.ch Swiss Laws",
	"creator": "Hans-Peter Oeri",
	"target": "^https://www\\.parlament\\.ch/(de|fr|it|rm|en)/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-(die-verhandlungen|die-videos)",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-11-30 20:41:47"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2021 Hans-Peter Oeri

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

const translations = {
	wholeHearing: {
		de: "ganze Verhandlung",
		fr: "toute la procédure",
		it: "processo completo",
		rm: "proces complet",
		en: "whole hearing"
	},
	bulletinAbbrev: {
		de: "ABl",
		fr: "BO",
		it: "BO",
		rm: "BO",
		en: "OB"
	},
	chamberAbbrev: {
		N: {
			de: "N",
			fr: "N",
			it: "N",
			rm: "N",
			en: "N"
		},
		S: {
			de: "S",
			fr: "E",
			it: "E",
			rm: "E",
			en: "E"
		}
	}
};

function textReferenceToValue(ref) {
	return split(' ').slice(1,3).join('-');
}

function valueReferenceToText(ref, lang) {
	let parts = ref.split('-');
	parts.unshift(translations.bulletinAbbrev[lang]);
	parts[2] = translations.chamberAbbrev[parts[2]][lang];
	return parts.join(' ');
}

function getDocData(doc, url) {
	const pathRegex = new RegExp("^/(de|fr|it|rm|en)/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-(die-verhandlungen|die-videos)");
	const parts = ZU.parseURL(url);

	let match = parths.pathname.match(pathRegex) || [];
	return {
		lang: parts[1] || "de",
		type: (parts[2] === "die-verhandlungen") ? "hearing" : "votum",
		whole: parts.hash.startsWith("#zotero=")
	}
}

function scrapeHearing(doc, url, docData) {

}

function scrapeVotum(doc, url, docData) {

}

function scrape(doc, url, docData) {
	if (docData.type === "hearing") {
		scrapeHearing(doc, url, docData);
	}
	else {
		scrapeVotum(doc, url, docData);
	}
}

function detectWeb(doc, url) {
	let docData = getDocData(doc, url);
	return (docData.type === "votum" || docData.whole) ? "hearing" : "multiple";
}

function getSearchResults(doc, url, docDate) {
	let items = {};

	let wholeURL = ZU.parseURL(url);
	let domRefs = doc.querySelectorAll("span.page-break");
	let ref = "";
	if (domRefs.length) {
		ref = textReferenceToValue(domRefs.item(0).innerText);
	}
	wholeURL.hash = "#zotero=" + ref;
	items[wholeURL.format()] = translations.wholeHearing[docData.lang];

	let domVotums = doc.querySelectorAll(".pd-person-description");
	for (let domVotum of domVotums) {
		let domSpeaker = domVotum.querySelector(".speaker-info");
		if (!domSpeaker) continue;

	}

	// TODO: adjust the CSS selector
	var rows = doc.querySelectorAll('h2 > a.title[href*="/article/"]');
	for (let row of rows) {
		// TODO: check and maybe adjust
		let href = row.href;
		// TODO: check and maybe adjust
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		Zotero.selectItems(getSearchResults(doc, false), function (items) {
			if (items) ZU.processDocuments(Object.keys(items), scrape);
		});
	}
	else {
		scrape(doc, url);
	}
}
