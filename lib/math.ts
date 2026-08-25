import katex from "katex";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Renders a problem body containing inline `$...$` and display `$$...$$` math
 * into an HTML string. Runs on the server so the client never pays to typeset.
 *
 * Text outside math is escaped. When problem bodies start coming from user
 * uploads rather than our own fixtures, the output still needs sanitizing
 * before it reaches `dangerouslySetInnerHTML`.
 */
export function renderMathHtml(source: string): string {
  const segments = source.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g);

  return segments
    .map((segment) => {
      const display = segment.startsWith("$$") && segment.endsWith("$$");
      const inline =
        !display && segment.startsWith("$") && segment.endsWith("$") && segment.length > 1;

      if (!display && !inline) return escapeHtml(segment);

      const tex = display ? segment.slice(2, -2) : segment.slice(1, -1);
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    })
    .join("");
}

/** For values already stored as raw LaTeX, such as a problem's answer. */
export function renderTex(tex: string, display = false): string {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    strict: false,
  });
}
