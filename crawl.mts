import {isString} from '@enonic/js-utils/value/isString';
import dayjs from 'dayjs';
import {encode} from 'base-64';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import surgeon, {
	cheerioEvaluator,
	readSubroutine,
	removeSubroutine,
	selectSubroutine,
} from 'surgeon';

dayjs.extend(customParseFormat);

function isFunction<FunctionShape extends Function>(value: unknown) :value is FunctionShape {
	return Object.prototype.toString.call(value).slice(8,-1) === 'Function';
}

function delay(time: number) {
	return new Promise(resolve => setTimeout(resolve, time));
}

function _arrayBufferToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return encode( binary );
}

const INGEST_BASE = 'http://127.0.0.1:8080/webapp/com.enonic.app.explorer/api/v2/documents';
const COLLETION = 'biler';
const DOCUMENT_TYPE = 'bil';
const API_KEY = 'biler';

const ZERO_OR_MORE = '{0,}';

const FIRST_OR_NULL = '{0,}[0]';
const SECOND_OR_NULL = '{0,}[1]';


const operate = surgeon({
	evaluator: cheerioEvaluator(),
	subroutines: {
		children: (subject, values, bindle) => subject.children(),
		contents: (subject, values: string[], bindle) => {
			const [
				selector,
				content,
				quantifier = ZERO_OR_MORE
			] = values;
			const elOrEls = selectSubroutine(subject, [selector, quantifier], bindle);
			const els = Array.isArray(elOrEls) ? elOrEls : [elOrEls];
			const matches = els.filter((el) => {
				const contents: string = el.text();
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

const CAR_LIST = {
	links: `select '#page-results a[href]' ${ZERO_OR_MORE} | read attribute href`
};

const CAR = {
	json: [
		`select #horseshoe-config ${FIRST_OR_NULL}`,
		'rtc'
	],
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
	Kilometer: [
		`contents 'div' 'Kilometer'`,
		'siblings',
		'rtc',
		'replaceAllWhiteSpace',
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
	bildeUrls: [
		`select "[data-carousel-container=''] img[src]" ${ZERO_OR_MORE}`,
		'read attribute src'
	]
}

const res = await fetch("https://www.finn.no/car/used/search.html", {
	method: "GET",
});
const html = await res.text();
const data = operate(CAR_LIST, html);

// const data = {
// 	links:[
// 		'https://www.finn.no/car/used/ad.html?finnkode=329894737'
// 	]
// }
// const html2 = readFileSync('car.html', 'utf8');

let i = 0;
for (const link of data.links) {
	console.log(`${i+1}/${data.links.length} ${link} processing...`);
	const res2 = await fetch(link, {
		method: "GET",
	});
	const html2 = await res2.text();
	// writeFileSync('car.html', html2);
	const data2 = operate(CAR, html2);

	// Download one image and base64 encode it
	if (data2.bildeUrls && data2.bildeUrls.length > 0) {
		const res3 = await fetch(data2.bildeUrls[0], {
			method: "GET",
		});
		if (res3.ok) {
			const buffer = await res3.arrayBuffer();
			const base64 = _arrayBufferToBase64(buffer);
			data2.bildeBase64 = [base64];
		}
	}

	if (data2.json) {
		const obj = JSON.parse(data2.json);
		if (obj?.xandr?.feed) {
			[
				'km',
				'co2',
				'pris',
				'merke',
				'model',
				'seter',
				'variant',
				'finnkode',
				'girkasse',
				'drivstoff',
				'hjuldrift',
				'karosseri',
				'regnummer',
				'aarsmodell',
				'hovedbilde',
				'hovedfarge',
				'postnummer',
				'antalleiere',
				'omregavgift',
				'hestekrefter',
				'avgiftsklasse'
			].forEach((key) => {
				data2[key] = obj.xandr.feed[key];
			});
		}
		delete data2.json;
	}

	if (!data2.aarsmodell && data2.Modellår) {
		data2.aarsmodell = data2.Modellår;
	}

	if (data2.aarsmodell) {
		data2.aarsmodell = parseInt(data2.aarsmodell, 10);
		data2.yearsOld = new Date().getFullYear() - data2.aarsmodell;
	} else {
		console.log('no aarsmodell')
	}

	if (!data2.pris && data2.Totalpris) {
		data2.pris = data2.Totalpris;
	}

	if (data2.pris) {
		data2.pris = parseInt(data2.pris, 10);
	} else {
		console.log('no pris')
	}

	if (data2.pris && data2.yearsOld) {
		const prisPerÅr = data2.pris / data2.yearsOld;
		if (prisPerÅr > 0) {
			data2.prisPerÅr = prisPerÅr;
		}
	}

	if (!data2.km && data2.Kilometer) {
		data2.km = data2.Kilometer;
	}

	if (data2.pris && data2.km) {
		data2.km = parseInt(data2.km, 10);
		const prisPerKm = data2.pris / data2.km;
		if (prisPerKm > 0) {
			data2.prisPerKm = prisPerKm;
		}
	} else {
		console.log('no km')
	}

	if (!data2.hestekrefter && data2.Effekt) {
		data2.hestekrefter = data2.Effekt;
	}

	if (data2.pris && data2.hestekrefter) {
		const prisPerHestekreft = data2.pris / data2.hestekrefter;
		if (prisPerHestekreft > 0) {
			data2.prisPerHestekreft = prisPerHestekreft;
		}
	} else {
		console.log('no hestekrefter')
	}

	const req = {
		method: 'POST',
		headers: {
			'authorization': `Explorer-Api-Key ${API_KEY}`,
			'content-type': 'application/json',
		},
		body: JSON.stringify(data2),
	};

	const res3 = await fetch(`${INGEST_BASE}/${COLLETION}?documentType=${DOCUMENT_TYPE}&requireValid=false&returnDocument=false`, req);
	const json = await res3.json();
	console.log(`${i+1}/${data.links.length} ${link} ${json.id} done.`);

	i++;
	await delay(500);
}
