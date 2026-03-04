#!/usr/bin/env node
/**
 * Generates app version from package.json + git.
 * Format: 1.0.0 or 1.0.0+abc1234 (if git available)
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
const base = pkg.version;

let suffix = "";
try {
  const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim() ? "-dirty" : "";
  suffix = `+${hash}${dirty}`;
} catch (_) {}

console.log(`v${base}${suffix}`);
