import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Render a prompt from the markdown template, replacing {{placeholders}} with values.
 * @param {Object} values - { subject, style, lighting, mood, resolution }
 * @returns {string} The rendered prompt
 */
export function renderPromptFromTemplate(values = {}) {
  const templatePath = path.join(__dirname, "./prompt-template.md");
  let template = fs.readFileSync(templatePath, "utf-8");
  for (const key of Object.keys(values)) {
    template = template.replace(new RegExp(`{{${key}}}`, "g"), values[key] || "");
  }
  return template;
}
