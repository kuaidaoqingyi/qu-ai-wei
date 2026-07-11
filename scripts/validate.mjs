#!/usr/bin/env node

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "SKILL.md",
  "agents/openai.yaml",
  "references/ai-bingzao.md",
  "references/ai-cliche-library.md",
  "references/broadcast-style.md",
  "references/kuaidao-voice.md",
  "scripts/cliche-log.mjs",
];

const generationFiles = [
  "SKILL.md",
  "references/broadcast-style.md",
  "references/kuaidao-voice.md",
];

const forbiddenPatterns = [
  ["negative-pivot", /不是[^。\n]{0,40}而是/u],
  ["upgrade-pivot", /不只是[^。\n]{0,40}更是/u],
  ["double-upgrade", /不仅[^。\n]{0,40}(?:而且|更是)/u],
  ["question-pivot", /不要先[^。\n]{0,40}而要/u],
  ["surface-reveal", /表面上[^。\n]{0,40}背后其实/u],
  ["looks-like", /看起来像[^。\n]{0,40}但更像/u],
  ["two-lenses", /如果只看[^。\n]{0,40}但如果/u],
  ["former-latter", /前者[^。\n]{0,40}后者/u],
];

const markerChecks = [
  ["SKILL.md", "信息增量"],
  ["SKILL.md", "推断强度"],
  ["SKILL.md", "新增信息红线"],
  ["SKILL.md", "对照模式"],
  ["SKILL.md", "套话候选持续收集"],
  ["references/ai-bingzao.md", "信息复读"],
  ["references/broadcast-style.md", "结尾四选一"],
  ["references/kuaidao-voice.md", "段落跟着思路单元走"],
  ["references/ai-cliche-library.md", "只用于识别"],
];

const failures = [];

for (const relativePath of requiredFiles) {
  if (!existsSync(join(root, relativePath))) {
    failures.push("Missing required file: " + relativePath);
  }
}

const skillText = readFileSync(join(root, "SKILL.md"), "utf8");
const frontmatterMatch = skillText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/u);
if (!frontmatterMatch) {
  failures.push("SKILL.md has invalid frontmatter boundaries");
} else {
  const fields = frontmatterMatch[1]
    .split(/\r?\n/u)
    .filter((line) => line.trim())
    .map((line) => line.split(":", 1)[0].trim());
  const unexpected = fields.filter(
    (field) => field !== "name" && field !== "description",
  );
  if (!frontmatterMatch[1].includes("name: qu-ai-wei")) {
    failures.push("SKILL.md frontmatter has the wrong name");
  }
  if (!frontmatterMatch[1].includes("description:")) {
    failures.push("SKILL.md frontmatter is missing description");
  }
  if (unexpected.length > 0) {
    failures.push(
      "SKILL.md frontmatter contains unsupported fields: " +
        unexpected.join(", "),
    );
  }
}

for (const relativePath of generationFiles) {
  const content = readFileSync(join(root, relativePath), "utf8");
  const lines = content.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    for (const [label, pattern] of forbiddenPatterns) {
      if (pattern.test(lines[index])) {
        failures.push(
          relativePath +
            ":" +
            (index + 1) +
            " contains forbidden output pattern " +
            label,
        );
      }
    }
  }
}

for (const [relativePath, marker] of markerChecks) {
  const content = readFileSync(join(root, relativePath), "utf8");
  if (!content.includes(marker)) {
    failures.push(relativePath + " is missing marker: " + marker);
  }
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "qu-ai-wei-"));
try {
  const logPath = join(temporaryDirectory, "candidates.json");
  const collector = join(root, "scripts/cliche-log.mjs");
  const baseArgs = [
    collector,
    "add",
    "--pattern",
    "随着____不断发展",
    "--family",
    "宏大开场",
    "--action",
    "删除空背景",
    "--source",
    "validation",
    "--file",
    logPath,
  ];

  for (let count = 0; count < 2; count += 1) {
    const result = spawnSync(process.execPath, baseArgs, {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(
        "cliche-log add failed: " + (result.stderr || result.stdout).trim(),
      );
      break;
    }
  }

  if (existsSync(logPath)) {
    const store = JSON.parse(readFileSync(logPath, "utf8"));
    if (store.items.length !== 1 || store.items[0].count !== 2) {
      failures.push("cliche-log did not deduplicate and increment correctly");
    }
  } else {
    failures.push("cliche-log did not create its data file");
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  "Validation passed: required files, output-pattern guard, markers, and cliche collector.",
);
