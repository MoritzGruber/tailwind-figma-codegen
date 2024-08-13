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
};
loadData();

figma.codegen.on('generate', async (e) => {
	const node = e.node;
	if (!loaded) {
		await loadData();
	}
	const cssObj = await node.getCSSAsync();

	console.log(`variables `, await laodAllVariables());
	console.log(` cssObj`, cssObj);
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
	console.log(` twConfig`, twConfig);

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
		{
			title: 'css',
			code: css,
			language: 'CSS'
		}
	];
});

figma.codegen.on('preferenceschange', async (e) => {
	if (e.propertyName == 'ignoreFields') {
		figma.showUI(
			`
			<div>
				<h1>Ignore Fields</h1>
				<p>Enter the fields you want to ignore separated by comma. You can add a value using <kbd>key=value</kbd> format to ignore a field only when this field matches the value</p>
				<input type="text" value="${state.ignoreFields}" id="ignoreFields" />
				<button id="save" onclick="parent.postMessage({ pluginMessage: { type: 'save', ignoreFields: document.getElementById('ignoreFields').value } }, '*')">Save</button>
			</div>
			`,
			{ visible: true }
		);
	}
	if (e.propertyName == 'tailwindConfig') {
		const twConfig: any = await variablesToTailwindConfig(await laodAllVariables());

		figma.showUI(
			`
     <style>
        body { font-family: Arial, sans-serif; padding: 1rem; }
        .container { max-width: 28rem; margin: 0 auto; }
        h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
        textarea { width: 100%; height: 12rem; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem; margin-bottom: 0.5rem; }
        #validationMessage { font-size: 0.875rem; margin-bottom: 0.5rem; }
        button { background-color: #3b82f6; color: white; font-weight: bold; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; }
        button:hover { background-color: #2563eb; }
        button:disabled { background-color: #9ca3af; cursor: not-allowed; }
        .text-green-600 { color: #059669; }
        .text-red-600 { color: #dc2626; }
    </style>
    <div class="container">
        <h1>Tailwind Config</h1>
        <textarea id="tailwindConfig" value="${JSON.stringify(twConfig)}"></textarea>
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
		figma.clientStorage.setAsync('user-preferences', { theme: 'dark' }).then(
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
