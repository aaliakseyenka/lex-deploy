const fs = require('fs');
const { addIntentLambdaPermission } = require('../aws/lambda');
const {
  importBot,
  putBot,
  createBotVersion,
  createIntentVersion,
  getIntent,
  getBotAlias,
  createBotAlias,
  waitForAliasVersion,
  waitForReadyStatus,
} = require('../aws/lexBuild');
const { zipFile } = require('../zip');
const log = require('../logger');

function zipSchema(schemaContent) {
  return zipFile('import.json', schemaContent);
}

function readSchema(schemaPath) {
  const schemaContent = fs.readFileSync(schemaPath);
  return JSON.parse(schemaContent);
}

async function incrementIntentVersion(intent) {
  const { name } = intent;
  const intentResponse = await getIntent(name);
  const versionResponse = await createIntentVersion(name, intentResponse.checksum);
  return {
    intentName: name,
    intentVersion: versionResponse.version,
  };
}

async function updateIntentsVersion(schema) {
  const intents = [];
  for (const intent of schema.resource.intents) {
    intents.push(await incrementIntentVersion(intent));
  }
  return intents;
}

async function addBotLambdasPermission(schema) {
  const intentArnsMap = getLambdaArns(schema);
  const accountId = getAccountId(intentArnsMap);
  if (!accountId) {
    return;
  }

  for (const [intentName, lambdas] of intentArnsMap) {
    for (const lambdaArn of lambdas) {
      try {
        await addIntentLambdaPermission({
          lambdaArn,
          intentName,
          botName: schema.resource.name,
          accountId,
        });
      } catch (e) {
        if (e.code === 'ResourceConflictException') {
          log.debug('permission is already granted. skip');
        } else {
          log.error(`couldn\'t add invoke permission to lambda - ${lambdaArn} for intent - ${intentName}`);
          process.exit(1);
        }
      }
    }
  }
}

function getAccountId(intentArnsMap) {
  if (intentArnsMap.size > 0) {
    const [intent] = intentArnsMap.values();
    const [arn = ''] = intent.values();
    const [, , , , accountId] = arn.split(':');
    return accountId;
  }
}

function getLambdaArns(schema) {
  const map = new Map();
  schema.resource.intents.forEach(intent => {
    if (!map.has(intent.name)) {
      map.set(intent.name, new Set());
    }
    const set = map.get(intent.name);
    if (intent.dialogCodeHook) {
      set.add(intent.dialogCodeHook.uri);
    }
    const fulfillmentActivity = intent.fulfillmentActivity;
    if (fulfillmentActivity && fulfillmentActivity.type === 'CodeHook') {
      set.add(fulfillmentActivity.codeHook.uri);
    }
  });
  return map;
}

async function updateBot(schema, intents) {
  const botName = schema.resource.name;
  log.debug('wait for ready status');
  const currentBot = await waitForReadyStatus({ name: botName, isBuilding: false });
  const { checksum } = currentBot;
  log.debug('wait for put bot');
  await putBot(schema, intents, checksum);
  log.debug('wait for ready status');
  const newBot = await waitForReadyStatus({ name: botName, isBuilding: true });
  log.debug('create bot version');
  const versionResponse = await createBotVersion(botName, newBot.checksum);
  log.info(`bot version created: ${versionResponse.version}`);
  await waitForReadyStatus({ name: botName, isBuilding: true });

  return versionResponse;
}

function getSchema({ schemaPath, schema }) {
  if (!(schemaPath || schema)) {
    throw new Error('deployBot: schema path or schema is required');
  }
  return schemaPath ? readSchema(schemaPath) : schema;
}

async function deployBot(args) {
  const { alias } = args;
  const schema = getSchema(args);
  log.info('adding permission to lambda to allow bot invoke it');
  await addBotLambdasPermission(schema);

  log.info('importing bot');
  const importPayload = await zipSchema(JSON.stringify(schema));
  await importBot(importPayload);

  log.info('updating intents');
  const intents = await updateIntentsVersion(schema);

  log.info('building bot');
  const bot = await updateBot(schema, intents);

  if (alias) {
    const botName = schema.resource.name;
    log.info('publishing bot');
    await publishBot({ alias, botName, version: bot.version });
  }
  return {
    version: bot.version,
  };
}

async function publishBot({ alias, botName, version }) {
  let botAlias;

  try {
    botAlias = await getBotAlias(botName, alias);
  } catch (e) {}
  if (!version) {
    const bot = await waitForReadyStatus({ name: botName, isBuilding: false });
    version = bot.version;
  }
  if (botAlias === undefined || version !== botAlias.version) {
    const checksum = botAlias && botAlias.checksum;
    const aliasResponse = await createBotAlias({ alias, botName, botVersion: version, checksum });
    if (botAlias) {
      await waitForAliasVersion({ name: botName, alias, oldVersion: botAlias.version });
    }

    await waitForReadyStatus({ name: botName, versionOrAlias: alias, isBuilding: true });

    log.info('bot is published for alias:' + alias);
  } else {
    log.info('bot is not changed.');
  }
}

module.exports = {
  deployBot,
  publishBot,
};
