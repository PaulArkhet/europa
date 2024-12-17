type ColorPalette = {
  primary: string[];
  accents: string[];
  neutral: string[];
};

type ColorPaletteKey = keyof ColorPalette;

export type { ColorPalette, ColorPaletteKey };
