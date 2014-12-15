var path = require('path');
var nconf = require('nconf');

// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

// Then load configuration from a designated file.
nconf.file({ file: 'config.json' });

// Provide default values for settings not provided above.
nconf.defaults({
  "log_format": "dev",
  "engine": {
    "disableNacl": true
  },
  "supervisor": {
    // How many machines should be kept available at all times
    "minAvailableMachines": 1,

    // What is the maximum duration within which a machine must check in or be
    // considered defunct.
    "checkinTimeout": 5000,

    // What is the maximum duration within which a machine must check in after
    // launch or be considered defunct.
    "launchTimeout": 120000,

    // The virtual machine image to use for contract machines.
    "image": "ami-d8caabb0",

    // The virtual machine flavor for contract machines.
    "flavor": "m1.small",

    "bootstrapFiles": [{
      "source": path.resolve(__dirname, '../scripts/provision.sh'),
      "target": "/home/ubuntu/provision.sh"
    }],
    "bootstrapCommands": [
      "./provision.sh"
    ]
  },
  "ssl": {
    "cert": path.resolve(__dirname, '../server.crt'),
    "key": path.resolve(__dirname, '../server.key')
  }
});

if (nconf.get('NODE_ENV') === 'fig') {
  // nconf doesn't support multiple layers of defaults
  // https://github.com/flatiron/nconf/issues/81
  nconf.add('db_defaults', {'type': 'literal',
    // Port for incoming TLS (e.g. HTTPS) connections
    "port":         process.env.PORT || 2633,
    "db": {
      "client": 'pg',
      "connection": {
        "host":     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_ADDR,
        "port":     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_PORT,
        "database": 'docker',
        "user":     'docker',
        "password": 'docker'
      },
      "pool": {
        "min": 2,
        "max": 10
      }
    },
    "pkgcloud": {
      "provider": 'amazon',
      "keyId": process.env.AWS_ACCESS_KEY_ID,
      "key": process.env.AWS_SECRET_KEY,
      "region": process.env.AWS_REGION || 'us-east-1'
    },
    "bootstrapper": {
      "keys": [
        path.resolve(__dirname, '../id_rsa'),
        path.resolve(__dirname, '../id_rsa.pub')
      ],
      "remoteUser": "ubuntu"
    }
  });
} else if (nconf.get('NODE_ENV') === 'beanstalk') {
  // nconf doesn't support multiple layers of defaults
  // https://github.com/flatiron/nconf/issues/81
  nconf.add('db_defaults', {'type': 'literal',
    "port":         process.env.CODIUS_PORT || process.env.PORT || 443,
    "db": {
      "client": "pg",
      "connection": {
        "host":     process.env.RDS_HOSTNAME,
        "port":     process.env.RDS_PORT,
        "database": process.env.RDS_DB_NAME,
        "user":     process.env.RDS_USERNAME,
        "password": process.env.RDS_PASSWORD
      },
      "pool": {
        "min": 2,
        "max": 10
      }
    },
    "ssl": {
      "ca": path.resolve(__dirname, '../ca.crt'),
      "cert": path.resolve(__dirname, '../server.crt'),
      "key": path.resolve(__dirname, '../server.key')
    }
  });
} else {
  nconf.add('db_defaults', {'type': 'literal',
    // Port for incoming TLS (e.g. HTTPS) connections
    'port': 2633,
    'db': {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3'
      }
    },
    "bootstrapper": {
      "keys": [
        "~/.ssh/id_rsa",
        "~/.ssh/id_rsa.pub"
      ],
      "remoteUser": "ubuntu"
    }
  });
}

module.exports = nconf;
