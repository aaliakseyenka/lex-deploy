const https = require('https');

exports.fetch = function(url) {
  return new Promise((resolve, reject) => {
    const onError = error => {
      reject(error.message);
    };

    const request = https.get(url, response => {
      const data = [];
      if (response.statusCode !== 200) {
        reject(`error occured while downloading file, error code: ${response.statusCode}`);
      }

      response.on('data', function(chunk) {
        data.push(chunk);
      });

      response.on('end', function() {
        resolve(data);
      });
    });

    request.on('error', onError);
  });
};
