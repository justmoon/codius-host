
var config = require('./config');

var Bootstrapper = require('./server/bootstrapper').Bootstrapper;

module.exports = new Bootstrapper(config.get('bootstrapper'));
