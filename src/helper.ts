
export function rgbToHex(int: any) {
    let hex = Number(int).toString(16);
    if (hex.length < 2) {
      hex = `0${hex}`;
    }
    return hex;
  }
  
  export function makeHex(r:any, g:any, b:any, a:any) {
    const red = rgbToHex(r);
    const green = rgbToHex(g);
    const blue = rgbToHex(b);

    if (a !== undefined) {
      const alpha = rgbToHex(Math.round(a * 255));
      return `#${red}${green}${blue}${alpha}`.toUpperCase();
    }

    return `#${red}${green}${blue}`.toUpperCase();
  }
  
  export function makeRgb(color: any) {
    const r = Math.round(255 * color.r);
    const g = Math.round(255 * color.g);
    const b = Math.round(255 * color.b);
    // TODO * 100 and round
    const a = Math.round(100 * color.a) / 100;
    return { r, g, b, a };
  }