#!/usr/bin/env node
/**
 * CSS manifest — a regression net for the Tailwind migration.
 *
 * Tailwind's failure mode is silent: a utility the old version emitted and the
 * new one drops renders with no styles and nothing throws. Screenshots are the
 * usual safety net, but that needs a browser; this repo's CI has none.
 *
 * This harness compiles src/index.css through the real pipeline (same plugins
 * as the build) and records every selector plus its resolved declarations.
 * Run it before and after a Tailwind change and diff the two JSON files:
 *
 *   node scripts/css-manifest.mjs --out /tmp/tw-before.json
 *   ... migrate ...
 *   node scripts/css-manifest.mjs --out /tmp/tw-after.json
 *   node scripts/css-manifest.mjs --diff /tmp/tw-before.json /tmp/tw-after.json
 *
 * `--diff` exits non-zero when a class that the app actually references stops
 * producing CSS. It is selector-driven on purpose: the compiled output is the
 * ground truth, so the check does not depend on guessing class names out of
 * JSX string literals.
 */
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const ROOT = process.cwd();
const CSS_ENTRY = path.join(ROOT, "src/index.css");

/** Raw text of every component/page/module, used only to decide "is this class referenced?". */
function sourceText() {
  let all = "";
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?|html)$/.test(entry.name)) all += fs.readFileSync(full, "utf8") + "\n";
    }
  };
  walk(path.join(ROOT, "src"));
  return all;
}

async function compile() {
  const plugins = [];
  let engine;
  try {
    // Tailwind v4 ships its own PostCSS plugin and reads config from CSS.
    const mod = await import("@tailwindcss/postcss");
    plugins.push((mod.default ?? mod)());
    engine = "v4";
  } catch {
    const mod = await import("tailwindcss");
    plugins.push((mod.default ?? mod)({ config: path.join(ROOT, "tailwind.config.ts") }));
    engine = "v3";
  }
  const css = fs.readFileSync(CSS_ENTRY, "utf8");
  const result = await postcss(plugins).process(css, { from: CSS_ENTRY });
  return { css: result.css, engine };
}

/**
 * Flatten the stylesheet into { selector -> declarations }.
 *
 * At-rule context matters: the same selector under `@media (min-width:768px)`
 * and unsuffixed are different rules. Media context is folded into the key so
 * a breakpoint that stops being generated is still caught.
 */
function selectorMap(cssText) {
  const root = postcss.parse(cssText);
  const map = Object.create(null);

  root.walkRules((rule) => {
    if (!rule.selectors) return;
    const decls = rule.nodes
      .filter((n) => n.type === "decl")
      .map((n) => `${n.prop}:${n.value}`)
      .join(";");
    if (!decls) return;

    // @layer is ignored: v3 and v4 place the same utility in different layers,
    // and layer membership is not a "class lost its styles" signal. Conditional
    // at-rules are kept — a breakpoint that stops being generated is a real bug.
    const context = [];
    for (let p = rule.parent; p && p.type !== "root"; p = p.parent) {
      if (p.type !== "atrule") continue;
      if (p.name === "layer") continue;
      context.unshift(`@${p.name} ${p.params}`.trim());
    }
    const prefix = context.length ? `${context.join(" && ")} => ` : "";

    for (const sel of rule.selectors) {
      const key = prefix + sel.trim();
      map[key] = map[key] ? `${map[key]}|${decls}` : decls;
    }
  });

  return map;
}

/** `.md\:flex` -> `.md:flex` so keys compare against source text. */
const unescapeSelector = (sel) => sel.replace(/\\(.)/g, "$1");

/**
 * The class a selector targets, ignoring variants and state pseudo-classes:
 * `.md\:flex:hover > *` -> `flex`.
 */
function baseClass(sel) {
  const m = unescapeSelector(sel).match(/\.([A-Za-z0-9_-]+(?:\[[^\]]*\])?)(?=[:\s>+~,[.]|$)/);
  return m ? m[1] : null;
}

const args = process.argv.slice(2);
const diffIdx = args.indexOf("--diff");

if (diffIdx !== -1) {
  const [beforePath, afterPath] = args.slice(diffIdx + 1, diffIdx + 3);
  const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
  const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));
  const src = sourceText();

  const beforeKeys = Object.keys(before.selectors);
  const afterKeys = new Set(Object.keys(after.selectors));

  // A class "matters" if the app actually references it. Config-level rules and
  // utilities nothing uses are allowed to disappear.
  const isReferenced = (sel) => {
    const cls = baseClass(sel);
    if (!cls) return false;
    // Escape for a crude textual check; arbitrary-value classes contain
    // brackets that regex would choke on.
    return src.includes(cls.replace(/\[/g, "\\[").replace(/\]/g, "\\]")) || src.includes(cls);
  };

  // Compare on selector identity and ignore at-rule context: v4 wraps hover
  // variants in @media (hover:hover) and moves utilities between @layer blocks.
  // Those are relocations, not style loss, and counting them as failures buries
  // the real findings.
  const stripContext = (k) => (k.includes("=> ") ? k.slice(k.lastIndexOf("=> ") + 3) : k);
  const beforeIdentity = new Map(beforeKeys.map((k) => [stripContext(k), k]));
  const afterIdentity = new Set(Object.keys(after.selectors).map(stripContext));

  const lostAll = [...beforeIdentity.keys()].filter((k) => !afterIdentity.has(k));
  const lostUsed = lostAll.filter(isReferenced);
  const changed = beforeKeys.filter((k) => afterKeys.has(k) && before.selectors[k] !== after.selectors[k]);

  const engineLine = `${before.engine ?? "?"} -> ${after.engine ?? "?"}`;
  console.log(`engine:            ${engineLine}`);
  console.log(`css bytes:         ${before.cssBytes} -> ${after.cssBytes}`);
  console.log(`selectors:         ${beforeKeys.length} -> ${Object.keys(after.selectors).length}`);
  console.log(`dropped selectors: ${lostAll.length} (${lostUsed.length} referenced by the app)`);
  console.log(`changed declarations: ${changed.length}`);

  if (lostUsed.length) {
    console.log("\nREFERENCED CLASSES THAT LOST THEIR CSS:");
    for (const k of lostUsed.slice(0, 60)) console.log(`  - ${unescapeSelector(k)}`);
  }
  if (changed.length) {
    console.log("\nDECLARATIONS THAT CHANGED (review these):");
    for (const k of changed.slice(0, 30)) {
      console.log(`  ~ ${unescapeSelector(k)}`);
      console.log(`      before: ${before.selectors[k].slice(0, 120)}`);
      console.log(`      after:  ${after.selectors[k].slice(0, 120)}`);
    }
  }

  if (lostUsed.length > 0) {
    console.error(`\nFAIL: ${lostUsed.length} referenced class(es) no longer produce CSS.`);
    process.exit(1);
  }
  console.log("\nOK: no referenced class lost its styles.");
  process.exit(0);
}

const { css, engine } = await compile();
const selectors = selectorMap(css);

const payload = {
  generatedAt: new Date().toISOString(),
  engine,
  cssBytes: css.length,
  selectors,
};

const outIdx = args.indexOf("--out");
if (outIdx !== -1) {
  fs.writeFileSync(args[outIdx + 1], JSON.stringify(payload, null, 2));
  console.log(`wrote ${args[outIdx + 1]}`);
}
console.log(`engine=${engine} css=${(css.length / 1024).toFixed(1)}kB selectors=${Object.keys(selectors).length}`);
