{
	"translatorID": "54af9575-32ed-4bb4-b753-f2a0024ccacd",
	"label": "parlament.ch Swiss Laws",
	"creator": "Hans-Peter Oeri",
	"target": "^https://www\\.parlament\\.ch/(de|fr|it|rm|en)/ratsbetrieb/(suche-curia-vista|amtliches-bulletin/amtliches-bulletin-(die-verhandlungen|die-videos))",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2021-12-05 15:27:46"
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
	bulletinAbbrev: {
		de: "AB ",
		fr: "BO ",
		it: "BO ",
		rm: "BO ",
		en: "OB "
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

/**
 * convert swiss date to ISO date (numerical only version)
 *
 * @param {string} date
 */
function swissStrToISO(date) {
	let parts = date.split(/\.\s*|\s+/);
	let year = parseInt(parts.pop());
	if (year < 100) {
		year += 2000;
	}
	parts = parts.map( value => parseInt(value).toString().padStart( 2, '0'));
	parts.push(year.toString());
	return parts.reverse().join('-');
}

function getDocData(doc, url) {
	const pathRegex = new RegExp("^/(de|fr|it|rm|en)/ratsbetrieb/(?:suche-(curia-vista)(/geschaeft)?|amtliches-bulletin/amtliches-bulletin-(die-verhandlungen|die-videos))");
	const parts = ZU.parseURL(url);

	let match = parts.pathname.match(pathRegex) || [];
	return {
		lang: match[1],
		type: match[2] === undefined ?
			(match[4] === "die-verhandlungen" ? "hearing" : "votum") :
			(match[3] === undefined ? "affair-search" : "affair")
	}
}

function scrapeHearing(doc, url, docData) {
	let item = new Zotero.Item("hearing");

	let titles = doc.querySelectorAll(".business-info .teaser-text");
	let index = Math.min(titles.length-1, ["de","fr","it","rm","en"].indexOf(docData.lang));
	item.title = titles.item(index).innerHTML.replace(/\n/g, " ");
	item.legislativeBody = 	text(doc, ".pd-affair-detail-nav-panel .sub-nav > span:first-of-type");
	item.date = swissStrToISO(text(doc, ".pd-affair-detail-nav-panel .sub-nav > span:nth-of-type(4)"));

	let domRef = doc.querySelector("span.page-break");
	if (domRef) {
		let ref = domRef.innerText.split(' ').slice(1,4);
		ref[1] = translations.chamberAbbrev[ref[1]][docData.lang];
		item.baseReference = translations.bulletinAbbrev[docData.lang] + ref.slice(0,2).join(' ');
		item.page = ref[2];
		item.documentNumber = item.baseReference + " " + item.page;
	}
	item.billNumber = text(doc, ".business-info .inspected");

	let domContributors = doc.querySelectorAll("span[data-ng-bind-html='getOfficialBulletinTemplate(item)']");
	for (let domContributor of domContributors) {
		item.creators.push({
			firstName: domContributor.childNodes[1].textContent.split(/ \(|,/)[0],
			lastName: domContributor.childNodes[0].textContent,
			creatorType: "contributor"
		});
	}

	let pdfURL = attr(doc, ".content a.print", "href");
	if (pdfURL) {
		item.attachments.push({
			title: "Official PDF",
			url: pdfURL,
			mimeType: "application/pdf"
		});
	}
	let videoURL = attr(doc, ".content a.video-link", "href");
	if (videoURL) {
		item.attachments.push({
			title: "Official Video",
			url: videoURL,
			snapshot: false
		});
	}

	item.complete();
}

function scrapeVotum(doc, url, docData) {

}

function batchAddDOMContributors(item, type, doms) {
	for (let one of doms) {
		let contributor = ZU.cleanAuthor(one.innerText, type, false );
		[contributor.firstName, contributor.lastName] = [
			ZU.capitalizeName(contributor.lastName),
			ZU.capitalizeName(contributor.firstName)
		];
		item.creators.push(contributor);
	}
}

function scrapeBill(doc, url, docData) {
	let item = new Zotero.Item("bill");

	let affairType = text(doc, ".pd-curia-chronologie .up");
	if (affairType && affairType.indexOf('.') > 0) {
		affairType = affairType.split('.').pop().trim();
	}
	let sponsor = text(doc, ".pd-curia-chronologie div.meta-desc-group[data-ng-repeat*='filter: {Role: 7}'] a.person-name");
	item.billNumber = text(doc, ".pd-curia-chronologie .no");
	item.shortTitle = affairType + " " + (sponsor || item.billNumber);
	item.title = item.shortTitle + ": " + text(doc, ".pd-curia-chronologie .business-title");

	item.legislativeBody = text(doc, ".pd-curia-chronologie div.meta-desc-group[data-ng-if^='business.SubmissionCouncil'] > div.meta-value");
	item.date =
		text(doc, ".pd-curia-chronologie div.meta-desc-group[data-ng-if^='business.SubmissionDate'] > div.meta-value") ||
		text(doc, "span[data-ng-if=\"resolution.ResolutionDate\"]");
	if (item.date) {
		item.date = swissStrToISO(item.date);
	}

	item.url = url;
	let pdfURL = attr(doc, ".content a.print", "href");
	if (pdfURL) {
		item.attachments.push({
			title: "Official PDF",
			url: pdfURL,
			mimeType: "application/pdf"
		});
	}

	batchAddDOMContributors(item, "sponsor",
		doc.querySelectorAll(".pd-curia-chronologie div.meta-desc-group[data-ng-repeat*='filter: {Role: 7}'] a.person-name"));
	batchAddDOMContributors(item, "cosponsor",
		doc.querySelectorAll(".block-284 a.person-name"));
	batchAddDOMContributors(item, "contributor",
		doc.querySelectorAll(".pd-curia-chronologie div.pd-description[data-ng-if^='allBusinessBillRapporteurs'] a.person-name"));

	item.complete();
}

function scrape(doc, url, docData) {
	const scrapers = {
		hearing: scrapeHearing,
		votum: scrapeVotum,
		affair: scrapeBill
	};
	scrapers[docData.type](doc, url, docData);
}

function getSearchResults(doc, url, docData) {
	let items = {};
	let domResults = doc.querySelectorAll("div.ms-srch-item");
	for (let dom of domResults) {
		let url = attr(dom, "a.create-clickable-area", "href");
		let id = text(dom, "span.no");
		let type = text(dom, "h4");
		let detail = text(dom, "div.ms-srch-item-excerpt > span:nth-of-type(2)");
		items[url] = id + " " + type + ": " + detail;
	}
	return items;
}

function detectWeb(doc, url) {
	const itemTypes = {
		"hearing": "hearing",
		"votum": "hearing",
		"affair": "bill",
		"affair-search": "multiple"
	}
	let docData = getDocData(doc, url);
	return itemTypes[docData.type] || false;
}

function doWeb(doc, url) {
	let docData = getDocData(doc, url);
	if (docData.type === "affair-search") {
		Zotero.selectItems(getSearchResults(doc, url, docData), function (items) {
			if (items) ZU.processDocuments(Object.keys(items), function (doc, url) {
				let docData = getDocData(doc, url);
				scrape(doc, url, docData);
			});
		});
	}
	else {
		scrape(doc, url, docData);
	}
}
