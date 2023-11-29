// import {isFunction} from '@enonic/js-utils/value/isFunction';
import {isString} from '@enonic/js-utils/value/isString';
import dayjs from 'dayjs';
// import 'dayjs/locale/nb';
import customParseFormat from 'dayjs/plugin/customParseFormat';
// import utc from 'dayjs/plugin/utc';
// import timezone from 'dayjs/plugin/timezone';
import surgeon, {
	cheerioEvaluator,
	// nextUntilSubroutine,
	readSubroutine,
	removeSubroutine,
	selectSubroutine,
	// subroutineAliasPreset
} from 'surgeon';
// import {
// 	readFileSync,
// 	// writeFileSync
// } from 'fs';

dayjs.extend(customParseFormat);
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.locale('nb');

function isFunction<FunctionShape extends Function>(value: unknown) :value is FunctionShape {
	return Object.prototype.toString.call(value).slice(8,-1) === 'Function';
}

function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
  }

// const INGEST_BASE = 'http://127.0.0.1:8080/ingest';
const INGEST_BASE = 'http://127.0.0.1:8080/webapp/com.enonic.app.explorer/api/v2/documents';
const COLLETION = 'biler';
const DOCUMENT_TYPE = 'bil';
const API_KEY = 'biler';

const ZERO_OR_MORE = '{0,}';
const ONE_OR_MORE = '{1,}';

const FIRST_OR_NULL = '{0,}[0]';
const SECOND_OR_NULL = '{0,}[1]';


const operate = surgeon({
	evaluator: cheerioEvaluator(),
	subroutines: {
		children: (subject, values, bindle) => subject.children(),
		contents: (subject, values: string[], bindle) => {
			// console.log('contents', subject);
			// console.log('contents', values); // Array
			// console.log('contents', bindle);
			const [
				selector,
				content,
				quantifier = ZERO_OR_MORE
			] = values;
			// console.log('contents selector', selector);
			// console.log('contents content', content);
			// console.log('contents quantifier', quantifier);
			const elOrEls = selectSubroutine(subject, [selector, quantifier], bindle);
			const els = Array.isArray(elOrEls) ? elOrEls : [elOrEls];
			// console.log('contents els', els.length);
			const matches = els.filter((el) => {
				const contents: string = el.text();
				// console.log('contents contents:', contents, 'content:', content);
				return contents === content;
			});
			if (matches.length === 1) {
				return matches[0];
			}
			return matches;
		},
		norwegianDateToLocalDate: (subject, values, bindle) => dayjs(subject, 'DD.MM.YYYY').format('YYYY-MM-DD'),
		nl: subject => (isString(subject) && isFunction(subject.replace))
			? subject.replace(/\s*(?:\r\n|\r|\n)+/g, ' ')
			: subject,
		parent: (subject, values, bindle) => subject.parent(),
		parseInt: subject => parseInt(subject, 10),
		parseFloat: subject => parseFloat(subject),
		siblings: (subject, values, bindle) => subject.siblings(),
		replaceAllWhiteSpace: subject => (isString(subject) && isFunction(subject.replace))
			? subject.replace(/\s/g, '')
			: subject,
		rm: (subject, values, bindle) => removeSubroutine(
				subject,
				values,
				bindle
			),
		roh: (subject, values, bindle) => readSubroutine(
				subject,
				['property', 'outerHTML'],
				bindle
			),
		rtc: (subject, _values, bindle) => readSubroutine(
				subject,
				['property', 'textContent'],
				bindle
			),
		// startsWith: (subject, values: string[], bindle) => {
		// 	const [
		// 		selector,
		// 		content,
		// 		quantifier = ZERO_OR_MORE
		// 	] = values;
		// 	const elOrEls = selectSubroutine(subject, [selector, quantifier], bindle);
		// 	const els = Array.isArray(elOrEls) ? elOrEls : [elOrEls];
		// 	const matches = els.filter((el) => {
		// 		const contents: string = el.text();
		// 		// console.log('contents contents', contents);
		// 		return contents.startsWith(content);
		// 	});
		// 	if (matches.length === 1) {
		// 		return matches[0];
		// 	}
		// 	return matches;
		// },
		trim: subject => (isString(subject) && isFunction(subject.trim))
			? subject.trim()
			: subject,
		ws: subject => (isString(subject) && isFunction(subject.replace))
			? subject.replace(/\s{2,}/g, ' ')
			: subject
	}
});



