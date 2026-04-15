const { startBackend } = require("./backend");

async function runStartup() {
  return startBackend();
}

module.exports = {
  runStartup,
};
