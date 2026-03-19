import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const projectRoot = process.cwd();
const envExamplePath = path.join(projectRoot, ".env.example");
const envLocalPath = path.join(projectRoot, ".env.local");

function parseEnv(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    map.set(key, value);
  }

  return map;
}

function toEnvFile(envMap) {
  return Array.from(envMap.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("\n") + "\n";
}

function generateJwtSecret() {
  return crypto.randomBytes(48).toString("hex");
}

function main() {
  if (!fs.existsSync(envExamplePath)) {
    console.error("❌ .env.example not found. Cannot run setup.");
    process.exit(1);
  }

  const exampleContent = fs.readFileSync(envExamplePath, "utf8");
  const exampleMap = parseEnv(exampleContent);

  if (!fs.existsSync(envLocalPath)) {
    const freshMap = new Map(exampleMap);
    freshMap.set("JWT_SECRET", generateJwtSecret());
    fs.writeFileSync(envLocalPath, toEnvFile(freshMap), "utf8");
    console.log("✅ Created .env.local from .env.example");
    console.log("✅ Generated a secure JWT_SECRET");
    console.log("ℹ️  Update MONGODB_URI if you are using MongoDB Atlas.");
    return;
  }

  const localContent = fs.readFileSync(envLocalPath, "utf8");
  const localMap = parseEnv(localContent);

  for (const [key, value] of exampleMap.entries()) {
    if (!localMap.has(key)) {
      localMap.set(key, value);
    }
  }

  const jwt = localMap.get("JWT_SECRET") ?? "";
  if (!jwt || jwt === "replace_with_a_long_random_secret") {
    localMap.set("JWT_SECRET", generateJwtSecret());
    console.log("✅ Updated JWT_SECRET with a secure generated value.");
  }

  fs.writeFileSync(envLocalPath, toEnvFile(localMap), "utf8");
  console.log("✅ .env.local is ready.");
  console.log("ℹ️  Next run: npm run db:check");
}

main();