const SELECT_AD = `select '.t-grid' ${SECOND_OR_NULL}`;
const READ_AND_CLEAN = 'rtc | nl | ws | trim';

// const FULL_PAGE = {
// 	title: `select 'head > title' ${FIRST_OR_NULL} | ${READ_AND_CLEAN}`,
// 	text: `select 'body' ${FIRST_OR_NULL} | ${READ_AND_CLEAN}`
// };

const CAR_LIST = {
	links: `select '#page-results a[href]' ${ZERO_OR_MORE} | read attribute href`
};

const CAR = {
	title: [
		SELECT_AD,
		`select 'h1' ${FIRST_OR_NULL}`,
		READ_AND_CLEAN
	],
	subTitle: [
		SELECT_AD,
		`select 'h1' ${FIRST_OR_NULL}`,
		'siblings',
		READ_AND_CLEAN
	],
	Totalpris: [
		SELECT_AD,
		`contents '.u-display-block' 'Totalpris'`,
		'siblings',
		'rtc',
		'replaceAllWhiteSpace',
		'parseInt'
	],
	Modellår: [
		SELECT_AD,
		`contents '.media__body div' 'Modellår'`,
		'siblings',
		'rtc',
		'parseInt'
	],
	Girkasse: [
		SELECT_AD,
		`contents '.media__body div' 'Girkasse'`,
		'siblings',
		'rtc',
	],
	Drivstoff: [
		SELECT_AD,
		`contents '.media__body div' 'Drivstoff'`,
		'siblings',
		'rtc',
	],
	// Garanti: [
	// 	SELECT_AD,
	// 	`select '#tabpanel1'`,
	// 	`remove a ${ZERO_OR_MORE}`,
	// 	READ_AND_CLEAN
	// ],
	// Service: [
	// 	SELECT_AD,
	// 	`select '#tabpanel2'`,
	// 	`remove a ${ZERO_OR_MORE}`,
	// 	READ_AND_CLEAN
	// ],
	Omregistrering: [
		SELECT_AD,
		`contents 'dt' 'Omregistrering'`,
		'siblings',
		'rm a',
		READ_AND_CLEAN,
		'replaceAllWhiteSpace',
		'parseInt'
	],
	'Pris eks omreg': [
		SELECT_AD,
		`contents 'dt' 'Pris eks omreg'`,
		'siblings',
		READ_AND_CLEAN,
		'replaceAllWhiteSpace',
		'parseInt'
	],
	'1. gang registrert': [
		SELECT_AD,
		`contents 'dt' '1. gang registrert'`,
		'siblings',
		READ_AND_CLEAN,
		'replaceAllWhiteSpace',
		'norwegianDateToLocalDate'
	],
	Vedlikehold: [
		SELECT_AD,
		`contents 'dt' 'Vedlikehold'`,
		'siblings',
		'rtc'
	],
	Farge: [
		SELECT_AD,
		`contents 'dt' 'Farge'`,
		'siblings',
		'rtc'
	],
	Fargebeskrivelse: [
		SELECT_AD,
		`contents 'dt' 'Fargebeskrivelse'`,
		'siblings',
		'rtc'
	],
	Interiørfarge: [
		SELECT_AD,
		`contents 'dt' 'Interiørfarge'`,
		'siblings',
		'rtc'
	],
	Hjuldrift: [
		SELECT_AD,
		`contents 'dt' 'Hjuldrift'`,
		'siblings',
		'rtc'
	],
	Effekt: [
		SELECT_AD,
		`contents 'dt' 'Effekt'`,
		'siblings',
		'rtc',
		'replaceAllWhiteSpace',
		'parseInt'
	],
	Sylindervolum: [
		SELECT_AD,
		`contents 'dt' 'Sylindervolum'`,
		'siblings',
		'rtc',
		'replaceAllWhiteSpace',
		'parseFloat'
	],
	Vekt: [
		SELECT_AD,
		`contents 'dt' 'Vekt'`,
		'siblings',
		'rtc',
		'replaceAllWhiteSpace',
		'parseInt'
	],
	'CO2-utslipp': [
		SELECT_AD,
		`contents 'dt' 'CO2-utslipp'`,
		'siblings',
		'rtc',
		'replaceAllWhiteSpace',
		'parseInt'
	],
	'Antall seter': [
		SELECT_AD,
		`contents 'dt' 'Antall seter'`,
		'siblings',
		'rtc',
		'parseInt'
	],
	Karosseri: [
		SELECT_AD,
		`contents 'dt' 'Karosseri'`,
		'siblings',
		'rtc'
	],
	'Antall dører': [
		SELECT_AD,
		`contents 'dt' 'Antall dører'`,
		'siblings',
		'rtc',
		'parseInt'
	],
	'Antall eiere': [
		SELECT_AD,
		`contents 'dt' 'Antall eiere'`,
		'siblings',
		'rtc',
		'parseInt'
	],
	'Bilen står i': [
		SELECT_AD,
		`contents 'dt' 'Bilen står i'`,
		'siblings',
		'rtc'
	],
	Salgsform: [
		SELECT_AD,
		`contents 'dt' 'Salgsform'`,
		'siblings',
		'rtc'
	],
	Avgiftsklasse: [
		SELECT_AD,
		`contents 'dt' 'Avgiftsklasse'`,
		'siblings',
		'rtc'
	],
	// 'Chassis nr. (VIN)': [
	// 	SELECT_AD,
	// 	`contents 'dt' 'Chassis nr. (VIN)'`,
	// 	'siblings',
	// 	'rtc'
	// ],
	'Maksimal tilhengervekt': [
		SELECT_AD,
		`contents 'dt' 'Maksimal tilhengervekt'`,
		'siblings',
		'rtc',
		'replaceAllWhiteSpace',
		'parseInt'
	],
	'Utstyr': [
		SELECT_AD,
		`contents 'h2' 'Utstyr'`,
		'siblings',
		`select li ${ZERO_OR_MORE}`,
		'rtc'
	],
	// 'Reklamasjonsrett ved kjøp fra forhandler': [
	// 	SELECT_AD,
	// 	`contents 'h2' 'Reklamasjonsrett ved kjøp fra forhandler'`,
	// 	'siblings',
	// 	'remove a',
	// 	READ_AND_CLEAN
	// ],
}

