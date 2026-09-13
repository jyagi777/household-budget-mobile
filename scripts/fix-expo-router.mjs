import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const buildRoot = join(root, "node_modules", "expo-router", "build");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

if (existsSync(buildRoot)) {
  const jsCandidates = new Set();
  const typeCandidates = new Set();
  for (const file of walk(buildRoot)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/require\(["']\.\/([^"']+)["']\)/g)) {
      jsCandidates.add(join(dirname(file), match[1]));
    }
    for (const match of source.matchAll(/from ["']\.\/([^"']+)["']/g)) {
      typeCandidates.add(join(dirname(file), match[1]));
    }
  }

  for (const candidate of jsCandidates) {
    const flatFile = `${candidate}.js`;
    const directoryIndex = join(candidate, "index.js");
    if (!existsSync(flatFile) && existsSync(directoryIndex)) {
      writeFileSync(flatFile, `module.exports = require("./${relative(dirname(flatFile), directoryIndex).replace(/\\/g, "/")}");\n`);
      console.log(`Added Expo Router compatibility shim: ${relative(root, flatFile)}`);
    }
  }

  for (const candidate of typeCandidates) {
    const flatFile = `${candidate}.d.ts`;
    const directoryIndex = join(candidate, "index.d.ts");
    if (!existsSync(flatFile) && existsSync(directoryIndex)) {
      writeFileSync(flatFile, `export * from "./${relative(dirname(flatFile), directoryIndex).replace(/\\/g, "/").replace(/\.d\.ts$/, "")}";\n`);
      console.log(`Added Expo Router type shim: ${relative(root, flatFile)}`);
    }
  }
}
