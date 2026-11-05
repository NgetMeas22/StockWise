export type Language = 'en' | 'kh';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export type TranslationDict = {
  [section: string]: {
    [key: string]: string;
  };
};

