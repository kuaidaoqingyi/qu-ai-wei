#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function checkOutputs(cases, checklist, outputs) {
  const errors = [];
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) {
    return { errors: ["Outputs must be an object keyed by case id."], manual_review_required: true };
  }

  const ids = new Set(cases.map((item) => item.id));
  for (const id of Object.keys(outputs)) {
    if (!ids.has(id)) errors.push(`${id}: unknown output case`);
  }

  for (const item of cases) {
    const output = outputs[item.id];
    const rules = checklist[item.id];
    if (typeof output !== "string" || !output.trim()) {
      errors.push(`${item.id}: missing or empty output`);
      continue;
    }
    if (rules.unchanged && output !== item.input) {
      errors.push(`${item.id}: changed an already-clear input`);
    }
    if (rules.paragraph_count !== undefined) {
      const count = output.trim().split(/\n\s*\n/u).length;
      if (count !== rules.paragraph_count) {
        errors.push(`${item.id}: expected ${rules.paragraph_count} paragraphs, got ${count}`);
      }
    }

    // These are explicitly selected fixture spans, not a Markdown parser.
    for (const literal of [...(rules.verbatim ?? []), ...(rules.ordered_verbatim ?? [])]) {
      const beforeCount = item.input.split(literal).length - 1;
      const afterCount = output.split(literal).length - 1;
      if (beforeCount !== afterCount) {
        errors.push(`${item.id}: protected span changed: ${JSON.stringify(literal)}`);
      }
    }
    let position = 0;
    for (const literal of rules.ordered_verbatim ?? []) {
      const index = output.indexOf(literal, position);
      if (index < 0) {
        errors.push(`${item.id}: protected span missing or out of order: ${JSON.stringify(literal)}`);
        break;
      }
      position = index + literal.length;
    }
  }

  return { errors, manual_review_required: true };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) {
    console.error("Usage: node scripts/check-preservation.mjs /absolute/path/outputs.json");
    process.exitCode = 2;
  } else {
    const cases = JSON.parse(readFileSync(join(root, "tests/cases.json"), "utf8"));
    const checklist = JSON.parse(readFileSync(join(root, "tests/review-checklist.json"), "utf8"));
    const outputs = JSON.parse(readFileSync(resolve(process.argv[2]), "utf8"));
    const result = checkOutputs(cases, checklist, outputs);
    console.log(JSON.stringify({
      ...result,
      cases_checked: cases.length,
      mechanical_checks_passed: result.errors.length === 0,
    }, null, 2));
    if (result.errors.length > 0) process.exitCode = 1;
  }
}
