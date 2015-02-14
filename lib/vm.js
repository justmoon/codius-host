var _ = require('lodash');
var AWS = require('aws-sdk');
var path = require('path');
var fs = require('fs');

var ec2 = new AWS.EC2({region: 'us-west-1'});

var cloudConfigTemplatePath = path.join(__dirname, '../compute-service/templates/cloud_config.yml');
var cloudConfigTemplate = _.template(fs.readFileSync(cloudConfigTemplatePath));

var VM = function (container_uri) {
  this._container_uri = container_uri;
};

VM.prototype.start = function (container_uri) {
  var userData = cloudConfigTemplate({
    container_uri: this._container_uri
  });

  var params = {
    ImageId: 'ami-24b5ad61',
    InstanceType: 't2.small',
    MinCount: 1, MaxCount: 1,
    UserData: new Buffer(userData).toString('base64'),
    KeyName: 'stefan-norcal'
  };

  console.log('starting ec2 instance', params);
  ec2.runInstances(params, function(err, data) {
    console.log(err, data);
  });
};

exports.VM = VM;
