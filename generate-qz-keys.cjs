const forge = require('node-forge');
const fs = require('fs');

console.log('Generating 2048-bit key-pair...');
const keys = forge.pki.rsa.generateKeyPair(2048);
console.log('Key-pair created.');

console.log('Creating self-signed certificate...');
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10); // Valid for 10 years
const attrs = [{
  name: 'commonName',
  value: 'localhost'
}, {
  name: 'countryName',
  value: 'US'
}, {
  shortName: 'ST',
  value: 'State'
}, {
  name: 'localityName',
  value: 'City'
}, {
  name: 'organizationName',
  value: 'My Company'
}, {
  shortName: 'OU',
  value: 'My Org Unit'
}];
cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.setExtensions([{
  name: 'basicConstraints',
  cA: true
}, {
  name: 'keyUsage',
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true
}]);

// self-sign certificate
cert.sign(keys.privateKey, forge.md.sha256.create());
console.log('Certificate created.');

const pemCert = forge.pki.certificateToPem(cert);
const pemKey = forge.pki.privateKeyToPem(keys.privateKey);

fs.writeFileSync('src/services/qz-private-key.js', 'export const privateKey = `' + pemKey + '`;\n');
fs.writeFileSync('src/services/qz-certificate.js', 'export const certificate = `' + pemCert + '`;\n');
fs.writeFileSync('digital-certificate.txt', pemCert);

console.log('Files generated successfully!');
