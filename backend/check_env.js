
import { env } from "./src/config/env.js";

console.log("Checking loaded environment...");
console.log(`PORT: ${env.PORT}`);
console.log(`NODE_ENV: ${env.NODE_ENV}`);
console.log(`PASSWORD_SALT_ROUNDS: ${env.PASSWORD_SALT_ROUNDS}`);
console.log(`PASSWORD_PEPPER length: ${env.PASSWORD_PEPPER?.length}`);
console.log(`DATABASE_URL starts with: ${env.DATABASE_URL?.substring(0, 10)}...`);
