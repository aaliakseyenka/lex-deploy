const JSZip = require('jszip');

async function unzipFile(name, binaryArray) {
  const buffer = Buffer.concat(binaryArray);
  const zip = new JSZip();
  await zip.loadAsync(buffer);
  if (!zip.file(name)) {
    throw new Error(`failed to extract bot export file(${name}) from zip`);
  }
  return await zip.file(name).async('string');
}

async function zipFile(name, content) {
  const zip = new JSZip();
  zip.file(name, content);
  return zip.generateAsync({ type: 'nodebuffer' });
}

module.exports = {
  unzipFile,
  zipFile,
};
