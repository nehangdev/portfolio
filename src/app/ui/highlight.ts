// Prism core ships with markup (HTML), CSS, C-like and JavaScript; add the other two languages we show.
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-csharp';

// We highlight explicitly; stop Prism from scanning the page on its own.
Prism.manual = true;

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML with Prism token spans, or escaped plain text for an unknown language. */
export function highlight(code: string, language: string): string {
  const grammar = Prism.languages[language];
  return grammar ? Prism.highlight(code, grammar, language) : escape(code);
}
