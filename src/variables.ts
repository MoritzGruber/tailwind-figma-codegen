import { makeHex, makeRgb } from './helper';

export async function loadTextStyles() {
	// eslint-disable-next-line
	const textStyles = await figma.getLocalTextStylesAsync();
	console.log(`figma textStyles`, textStyles);
	const fontSizes: any[] = [];
	const fontFamilies: any[] = [];
	const finalSizes: any[] = [];
	const finalFamilies: any[] = [];

	textStyles.forEach((style) => {
		const { family } = style.fontName;
		const { fontSize } = style;

		fontFamilies.push(family);
		fontSizes.push(fontSize);
	});

	// Get unique values
	const singleSizes = Array.from(new Set(fontSizes)).sort((a, b) => a - b);
	const singleFamilies = Array.from(new Set(fontFamilies));

	// Clean sizes
	singleSizes.forEach((size) => {
		const name = '';
		// Pass everything as a string
		const value = size.toString();
		const result = { name, value };
		finalSizes.push(result);
	});

	// Clean families
	singleFamilies.forEach((family) => {
		const name = family.replace(/\s+/g, '-').toLowerCase();
		const value = family;
		const result = { name, value };
		finalFamilies.push(result);
	});

	// Make objects
	return { fontSizes: finalSizes, fontFamilies: finalFamilies };
}

export const loadColors = async () => {
	// eslint-disable-next-line
	const colorStyles = await figma.getLocalPaintStylesAsync();
	const colors: any[] = []; // array of hex values and their names
	const gradientColors: any[] = [];

	colorStyles.forEach((style) => {
		// Extra check for empty paint styles
		const paint: any = style.paints[0] || null;
		if (paint) {
			const { color = null, gradientStops = null, opacity = null } = style.paints[0] as any;
			/* Only work with solid colors */
			if (color) {
				const { name } = style;
				if (name.includes('primary')) {
					console.log(` color ${name}`, { color, style, opacity });
				}
				let alpha = undefined;
				if (opacity != 1 && isNaN(opacity) === false) {
					alpha = Math.round(100 * opacity) / 100;
				} 
				const { r, g, b } = makeRgb(color);
					const value = makeHex(r, g, b, alpha);
					const result = { name, value };
					colors.push(result);
			} else if (gradientStops && gradientStops.length > 0) {
				/* Add gradients as a suggestion */
				gradientStops.forEach((stop: any) => {
					const { r, g, b } = makeRgb(stop.color);
					const value = makeHex(r, g, b, undefined);
					gradientColors.push(value);
				});
			}
		}
	});
	return { colors, gradientColors };
};

export async function loadNodeStyles() {
	// eslint-disable-next-line no-undef
	await figma.loadAllPagesAsync();
	// eslint-disable-next-line no-undef
	const filterdNodes = figma.root.findAll((n: any) => n.cornerRadius);
	const radii = new Set();
	Array.from(filterdNodes).forEach((n: any) => {
		if (typeof n.cornerRadius === 'number') {
			const value = n.cornerRadius < 99 ? n.cornerRadius : 999;
			radii.add(value);
		}
	});
	const radiiArray = [...radii].sort((a, b) => a - b);
	const finalRadii = [];

	// const position = radiiArray.indexOf(16);
	radiiArray.forEach((radius) => {
		// const n = calculatePosition(i, position, radiiArray.length);
		// Rename base to default
		// const value = radius > 98 ? '9999px' : `${radius / 16}rem`;
		const value = Number(radius);
		const name = '';
		finalRadii.push({ name, value });
	});

	// Add default none
	finalRadii.unshift({ name: 'none', value: 0 });
	return { radius: finalRadii };
}

export async function loadEffectStyles() {
	// eslint-disable-next-line
	const effectStyles = await figma.getLocalEffectStylesAsync();
	const shadows: any[] = [];

	effectStyles.forEach((style) => {
		const shadowStyle: any = {};
		const { effects, name } = style;
		const styleString: any[] = [];
		// Generate css string for each shadow (if it has a color, BACKGROUND_BLUR does not)
		effects.forEach((effect) => {
			const { color, offset, radius, spread, type } = effect as any;
			if (color) {
				const { r, g, b, a } = makeRgb(color);
				const colorString = `${r},${g},${b},${a}`;
				styleString.push(
					`${type === 'INNER_SHADOW' ? 'inset ' : ''}${offset.x}px ${offset.y}px ${radius}px ${spread}px rgba(${colorString})`
				);
			}
		});
		// Create object & push it to shadows
		if (shadowStyle) {
			shadowStyle.name = name;
			shadowStyle.value = styleString.join(', ');
			shadows.push(shadowStyle);
		}
	});

	return { shadows };
}

export const laodAllVariables = async () => {
	const colorPromise = loadColors();
	const textPromise = loadTextStyles();
	const nodePromise = loadNodeStyles();
	const effectPromise = loadEffectStyles();

	const variables = {
		__loaded: true,
		...(await colorPromise),
		...(await textPromise),
		...(await nodePromise),
		...(await effectPromise)
	};
	return variables;
};
