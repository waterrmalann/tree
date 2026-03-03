// ---------- Data model ----------
/**
 * @typedef {Object} FileNode
 * @property {string} name
 * @property {FileNode|null} parent
 * @property {FileNode[]} children
 */

const LINE_STRINGS = {
  "utf-8": {
    CHILD: "├── ",
    LAST_CHILD: "└── ",
    DIRECTORY: "│   ",
    EMPTY: "    ",
  },
  ascii: {
    CHILD: "|-- ",
    LAST_CHILD: "`-- ",
    DIRECTORY: "|   ",
    EMPTY: "    ",
  },
};

const defaultOptions = {
  charset: "utf-8",
  trailingDirSlash: false,
  fullPath: false,
  rootDot: true,
};

// ---------- Small utility helpers ----------
/** @template T @param {T[]} arr */
function last(arr) {
  return arr.length ? arr.at(-1) : undefined;
}

/** Deep-merge for plain objects (sufficient for options objects). */
function defaultsDeep(target, ...sources) {
  // target gets values from sources when target doesn't already define them
  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    for (const k of Object.keys(src)) {
      const sv = src[k];
      const tv = target[k];
      if (tv === undefined) {
        // If target missing, copy (shallow) then recurse if object
        if (sv && typeof sv === "object" && !Array.isArray(sv)) {
          target[k] = defaultsDeep({}, sv);
        } else {
          target[k] = sv;
        }
      } else if (
        tv &&
        typeof tv === "object" &&
        !Array.isArray(tv) &&
        sv &&
        typeof sv === "object" &&
        !Array.isArray(sv)
      ) {
        defaultsDeep(tv, sv);
      }
    }
  }
  return target;
}

/** Flatten arbitrarily nested arrays. */
function flattenDeep(input) {
  /** @type {any[]} */
  const out = [];
  (function walk(x) {
    if (Array.isArray(x)) for (const v of x) walk(v);
    else out.push(x);
  })(input);
  return out;
}

/**
 * @param {FileNode} structure
 * @param {Object} [options]
 */
function generateTree(structure, options) {
  const opts = defaultsDeep({}, options || {}, defaultOptions);

  return flattenDeep([
    getAsciiLine(structure, opts),
    structure.children.map((c) => generateTree(c, opts)),
  ])
    .filter((line) => line != null)
    .join("\n");
}

/**
 * @param {FileNode} structure
 * @param {ReturnType<typeof defaultsDeep>} options
 * @returns {string|null}
 */
function getAsciiLine(structure, options) {
  const lines = LINE_STRINGS[options.charset];

  // Root special case
  if (!structure.parent) {
    return options.rootDot ? structure.name : null;
  }

  const chunks = [
    isLastChild(structure) ? lines.LAST_CHILD : lines.CHILD,
    getName(structure, options),
  ];

  let current = structure.parent;
  while (current?.parent) {
    chunks.unshift(isLastChild(current) ? lines.EMPTY : lines.DIRECTORY);
    current = current.parent;
  }

  // If not rendering root dot, chop the first indent chunk ("├── " / "|-- ")
  return chunks.join("").substring(options.rootDot ? 0 : lines.CHILD.length);
}

/**
 * @param {FileNode} structure
 * @param {ReturnType<typeof defaultsDeep>} options
 */
function getName(structure, options) {
  const nameChunks = [structure.name];

  // Append trailing slash for directories
  if (
    options.trailingDirSlash &&
    structure.children.length > 0 &&
    !/\/\s*$/.test(structure.name)
  ) {
    nameChunks.push("/");
  }

  // Prefix with full path
  if (options.fullPath && structure.parent && structure.parent) {
    nameChunks.unshift(
      getName(
        structure.parent,
        defaultsDeep({}, { trailingDirSlash: true }, options),
      ),
    );
  }

  return nameChunks.join("");
}

/** @param {FileNode} structure */
function isLastChild(structure) {
  return Boolean(
    structure.parent && last(structure.parent.children) === structure,
  );
}

// ---------- Parsing: indentation-based input -> FileNode tree ----------
/**
 * Supported:
 * - tabs OR spaces for indentation
 * - any indentation width; nesting is determined by increasing indentation depth
 * - blank lines ignored
 *
 * @param {string} text
 * @returns {FileNode} root
 */
function parseIndentedList(text) {
  const root = { name: ".", parent: null, children: [] };

  const lines = text
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((raw) => raw.replaceAll(/\s+$/g, "")); // trim right only

  /** stack of { indent: number, node: FileNode } */
  const stack = [{ indent: -1, node: root }];

  for (const element of lines) {
    const raw = element;
    if (!raw.trim()) continue;

    const indentMatch = new RegExp(/^[\t ]*/).exec(raw);
    const indentStr = indentMatch ? indentMatch[0] : "";
    const indent = indentationScore(indentStr);

    const name = raw.slice(indentStr.length).trim();
    if (!name) continue;

    // Find parent by popping until we get a node with indent < current indent
    while (stack.length && stack.at(-1).indent >= indent) stack.pop();

    const parent = stack.length ? stack.at(-1).node : root;

    const node = { name, parent, children: [] };
    parent.children.push(node);

    stack.push({ indent, node });
  }

  return root;
}

