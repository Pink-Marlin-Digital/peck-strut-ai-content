// Loads .env.test for all tests
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("***SETTING UP TEST ENVIRONMENT***");
config({ path: path.resolve(__dirname, "../.env.test") });
