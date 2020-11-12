const fs = require("fs");

const devConfig = "./.env.development";
const prodConfig = "./.env.production";
const testConfig = "./.env.test";

// Generate empty development and production environment files is not exist
if (!fs.existsSync(devConfig)) {
  fs.createWriteStream(devConfig, "utf-8").write("");
}

if (!fs.existsSync(prodConfig)) {
  fs.createWriteStream(prodConfig, "utf-8").write("");
}
if (!fs.existsSync(testConfig)) {
  fs.createWriteStream(testConfig, "utf-8").write("");
}
