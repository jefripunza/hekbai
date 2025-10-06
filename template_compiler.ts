import fs from "fs";
import path from "path";

// list semua file yang ada di template
const templatePath = path.join(__dirname, "template");
const templateList = fs.readdirSync(templatePath);

interface ITemplate {
  [template_name: string]: string; // content is base64
}

const templates: ITemplate = {};

// loop semua file di template
for (const template of templateList) {
  const templateFilePath = path.join(templatePath, template);
  const templateContent = fs.readFileSync(templateFilePath, "base64");
  templates[template.replace(".html", "")] = templateContent;
}

// simpan ke file template_compiled.ts

const templateCompiled = `export const templates = ${JSON.stringify(
  templates
)}`;

fs.writeFileSync(
  path.join(__dirname, "template_compiled.ts"),
  templateCompiled
);
