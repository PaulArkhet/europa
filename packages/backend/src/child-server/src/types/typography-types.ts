type FontStyles = {
  size: string;
  weight: string;
};

type TypographyElements = {
  "Header 1": FontStyles;
  "Header 2": FontStyles;
  "Header 3": FontStyles;
  "Header 4": FontStyles;
  "Header 5": FontStyles;
  "Header 6": FontStyles;
  Paragraph: FontStyles;
  Link: FontStyles;
};

type TypographyElementKey = keyof TypographyElements | "";

interface Font {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: { [key: string]: string };
  category: string;
  kind: string;
  menu: string;
}

interface FontsApiResponse {
  items: Font[];
}

export type {
  FontsApiResponse,
  Font,
  FontStyles,
  TypographyElements,
  TypographyElementKey,
};