// Tabs count as 2 spaces for scoring (purely for relative comparisons).
function indentationScore(ws) {
  let score = 0;
  for (const ch of ws) score += ch === "\t" ? 2 : 1;
  return score;
}

// ---------- UI wiring ----------
const $ = (id) => document.getElementById(id);

const inputEl = $("input");
const outputEl = $("output");
const inputErrorEl = $("inputError");
const outputErrorEl = $("outputError");

const charsetEl = $("charset");
const trailingDirSlashEl = $("trailingDirSlash");
const fullPathEl = $("fullPath");
const rootDotEl = $("rootDot");
const copyBtn = $("copyBtn");
const STORAGE_KEY = "tree-input";
let lastStoredInput = null;

function getStoredInput() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeInput(value) {
  if (value === lastStoredInput) return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
    lastStoredInput = value;
  } catch {}
}

function getOptionsFromUI() {
  return {
    charset: charsetEl.value,
    trailingDirSlash: trailingDirSlashEl.checked,
    fullPath: fullPathEl.checked,
    rootDot: rootDotEl.checked,
  };
}

function setError(el, msg) {
  if (msg) {
    el.style.display = "block";
    el.textContent = msg;
  } else {
    el.style.display = "none";
    el.textContent = "";
  }
}

function render() {
  try {
    setError(inputErrorEl, null);
    setError(outputErrorEl, null);
    storeInput(inputEl.value);

    const root = parseIndentedList(inputEl.value);
    const tree = generateTree(root, getOptionsFromUI());

    outputEl.textContent = tree;
  } catch (e) {
    outputEl.textContent = "";
    setError(outputErrorEl, String(e?.message ? e.message : e));
  }
}

inputEl.addEventListener("input", render);
charsetEl.addEventListener("change", render);
trailingDirSlashEl.addEventListener("change", render);
fullPathEl.addEventListener("change", render);
rootDotEl.addEventListener("change", render);

// ---------- Textarea indentation UX ----------
const INDENT = "  "; // change to "\t" if you prefer tabs

inputEl.addEventListener("keydown", (e) => {
  const start = inputEl.selectionStart;
  const end = inputEl.selectionEnd;

  if (e.key === "Tab") {
    e.preventDefault();
    indentSelection(e.shiftKey ? -1 : 1);
    render();
    return;
  }

  if (e.key === "Backspace") {
    if (start === end && outdentAtCursor()) {
      e.preventDefault();
      render();
    }
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    insertNewlineWithIndent();
    render();
    return;
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outputEl.textContent || "");
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy output"), 800);
  } catch {
    // Fallback: select output text
    const range = document.createRange();
    range.selectNodeContents(outputEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
});

// Seed example only when there is no stored input
const storedInput = getStoredInput();
lastStoredInput = storedInput;
inputEl.value =
  storedInput !== null
    ? storedInput
    : [
        "src",
        "  index.js",
        "  styles",
        "    app.css",
        "  components",
        "    Button.js",
        "    Card.js",
        "README.md",
      ].join("\n");

render();


// ---------- Textarea indentation helpers ----------
function indentSelection(direction) {
  const start = inputEl.selectionStart;
  const end = inputEl.selectionEnd;
  const value = inputEl.value;

  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;

  const before = value.slice(0, lineStart);
  const block = value.slice(lineStart, blockEnd);
  const after = value.slice(blockEnd);

  const lines = block.split("\n");

  const newLines =
    direction > 0
      ? lines.map(line => INDENT + line)
      : lines.map(line => line.startsWith(INDENT) ? line.slice(INDENT.length) : line);

  const newBlock = newLines.join("\n");

  inputEl.value = before + newBlock + after;

  const delta = newBlock.length - block.length;

  inputEl.selectionStart = start + (direction > 0 ? INDENT.length : Math.min(0, delta));
  inputEl.selectionEnd = end + delta;
}

function outdentAtCursor() {
  const pos = inputEl.selectionStart;
  const value = inputEl.value;

  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const before = value.slice(lineStart, pos);

  const indentMatch = before.match(/^[\t ]+$/);
  if (!indentMatch) return false;

  const indent = indentMatch[0];

  if (indent.length === 0) return false;

  const remove = Math.min(INDENT.length, indent.length);

  inputEl.value =
    value.slice(0, pos - remove) +
    value.slice(pos);

  inputEl.selectionStart =
  inputEl.selectionEnd =
    pos - remove;

  return true;
}

function insertNewlineWithIndent() {
  const pos = inputEl.selectionStart;
  const value = inputEl.value;

  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const indentMatch = value.slice(lineStart, pos).match(/^[\t ]*/);

  const indent = indentMatch ? indentMatch[0] : "";

  inputEl.value =
    value.slice(0, pos) +
    "\n" +
    indent +
    value.slice(pos);

  inputEl.selectionStart =
  inputEl.selectionEnd =
    pos + 1 + indent.length;
}
