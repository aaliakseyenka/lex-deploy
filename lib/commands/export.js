const fs = require('fs');
const { getBotExport, getBotVersions } = require('../aws/lexBuild');
const log = require('../logger');
const { fetch } = require('../http');
const { unzipFile } = require('../zip');

async function exportBot({ botName, version, exportType = 'ALEXA_SKILLS_KIT', exportFilePath = './export.json' }) {
  if (!botName) {
    throw new Error('exportBot: name is required');
  }

  if (!version) {
    version = await getLatestVersion(botName);
  }

  const botExport = await getBotExport({
    name: botName,
    version,
    exportType,
  });
  if (botExport.exportStatus === 'FAILED') {
    throw new Error(botExport.failureReason);
  } else {
    const binaryArray = await fetch(botExport.url);
    await unzipExportFile(botName, binaryArray, exportFilePath);
    log.info(`export bot complete to: ${exportFilePath}`);
  }
}

async function getLatestVersion(name) {
  log.info('export bot version not specified: getting the latest');
  const { bots } = await getBotVersions(name);
  if (bots.length < 2) {
    throw new Error(`Bot ${name} doesn't have any versions. To export, publish a version of your bot first`);
  }
  const version = bots[bots.length - 1].version;
  log.info(`export bot version: ${version}`);
  return version;
}

async function unzipExportFile(name, binaryArray, destination) {
  const content = await unzipFile(`${name}_Export.json`, binaryArray);
  const json = JSON.parse(content);
  fs.writeFileSync(destination, JSON.stringify(json, null, 2));
}

exports.exportBot = exportBot;
