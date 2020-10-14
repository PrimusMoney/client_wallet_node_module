var MobileConfig = require('./mobile-config.js');

MobileConfig.xtraconfigmodule_activate = null; // put false to explicitly deactivate module
MobileConfig.xtraconfigmodule_ethnode_activate = null;
MobileConfig.xtraconfigmodule_storage_activate = null;

MobileConfig.authkeymodule_activate = null; // put false to explicitly deactivate module

MobileConfig.oauth2module_activate = null;


MobileConfig.initdev = null; // put true to explicitly run initdev at launch
MobileConfig.echotestdev = null; // put true to explicitly run echotestdev

// uncomment this to overload production default_remote_network_config in dev
/*MobileConfig.default_remote_network_config = {
		name: 'DEV blank network config',
		uuid: '4f5dfe3c-37d5-16c2-ff2c-eca629145cc2',
		restserver: {
			activate: false,
			rest_server_url: null,
			rest_server_api_path: null
		},
		authserver: {
			activate: true,
			rest_server_url: null,
			rest_server_api_path: null
		},
		keyserver: {
			activate: true,
			rest_server_url: null,
			rest_server_api_path: null
		}
};*/

MobileConfig.testvaults = [
];

MobileConfig.testnetworks = [
];



MobileConfig.testusers = [
];

MobileConfig.testtransactions = [
];

MobileConfig.testtokens = [
];


MobileConfig.testaccounts = [
];

//
// wallets
//
MobileConfig.localwallets = [
];

MobileConfig.localtestaccounts = [
];

MobileConfig.localtesttokens = [
];


MobileConfig.remoteschemes = [
];

MobileConfig.remotewallets = [
];

MobileConfig.remotetestusers = [
];
