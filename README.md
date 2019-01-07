## Lex-deploy
The tool for management of Lex bot deploy, publish and export via command line interface using Lex Platform model. Store all your Lex configuration in a single json file and deploy easily in CI.

## Installation

```bash
npm install lex-deploy
```

## API

# Commands
- **export**  - exports published version
- **deploy**  - updates your bot aws schema and publishes it to alias if it is specified
- **publish**  - publishes bot to alias with specified version

For options use `help` command

## Examples

Exports bot `NameOfTheBot` of version `2` to Lex model to file NameOfTheBot_Export.json
```console
lex-deploy export --botName NameOfTheBot --botVersion 2 --exportType LEX --exportFilePath ./NameOfTheBot_Export.json
```

Publishes `NameOfTheBot` version `2` to alias `prod`
```console
lex-deploy publish --botName NameOfTheBot --botVersion 2 --alias prod
```

Deploys bot with schema(NameOfTheBot_Export.json) to alias `prod`
```console
lex-deploy deploy --schemaPath ./NameOfTheBot_Export.json --alias prod
```


## AWS setup
To setup aws variables please use [environment variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) defined by aws
