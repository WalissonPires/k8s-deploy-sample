#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// ---- Helpers ----
function toBase64(value) {
  if (value.startsWith("base64:")) {
    return value.replace("base64:", "");
  }
  return Buffer.from(value, "utf8").toString("base64");
}

// ---- Main ----
if (process.argv.length < 4) {
  console.error("Uso: node generate-sealed-secrets.js <.env file> <output.yaml>");
  process.exit(1);
}

const envFile = process.argv[2];
const outputFile = process.argv[3];

if (!fs.existsSync(envFile)) {
  console.error(`Arquivo .env não encontrado: ${envFile}`);
  process.exit(1);
}

const lines = fs.readFileSync(envFile, "utf-8").split("\n");

let name = null;
let namespace = "default";
const data = {};

// Parse .env
for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith("#") === false && !line.includes("=")) continue;

  if (line.startsWith("#name:")) {
    name = line.replace("#name:", "").trim();
  } else if (line.startsWith("#namespace:")) {
    namespace = line.replace("#namespace:", "").trim();
  } else if (!line.startsWith("#")) {
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    data[key.trim()] = toBase64(value);
  }
}

if (!name) {
  console.error("Erro: defina #name no arquivo .env");
  process.exit(1);
}

// Cria Secret temporário
const tempSecretFile = path.join(__dirname, "secret-temp.yaml");
const secretYaml = [
  "apiVersion: v1",
  "kind: Secret",
  "metadata:",
  `  name: ${name}`,
  `  namespace: ${namespace}`,
  "type: Opaque",
  "data:",
  ...Object.entries(data).map(([k, v]) => `  ${k}: ${v}`)
].join("\n");

fs.writeFileSync(tempSecretFile, secretYaml);

// Executa kubeseal
try {
  const sealed = execSync(
    `kubeseal --format yaml < ${tempSecretFile}`,
    { encoding: "utf-8" }
  );
  fs.writeFileSync(outputFile, sealed);
  console.log(`✅ SealedSecret gerado em: ${outputFile}`);
} catch (err) {
  console.error("Erro ao executar kubeseal:", err.message);
  process.exit(1);
} finally {
  fs.unlinkSync(tempSecretFile);
}