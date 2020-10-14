/**
 * 
 */
'use strict';
var MobileConfig = Object.create(null);

MobileConfig.execution_env = 'prod';

// used for remote login
MobileConfig.default_remote_network_config = {
		name: 'PrimusMoney',
		uuid: '0638b7bc-3e1d-0f04-bd75-a91cef4bd5c7',
		restserver: {
			activate: true,
			rest_server_url: 'https://mobile-rest.primusmoney.com/',
			rest_server_api_path: '/webapp/api'
		},
		authserver: {
			activate: true,
			rest_server_url: 'https://authkey-rest.primusmoney.com',
			rest_server_api_path: '/authkey'
		},
		keyserver: {
			activate: true,
			rest_server_url: 'https://authkey-rest.primusmoney.com',
			rest_server_api_path: '/authkey'
		}
};


// built-in schemes
MobileConfig.builtin_local_networks = [
	{
		name: 'firenze test network',
		uuid: 'c2dde9a3-0c1b-df6e-9340-ccc96699a7df',
		restserver: {
			activate: false
		},
		authserver: {
			activate: false
		},
		keyserver: {
			activate: false
		},
		ethnodeserver: {
			name: 'firenze',
			activate: false,
			rest_server_url: 'https://firenze-dapps.primusmoney.com/', 
			rest_server_api_path: '/erc20-dapp/api',
			web3_provider_url: 'https://ethnode.primusmoney.com/firenze'
		}
	}
];

MobileConfig.builtin_remote_networks = [
	{
		name: 'primusmoney firenze',
		uuid: 'ced32053-c088-7932-dd1b-0009d99eb7ec',
		restserver: MobileConfig.default_remote_network_config.restserver,
		authserver: MobileConfig.default_remote_network_config.authserver,
		keyserver: MobileConfig.default_remote_network_config.keyserver,
		ethnodeserver: {
			name: 'firenze',
			activate: false,
			web3_provider_url: 'https://ethnode.primusmoney.com/firenze'
		}
	}
];

MobileConfig.builtin_scheme_list_servers = [
	{
		name: 'primus money mytokens',
		uuid: '57eed191-9f8a-b533-7828-776766707c51',
		url: 'https://mobile-rest.primusmoney.com/webapp/api/mytokens/scheme/list'
	}
];


module.exports = MobileConfig;