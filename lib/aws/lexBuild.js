const AWS = require('aws-sdk');

const lexModel = new AWS.LexModelBuildingService({});

const LATEST = '$LATEST';
const POLL_TIMEOUT = 1500;
const MAX_ATTEMPTS = 60;

async function importBot(payload) {
  const importParams = {
    payload,
    mergeStrategy: 'OVERWRITE_LATEST',
    resourceType: 'BOT',
  };

  let result = await lexModel.startImport(importParams).promise();
  if (result.importStatus !== 'COMPLETE') {
    sleep();
    result = await waitResult(() => getImport(result.importId), 'importStatus', ['IN_PROGRESS'], ['FAILED']);
  }
  return result;
}

function getImport(importId) {
  return lexModel
    .getImport({
      importId,
    })
    .promise();
}

function getBot({ name, versionOrAlias = LATEST, waitField, inProgressValues, failedValues }) {
  const params = { name, versionOrAlias };
  return waitResult(() => lexModel.getBot(params).promise(), waitField, inProgressValues, failedValues);
}

function waitForReadyStatus({ name, versionOrAlias, isBuilding = true }) {
  const inProgressValues = isBuilding ? ['BUILDING', 'NOT_BUILT', 'READY_BASIC_TESTING'] : ['BUILDING'];
  return getBot({ name, versionOrAlias, waitField: 'status', inProgressValues, failedValues: ['FAILED'] });
}

function waitForAliasVersion({ name, versionOrAlias, oldVersion }) {
  return getBot({ name, versionOrAlias, waitField: 'version', inProgressValues: [oldVersion] });
}

function putBot(schema, intents, checksum) {
  const { resource } = schema;
  const { name, locale, abortStatement, clarificationPrompt, childDirected, voiceId } = resource;
  return lexModel
    .putBot({
      name,
      checksum,
      processBehavior: 'BUILD',
      intents,
      locale,
      abortStatement,
      clarificationPrompt,
      childDirected,
      voiceId,
    })
    .promise();
}

function createIntentVersion(name, checksum) {
  return lexModel
    .createIntentVersion({
      name,
      checksum,
    })
    .promise();
}

function createBotVersion(name, checksum) {
  return lexModel
    .createBotVersion({
      name,
      checksum,
    })
    .promise();
}

function getIntent(name) {
  return lexModel
    .getIntent({
      name,
      version: LATEST,
    })
    .promise();
}

function getBotExport({ exportType, name, version }) {
  return lexModel
    .getExport({
      name,
      exportType,
      version: version.toString(),
      resourceType: 'BOT',
    })
    .promise();
}

function getBotVersions(name) {
  return lexModel
    .getBotVersions({
      name,
    })
    .promise();
}

function getBotAlias(botName, alias) {
  return lexModel
    .getBotAlias({
      botName,
      name: alias,
    })
    .promise();
}

function createBotAlias({ alias, botVersion, botName, checksum }) {
  return lexModel
    .putBotAlias({
      name: alias,
      botVersion: botVersion.toString(),
      botName,
      checksum,
    })
    .promise();
}

async function waitResult(op, waitField, inProgressValues, failedValues = [], counter = 0) {
  const result = await op();
  if (counter > MAX_ATTEMPTS) return result;
  if (failedValues.indexOf(result[waitField]) !== -1) return result;
  if (inProgressValues.indexOf(result[waitField]) !== -1) {
    await sleep();
    return await waitResult(op, waitField, inProgressValues, failedValues, ++counter);
  }
  return result;
}

function sleep(ms = POLL_TIMEOUT) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getBotExport,
  getBot,
  getBotVersions,
  importBot,
  createIntentVersion,
  createBotVersion,
  getIntent,
  putBot,
  getBotAlias,
  createBotAlias,
  waitForAliasVersion,
  waitForReadyStatus,
};
