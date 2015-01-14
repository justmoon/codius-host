var config = require('./config');

var backendConfig = config.get('backend');
if ("object" !== typeof backendConfig) {
  throw new Error("You must configure the backend, please check the documentation for assistance.");
}

var type = backendConfig.type;
if ("string" !== typeof type) {
  throw new Error("Backend setting must have a 'type' field containing a string with the backend module name.");
}

var Backend;
try {
  Backend = require('codius-host-backend-'+type)
} catch (err) {
  console.log(err);
  return;
}

exports.backend = new Backend(backendConfig);