const res = await fetch("https://www.finn.no/car/used/search.html", {
	method: "GET",
});
// console.log(res);

const html = await res.text();
// console.log(html);

const data = operate(CAR_LIST, html);
// console.log(data);

// const data = {
// 	links:[
// 		'https://www.finn.no/car/used/ad.html?finnkode=329894737'
// 	]
// }

// const html2 = readFileSync('car.html', 'utf8');

// await Promise.all(data.links.map(async (link, i) => {
let i = 0;
for (const link of data.links) {
	console.log(`${i+1}/${data.links.length} ${link} processing...`);
	// console.log(link);
	const res2 = await fetch(link, {
		method: "GET",
	});
	const html2 = await res2.text();
	// writeFileSync('car.html', html2);
	// console.log(html2);
	const data2 = operate(CAR, html2);
	// console.log(data2);
	const req = {
		method: 'POST',
		// mode: 'cors', // no-cors, *cors, same-origin
		// cache: 'no-cache',
		// credentials: 'omit', // include, *same-origin, omit
		headers: {
			// 'Accept': 'application/json',
			'authorization': `Explorer-Api-Key ${API_KEY}`,
			'content-type': 'application/json',
		},
		// redirect: 'follow', // manual, *follow, error
		// referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		// Bulk
		// body: JSON.stringify({
		// 	collection: COLLETION,
		// 	document: data2
		// }),
		// Single
		body: JSON.stringify(data2),
	};
	// console.log(req);
	const res3 = await fetch(`${INGEST_BASE}/${COLLETION}?documentType=${DOCUMENT_TYPE}&requireValid=false&returnDocument=false`, req);
	// console.log(res3);
	const json = await res3.json();
	// console.log(json);
	console.log(`${i+1}/${data.links.length} ${link} ${json.id} done.`);
	i++;
	await delay(1000);
}
// ));
