#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const usage = [
  "Usage:",
  "  node scripts/cliche-log.mjs init [--file path]",
  "  node scripts/cliche-log.mjs add --pattern text --family text --action text [--source text] [--file path]",
  "  node scripts/cliche-log.mjs list [--min-count number] [--file path]",
].join("\n");

function fail(message) {
  console.error(message);
  console.error(usage);
  process.exit(1);
}

function parseOptions(tokens) {
  const options = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      fail("Unexpected argument: " + token);
    }

    const key = token.slice(2);
    const value = tokens[index + 1];
    if (!value || value.startsWith("--")) {
      fail("Missing value for --" + key);
    }

    options[key] = value;
    index += 1;
  }

  return options;
}

function dataPath(options) {
  return resolve(
    options.file ||
      process.env.QU_AI_WEI_CLICHE_LOG ||
      join(homedir(), ".qu-ai-wei", "ai-cliche-candidates.json"),
  );
}

function emptyStore() {
  return {
    version: 1,
    items: [],
  };
}

function loadStore(filePath) {
  if (!existsSync(filePath)) {
    return emptyStore();
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail("Cannot parse candidate log: " + error.message);
  }

  if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
    fail("Unsupported candidate log format: " + filePath);
  }

  return parsed;
}

function saveStore(filePath, store) {
  mkdirSync(dirname(filePath), { recursive: true });
  const tempPath = filePath + ".tmp-" + process.pid;
  writeFileSync(tempPath, JSON.stringify(store, null, 2) + "\n", "utf8");
  renameSync(tempPath, filePath);
}

function normalizeText(value, label) {
  const text = String(value || "").normalize("NFKC").trim();

  if (!text) {
    fail("Missing required option --" + label);
  }
  if (text.includes("\n") || text.includes("\r")) {
    fail("--" + label + " must fit on one line");
  }
  if (text.length > 120) {
    fail("--" + label + " must be 120 characters or fewer");
  }
  if (/https?:\/\//u.test(text)) {
    fail("--" + label + " must not contain a URL");
  }

  return text;
}

function patternKey(pattern) {
  return pattern
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s，。！？；：、"'“”‘’（）()【】\[\]…—_-]+/gu, "");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function init(filePath) {
  const created = !existsSync(filePath);
  if (created) {
    saveStore(filePath, emptyStore());
  }
  console.log(
    JSON.stringify({ ok: true, file: filePath, created }, null, 2),
  );
}

function add(filePath, options) {
  const pattern = normalizeText(options.pattern, "pattern");
  const family = normalizeText(options.family, "family");
  const action = normalizeText(options.action, "action");
  const source = options.source
    ? normalizeText(options.source, "source")
    : "unspecified";
  const key = patternKey(pattern);

  if (key.length < 4) {
    fail("--pattern is too short after normalization");
  }

  const store = loadStore(filePath);
  const date = today();
  let item = store.items.find((candidate) => candidate.key === key);

  if (item) {
    item.count += 1;
    item.last_seen = date;
    item.family = family;
    item.action = action;
    item.sources = Array.from(new Set([...(item.sources || []), source])).slice(
      -10,
    );
  } else {
    item = {
      key,
      pattern,
      family,
      action,
      count: 1,
      status: "candidate",
      first_seen: date,
      last_seen: date,
      sources: [source],
    };
    store.items.push(item);
  }

  store.items.sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return left.pattern.localeCompare(right.pattern, "zh-CN");
  });

  saveStore(filePath, store);
  console.log(
    JSON.stringify(
      {
        ok: true,
        file: filePath,
        pattern: item.pattern,
        count: item.count,
        ready_for_review: item.count >= 3,
      },
      null,
      2,
    ),
  );
}

function list(filePath, options) {
  const minimum = Number.parseInt(options["min-count"] || "1", 10);
  if (!Number.isInteger(minimum) || minimum < 1) {
    fail("--min-count must be a positive integer");
  }

  const store = loadStore(filePath);
  const items = store.items.filter((item) => item.count >= minimum);
  console.log(
    JSON.stringify(
      {
        file: filePath,
        minimum_count: minimum,
        total: items.length,
        items,
      },
      null,
      2,
    ),
  );
}

const [command, ...tokens] = process.argv.slice(2);
if (!command || command === "--help" || command === "-h") {
  console.log(usage);
  process.exit(command ? 0 : 1);
}

const options = parseOptions(tokens);
const filePath = dataPath(options);

if (command === "init") {
  init(filePath);
} else if (command === "add") {
  add(filePath, options);
} else if (command === "list") {
  list(filePath, options);
} else {
  fail("Unknown command: " + command);
}
