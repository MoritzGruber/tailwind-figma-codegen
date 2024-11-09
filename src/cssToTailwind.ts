import { TailwindConverter } from 'css-to-tailwindcss';

import type { Config } from 'tailwindcss';
import { makeHex } from './helper';

function replaceCssVarWithFallback(cssString: string) {
	return cssString.replace(/var\((.*?),\s*(.*?)\)/g, (_, varName: string, fallback) => {
		return fallback.trim();
	});
}

export function replaceRgbaWithHex(cssString: string): string {
	const rgbaRegex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g;

	return cssString.replace(rgbaRegex, (match, r, g, b, a) => {
		const hexColor = makeHex(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10), parseFloat(a));
		return hexColor;
	});
}

export const postProcessTailwindClasses = (classes: string) => {
	const postReplacements = [
		['leading-[normal]', 'leading-normal'],
		['leading-[1.5]', 'leading-normal'],
		['leading-[150%]', 'leading-normal'],
		['leading-[loose]', 'leading-loose'],
		['leading-[none]', 'leading-none'],
		['leading-[tight]', 'leading-tight'],
		['leading-[snug]', 'leading-snug'],
		['leading-[relaxed]', 'leading-relaxed'],
		['tracking-[0px]', 'tracking-normal'],
	];

	return postReplacements.reduce((acc, [search, replace]) => acc.replace(search, replace), classes);
};

export const cssToTailwind = async (cssObj: Record<string, string>, ignoreFields?: string[], tailwindConfig?: undefined | Config) => {
	const converter = new TailwindConverter(
		tailwindConfig
			? {
					remInPx: 16,
					arbitraryPropertiesIsEnabled: false,
					tailwindConfig
				}
			: { remInPx: 16, arbitraryPropertiesIsEnabled: false }
	);

	if (ignoreFields && ignoreFields.length) {
		for (const field of ignoreFields) {
			if (field.includes('=')) {
				const [key, value] = field.split('=');
				if (value === '*' && cssObj[key]) {
					delete cssObj[key];
				}

				if (cssObj[key] === value) {
					delete cssObj[key];
				}
			} else delete cssObj[field];
		}
	}

	const css = Object.entries(cssObj)
		.map(([key, value]) => {
			if (key == 'background') {
				// for just colors we need to change this to background color
				const twColorNames: any = [];
				if (tailwindConfig && tailwindConfig.theme) {
					tailwindConfig.theme.colors &&
						Object.keys(tailwindConfig.theme.colors).forEach((colorName) => {
							twColorNames.push(colorName);
						});
					if (tailwindConfig.theme.extend) {
						tailwindConfig.theme.extend.colors &&
							Object.keys(tailwindConfig.theme.extend.colors).forEach((colorName) => {
								twColorNames.push(colorName);
							});
					}
				}

				if (
					value.includes('rgb') ||
					value.includes('rgba') ||
					value.includes('#') ||
					value.includes('hsl') ||
					value.includes('hsla') ||
					twColorNames.some((colorName: any) => value.includes(colorName))
				) {
					key = 'background-color';
				}
			}

			return `${key}: ${value.replace(/\/\*.*\*\//g, '').trim()};`;
		})
		.join('\n');

	console.log(` css`, css);
	const replacedCss = replaceRgbaWithHex(replaceCssVarWithFallback(css));
	console.log(` replacedCss`, replacedCss);

	const { convertedRoot, nodes } = await converter.convertCSS(`
    div {
        ${replacedCss}
    }
    `);
	console.log(` convertedRoot.toString()`, convertedRoot.toString());

	const doc = {
		className: postProcessTailwindClasses(nodes[0].tailwindClasses.join(' ').trim()),
		css: convertedRoot.toString()
	};

	return doc;
};
