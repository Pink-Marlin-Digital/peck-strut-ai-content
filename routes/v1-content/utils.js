// Shared utilities for V1 content routes
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPT_TEMPLATES_BASE_PATH = path.join(__dirname, "../../prompt-templates");

/**
 * Check if intellectual property folder exists
 * @param {string} id - The intellectual property ID
 * @returns {boolean} - Whether the folder exists
 */
export function checkIpExists(id) {
  const ipPath = path.join(PROMPT_TEMPLATES_BASE_PATH, id);
  return fs.existsSync(ipPath);
}

/**
 * Render a prompt from template with simple placeholder replacement
 * @param {string} id - The intellectual property ID
 * @param {string} templateName - The template name
 * @param {Object} values - Values to replace in template
 * @returns {string} - Rendered prompt
 */
export function renderPromptFromTemplate(id, templateName, values = {}) {
  const templatePath = path.join(PROMPT_TEMPLATES_BASE_PATH, id, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found for IP ${id}`);
  }
  let template = fs.readFileSync(templatePath, "utf-8");
  for (const key of Object.keys(values)) {
    template = template.replace(new RegExp(`{{${key}}}`, "g"), values[key] || "");
  }
  return template;
}
