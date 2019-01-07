const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({});

function addIntentLambdaPermission({ lambdaArn, intentName, botName, accountId }) {
  const params = {
    Action: 'lambda:invokeFunction',
    FunctionName: lambdaArn,
    Principal: 'lex.amazonaws.com',
    SourceArn: `arn:aws:lex:${AWS.config.region}:${accountId}:intent:${intentName}:*`,
    StatementId: `bot-${botName}-intent-${intentName}-lambda`,
  };
  return lambda.addPermission(params).promise();
}

module.exports = {
  addIntentLambdaPermission,
};
