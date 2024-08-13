export const tailwindifyName = (str: string) => {
    return str
    .replace(/\//g, '-')  // Replace all '/' with '-'
    .replace(/\s/g, '-')  // Replace all spaces with '-'
    .replace(/--+/g, '-');  // Replace two or more '-' with a single '-'};
};

export const variablesToTailwindConfig = async (variables: Record<string, any>) => {

    const colors:any = {}
    
    variables.colors.map(
        (c: any) => {
            colors[tailwindifyName(c.name)] = c.value;
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
