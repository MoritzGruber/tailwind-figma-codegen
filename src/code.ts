import { cssToTailwind } from './cssToTailwind';
import { variablesToTailwindConfig } from './tailwindconfig';
import { loadEffectStyles, loadNodeStyles, loadColors, loadTextStyles, laodAllVariables } from './variables';

const defaultState = {
	ignoreFields: 'font-style=normal',
	tailwindConfig: ''
};

let state = defaultState;

let loaded = false;
// Save data
// await figma.clientStorage.setAsync('user-preferences', {theme: 'dark'})

// Retrieve data
// const preferences = await figma.clientStorage.getAsync('user-preferences')

const loadData = async () => {
	const variables = {
		colors: await loadColors(),
		textStyles: await loadTextStyles(),
		nodeStyles: await loadNodeStyles(),
		effectStyles: await loadEffectStyles()
	};
	console.log(`variables `, variables);
	await figma.clientStorage
		.getAsync('state')
		.then((data) => {
			console.log('Loaded user data:', data);
			state = data;
			loaded = true;
			// Use the data to initialize your plugin state
		})
		.catch((error) => {
			console.error('Error loading user data:', error);
		});
	if(state && (!state.tailwindConfig || state.tailwindConfig.trim() == '')) {
		const twConfig: any = await variablesToTailwindConfig(await laodAllVariables());
		state.tailwindConfig = twConfig;
		figma.clientStorage.setAsync('state', { ...state, tailwindConfig: twConfig }).then(
			() => {
				figma.notify('Data updated');
				figma.ui.close();
				figma.codegen.refresh();
			},
			(error) => {
				console.error('Error saving user data:', error);
				figma.notify('Error saving data');
				figma.ui.close();
				figma.codegen.refresh();
			}
		);
	}		
};
loadData();

figma.codegen.on('generate', async (e) => {
	const node = e.node;
	if (!loaded) {
		await loadData();
	}
	const cssObj = await node.getCSSAsync();

	let configObj = undefined;
	try {
		if (state.tailwindConfig && state.tailwindConfig.trim() != '') {
			configObj = JSON.parse(state.tailwindConfig);
		}
	} catch (e) {
		console.error('Invalid tailwindConfig', state && state.tailwindConfig);
	}
	const ignoreFields = state ? state.ignoreFields : defaultState.ignoreFields;

	const twConfig: any = await variablesToTailwindConfig(await laodAllVariables());

	const { className, css } = await cssToTailwind(
		cssObj,
		ignoreFields.split(',').map((field) => field.trim()),
		twConfig
	);

	return [
		{
			title: 'tailwindcss',
			code: className,
			language: 'CSS'
		},
		// {
		// 	title: 'css',
		// 	code: css,
		// 	language: 'CSS'
		// },
		{
			title: 'tailwind config',
			code: JSON.stringify(twConfig, null, 2),
			language: 'JAVASCRIPT'
		},
	];
});

figma.codegen.on('preferenceschange', async (e) => {
	if (e.propertyName == 'ignoreFields') {
		const ignoreFields = state ? state.ignoreFields : defaultState.ignoreFields;
		figma.showUI(
			`
			<div>
				<h1>Ignore Fields</h1>
				<p>Enter the fields you want to ignore separated by comma. You can add a value using <kbd>key=value</kbd> format to ignore a field only when this field matches the value</p>
				<input type="text" value="${ignoreFields}" id="ignoreFields" />
				<button id="save" onclick="parent.postMessage({ pluginMessage: { type: 'save', ignoreFields: document.getElementById('ignoreFields').value } }, '*')">Save</button>
			</div>
			`,
			{ visible: true }
		);
	}
	
});

figma.ui.onmessage = (message) => {
	console.log(` onmessage`);
	if (message.type === 'save') {
		if (!state) {
			state = defaultState;
		}
		if (message.ignoreFields) {
			state.ignoreFields = message.ignoreFields;
		}
		if (message.tailwindConfig) {
			state.tailwindConfig = message.tailwindConfig;
		}
		
	}
};
