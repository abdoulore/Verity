/**
 * SU-02 — slugify produces a valid URL slug.
 *
 * Executable check: calls slugify directly with four inputs:
 *   a) "Hello World"       → "hello-world"
 *   b) "Foo  Bar--Baz"     → "foo-bar-baz" (runs of punctuation → one hyphen)
 *   c) "  leading spaces " → "leading-spaces" (no leading/trailing hyphens)
 *   d) ""                  → "" (empty string must not throw)
 *
 * Status derivation:
 *   All assertions pass → VERIFIED
 *   Any assertion fails → FAILED
 *   Import throws       → UNCERTAIN
 */

import { slugify } from "../../../src/lib/stringUtils.js";
import { CriterionResult } from "../../types.js";

const IMPL_PATH = "src/lib/stringUtils.ts";

const AC_TEXT =
  "slugify(text) must return a lowercase string containing only [a-z0-9-] " +
  "characters, with no leading or trailing hyphens, and runs of whitespace " +
  "or punctuation replaced by exactly one hyphen each.";

export default function checkSU02(): CriterionResult {
  const evidence: { description: string; filePath?: string; snippet?: string }[] = [];

  const cases: Array<{ input: string; expected: string; label: string }> = [
    { input: "Hello World",        expected: "hello-world",     label: '"Hello World" → "hello-world"' },
    { input: "Foo  Bar--Baz",      expected: "foo-bar-baz",     label: '"Foo  Bar--Baz" → "foo-bar-baz"' },
    { input: "  leading spaces ",  expected: "leading-spaces",  label: '"  leading spaces " → "leading-spaces"' },
    { input: "",                   expected: "",                 label: '"" (empty) → ""' },
  ];

  let allPass = true;
  for (const c of cases) {
    let result: string | undefined;
    let threw = false;
    try {
      result = slugify(c.input);
    } catch {
      threw = true;
    }

    if (threw || result === undefined) {
      allPass = false;
      evidence.push({
        description: `slugify(${JSON.stringify(c.input)}) threw an exception`,
        filePath: IMPL_PATH,
        snippet: `✗ threw — must not throw for any string input`,
      });
      continue;
    }

    const pass = result === c.expected;
    if (!pass) allPass = false;

    evidence.push({
      description: `slugify(${JSON.stringify(c.input)}) → expected "${c.expected}"`,
      filePath: IMPL_PATH,
      snippet: `result = "${result}"  ${pass ? "✓" : `✗ expected "${c.expected}"`}`,
    });
  }

  return {
    id: "SU-02",
    text: AC_TEXT,
    status: allPass ? "VERIFIED" : "FAILED",
    reason: allPass
      ? "slugify produced correct lowercase hyphenated slugs for all four test inputs."
      : "slugify produced incorrect output for one or more inputs — see evidence.",
    evidence,
  };
}
