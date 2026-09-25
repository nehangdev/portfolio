// Prism core ships with markup (HTML), CSS, C-like and JavaScript; add the other two languages we show.
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-csharp';

// We highlight explicitly; stop Prism from scanning the page on its own.
Prism.manual = true;

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * HTML with Prism token spans, or escaped plain text for an unknown language.
 * `diff-<language>` treats each line's first character as a diff marker (+, - or space)
 * and colours the rest of the line as <language>.
 */
export function highlight(code: string, language: string): string {
  if (language.startsWith('diff-')) {
    const base = language.slice('diff-'.length);
    return code
      .split('\n')
      .map((line) => {
        const mark = line.charAt(0);
        const kind = mark === '+' ? 'add' : mark === '-' ? 'del' : 'ctx';
        return `<span class="diff-line diff-${kind}"><span class="diff-mark">${escape(mark || ' ')}</span>${highlight(line.slice(1), base)}</span>`;
      })
      .join('');
  }
  const grammar = Prism.languages[language];
  return grammar ? Prism.highlight(code, grammar, language) : escape(code);
}
