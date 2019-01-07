#!/usr/bin/env node

const yargs = require('yargs')
  .usage('Usage: $0 <cmd> [options]')
  .command('export', 'exports published version to Lex or Alexa models')
  .command('deploy', 'updates your bot aws schema and publishes it to alias if it is specified')
  .command('publish', 'publishes bot to alias with specified version. if version is not specified $LATEST is used')
  .demandCommand(1, 1, 'must provide a valid command', 'only one command allowed'),
  argv = yargs.argv,
  command = argv._[0];

const { exportBot, deployBot, publishBot } = require('../lib');

if (command === 'export') {
  yargs.reset()
    .usage('$0 export [options]')
    .help('h')
    .option('botName', {
      description: 'name of the bot to export',
    })
    .option('botVersion', {
      description: 'version of the bot to export'
    })
    .option('exportType', {
      description: 'the export type: lex or alexa',
    })
    .option('exportFilePath', {
      description: 'path where to export file'
    })
    .demandOption('botName')
    .example('$0 export --botName BotName', 'expots bot with name BotName')
    .argv;
  const {
    botName,
    botVersion,
    exportType,
    exportFilePath
  } = argv;
  exportBot({
    botName,
    version: botVersion,
    exportType,
    exportFilePath
  });
} else if (command === 'deploy') {
  yargs.reset()
    .help('h')
    .option('schemaPath', {
      description: 'path to schema file of the bot to deploy',
    })
    .option('alias', {
      description: 'name of the alias to be published'
    })
    .demandOption('schemaPath')
    .example('$0 deploy --schemaPath ./BotName_Export.json', ' deploys bot by schema')
    .argv;
  const {
    schemaPath,
    alias,
  } = argv;
  deployBot({ schemaPath, alias });
} else if (command === 'publish') {
  yargs.reset()
    .help('h')
    .option('botName', {
      description: 'bot name to publish',
    })
    .option('alias', {
      description: 'name of the alias to be published'
    })
    .option('version', {
      description: 'version to be published. If not specified, $Latest will be used'
    })
    .demandOption(['botName', 'alias'])
    .example('$0 publish --botName BotName --alias prod', 'publishes BotName to prod alias')
    .argv;
  const {
    botName,
    alias,
    version,
  } = argv;
    publishBot({ botName, alias, version });
} else {
  yargs.showHelp();
}
