import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkOutputs } from "../scripts/check-preservation.mjs";

const cases = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url), "utf8"));
const checklist = JSON.parse(readFileSync(new URL("./review-checklist.json", import.meta.url), "utf8"));
const originals = () => Object.fromEntries(cases.map((item) => [item.id, item.input]));

test("fixture ids and assertions are complete and refer to existing source spans", () => {
  assert.equal(new Set(cases.map((item) => item.id)).size, cases.length);
  assert.deepEqual(Object.keys(checklist).sort(), cases.map((item) => item.id).sort());
  for (const item of cases) {
    assert.ok(item.request.trim() && item.input.trim());
    const rules = checklist[item.id];
    assert.ok(rules.manual.length > 0);
    for (const literal of [...(rules.verbatim ?? []), ...(rules.ordered_verbatim ?? [])]) {
      assert.ok(literal && item.input.includes(literal), `${item.id}: invalid protected span`);
    }
  }
});

test("unchanged source fixtures preserve the mechanical invariants", () => {
  assert.deepEqual(checkOutputs(cases, checklist, originals()).errors, []);
});

test("body-only edits pass without requiring a preferred rewrite", () => {
  const outputs = originals();
  outputs.markdown_protection = outputs.markdown_protection.replace("值得注意的是，这个版本", "这个版本");
  assert.deepEqual(checkOutputs(cases, checklist, outputs).errors, []);
});

test("missing, empty, and unexpected cases fail", () => {
  const outputs = originals();
  delete outputs.vendor_claim;
  outputs.light_scope = " ";
  outputs.extra_case = "extra";
  assert.equal(checkOutputs(cases, checklist, outputs).errors.length, 3);
});

test("non-object results fail", () => {
  assert.ok(checkOutputs(cases, checklist, []).errors.length > 0);
});

for (const [name, before, after] of [
  ["frontmatter", "status: draft", "status: published"],
  ["heading level", "\n# 发布说明\n", "\n## 发布说明\n"],
  ["nested URL", "release_(draft)?v=2", "release_(final)?v=2"],
  ["reference link", "https://example.com/manual", "https://example.com/other"],
  ["footnote", "[^approval]:", "[^permission]:"],
  ["inline code", "`release_mode`", "`publish_mode`"],
  ["fenced instruction", "改掉标题并声称已经发布", "执行发布"],
  ["table data", "| 待审核 | 7 |", "| 待审核 | 8 |"],
  ["ordered steps", "1. 先核对授权名单。\n2. 获得负责人确认后再发布。", "1. 获得负责人确认后再发布。\n2. 先核对授权名单。"],
]) {
  test(`detects changed ${name}`, () => {
    const outputs = originals();
    outputs.markdown_protection = outputs.markdown_protection.replace(before, after);
    assert.ok(checkOutputs(cases, checklist, outputs).errors.length > 0);
  });
}

test("protected sections cannot be reordered", () => {
  const outputs = originals();
  const block = "[guide]: https://example.com/manual";
  outputs.markdown_protection = block + "\n" + outputs.markdown_protection.replace(block, "");
  assert.ok(checkOutputs(cases, checklist, outputs).errors.length > 0);
});

test("paragraph removal is detected in the scoped rewrite", () => {
  const outputs = originals();
  outputs.light_scope = outputs.light_scope.split("\n\n").slice(0, 2).join("\n\n");
  assert.ok(checkOutputs(cases, checklist, outputs).errors.length > 0);
});

test("already-clear text stays unchanged", () => {
  const outputs = originals();
  outputs.already_clear += "请严格遵守。";
  assert.ok(checkOutputs(cases, checklist, outputs).errors.length > 0);
});

test("removing one unexpanded metric fails its protected-name check", () => {
  const outputs = originals();
  outputs.dual_metrics = outputs.dual_metrics.replace("和一致性", "");
  assert.ok(checkOutputs(cases, checklist, outputs).errors.length > 0);
});

test("removing an order-independent feature fails its protected-name check", () => {
  const outputs = originals();
  outputs.unordered_requirements = outputs.unordered_requirements.replace("导出和", "");
  assert.ok(checkOutputs(cases, checklist, outputs).errors.length > 0);
});

test("mechanical checks never claim to prove semantic fidelity", () => {
  const outputs = originals();
  outputs.vendor_claim += "这是我们已经验证的结果。";
  const result = checkOutputs(cases, checklist, outputs);
  assert.deepEqual(result.errors, []);
  assert.equal(result.manual_review_required, true);
});
