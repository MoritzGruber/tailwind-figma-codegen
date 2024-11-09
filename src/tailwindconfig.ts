export const tailwindifyName = (str: string) => {
    return str
    .replace(/\//g, '-')  // Replace all '/' with '-'
    .replace(/\s/g, '-')  // Replace all spaces with '-'
    .replace(/--+/g, '-');  // Replace two or more '-' with a single '-'};
};
const colorsTWNative = require('tailwindcss/colors')

export const variablesToTailwindConfig = async (variables: Record<string, any>) => {

    // console.log(` colorsTWNative`, colorsTWNative);
    // console.log(` colorsTWNative['slate`,colorsTWNative['slate'] );

    const colors:any = {}
    
    variables.colors.map(
        (c: any) => {

            // lets ignore all native tailwind colors - lets not overwrite them
            const twName = tailwindifyName(c.name);
            const matchingNativeColor = Object.keys(colorsTWNative).find((color) => twName.includes(color.toLowerCase()) && Object.keys(colorsTWNative[color]).some((colorName) => twName.includes(`${color}-${colorName}`))); 
            if(matchingNativeColor || twName == ('black') || twName == ('white')) {
                return
            }
            colors[twName] = c.value;
        } 
    );

	const tailwindConfig = {
		theme: {
			extend: {
				colors: {
					...colors
				},
			}
		}
	};

	return tailwindConfig;
};
