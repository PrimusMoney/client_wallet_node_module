/**
 * 
 */
'use strict';

var Scheme = class {
	
	static get CLIENT_SCHEME() { return 0;}
	static get REMOTE_SCHEME() { return 1;}

	
	static get AVG_TRANSACTION_FEE() { return 0.00042173;}

	static get DEFAULT_GAS_LIMIT() { return 4850000;}
	static get DEFAULT_GAS_PRICE() { return 10000000000;}

	
	constructor(module, session, restserver, authserver, keyserver, ethnodeserver) {
		this.module = module;
		this.global = module.global;
		this.session = session;
		
		this.uuid = null;
		this.name = null;
		this.label = null;

		// TODO: migrate to internal network config
		// to transparently forward additional parameters
		this.network = {};

		this.network.restserver = restserver;
		this.network.authserver = authserver;
		this.network.keyserver = keyserver;
		this.network.ethnodeserver = ethnodeserver;

		// check activation flags
		this.network.restserver.activate = (typeof restserver.activate !== 'undefined' ? restserver.activate : false);
		this.network.authserver.activate = (typeof authserver.activate !== 'undefined' ? authserver.activate : false);
		this.network.authserver.activate = (typeof keyserver.activate !== 'undefined' ? keyserver.activate : false);
		this.network.ethnodeserver.activate = (typeof ethnodeserver.activate !== 'undefined' ? ethnodeserver.activate : false);

		// deprecate below
/* 
		// rest (storage)
		this.activate_rest_server = (typeof restserver.activate !== 'undefined' ? restserver.activate : false);
		this.rest_server_url = restserver.rest_server_url;
		this.rest_server_api_path = restserver.rest_server_api_path;
		
		// authkey
		this.activate_auth_server = (typeof authserver.activate !== 'undefined' ? authserver.activate : false);
		this.auth_rest_server_url = (authserver ? authserver.rest_server_url : this.rest_server_url);
		this.auth_rest_server_api_path = (authserver ? authserver.rest_server_api_path : this.rest_server_url);
		
		this.activate_key_server = (typeof keyserver.activate !== 'undefined' ? keyserver.activate : false);
		this.key_rest_server_url = (keyserver ? keyserver.rest_server_url : this.rest_server_url);
		this.key_rest_server_api_path = (keyserver ? keyserver.rest_server_api_path : this.rest_server_url);
		
		// ethnode
		this.setEthNodeServerConfig(ethnodeserver);*/

		// additional data
		
		// import url
		this.configurl = null;
		
		this.xtra_data = {};
	}
	
	_getSession() {
		return this.session;
	}
	
	getSchemeUUID() {
		if (this.uuid)
		return this.uuid;
		
		var session = this.session;
		
		if (session)
			this.uuid = session.guid();
			
		return this.uuid;
	}
	
	setSchemeUUID(uuid) {
		this.uuid = uuid;
	}
	
	getConfigUrl() {
		return this.configurl;
	}
	
	setConfigUrl(configurl) {
		this.configurl = configurl;
	}
	
	getSchemeType() {
		//if (this.activate_auth_server)
		if (this.network.authserver.activate)
			return Scheme.REMOTE_SCHEME;
		else
			return Scheme.CLIENT_SCHEME;
	}

	isRemote() {
		return (this.network.authserver.activate && (this.network.authserver.activate == true));
	}
	
	getName() {
		return this.name;
	}
	
	setName(name) {
		this.name = name;
	}
	
	getLabel() {
		if (this.label)
		return this.label;
		
		if (this.name)
			return this.name;
		
		return 'unknown';
	}
	
	setLabel(label) {
		this.label = label;
	}
	
	getLocalJson() {
		var json = {};
		
/* 		json.restserver = {activate: this.activate_rest_server, rest_server_url: this.rest_server_url, rest_server_api_path: this.rest_server_api_path};
		json.authserver = {activate: this.activate_auth_server, rest_server_url: this.auth_rest_server_url, rest_server_api_path: this.auth_rest_server_api_path};
		json.keyserver = {activate: this.activate_key_server, rest_server_url: this.key_rest_server_url, rest_server_api_path: this.key_rest_server_api_path};
 
		json.ethnodeserver = (this.ethnodeserver ? this.ethnodeserver : {})
		json.ethnodeserver = Object.assign(json.ethnodeserver, {activate: this.activate_ethnode_server, web3_provider_url: this.ethnode_web3_provider_url, rest_server_url: this.ethnode_rest_server_url, rest_server_api_path: this.ethnode_rest_server_api_path});
*/

		json.restserver = Object.assign({}, this.network.restserver);
		json.authserver = Object.assign({}, this.network.authserver);
		json.keyserver = Object.assign({}, this.network.keyserver);

		json.ethnodeserver = Object.assign({}, this.network.ethnodeserver);
 		
		json.uuid = (this.uuid ? this.uuid : this.getSchemeUUID());
		json.name = (this.name ? this.name : 'no name');
		json.label = this.label;
		
		json.configurl = this.configurl;
		
		json.xtra_data = this.xtra_data;

		return json;
	}
	
	getNetworkConfig() {
		var network = {};

		network.restserver = Object.assign({}, this.network.restserver);
		network.authserver = Object.assign({}, this.network.authserver);
		network.keyserver = Object.assign({}, this.network.keyserver);
		network.ethnodeserver = Object.assign({}, this.network.ethnodeserver);
		
/* 		network.restserver = {activate: this.activate_rest_server, rest_server_url: this.rest_server_url, rest_server_api_path: this.rest_server_api_path};
		network.authserver = {activate: this.activate_auth_server, rest_server_url: this.auth_rest_server_url, rest_server_api_path: this.auth_rest_server_api_path};
		network.keyserver = {activate: this.activate_key_server, rest_server_url: this.key_rest_server_url, rest_server_api_path: this.key_rest_server_api_path};
		network.ethnodeserver = {activate: this.activate_ethnode_server, web3_provider_url: this.ethnode_web3_provider_url, rest_server_url: this.ethnode_rest_server_url, rest_server_api_path: this.ethnode_rest_server_api_path};
 */		
		network.uuid = this.uuid;
		
		return network;
	}
	
	// xtra data (available to let other modules store additional info)
	getXtraData(key) {
		if (key)
			return this.xtra_data[key];
		else
			return this.xtra_data;
	}
	
	putXtraData(key, value) {
		if (!key) {
			Object.assign(this.xtra_data, value);
			return;
		}
		
		this.xtra_data[key] = value;
	}
	
	// objects
	createSchemeSessionObject(callback) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		var clientmodules = global.getModuleObject('clientmodules');

		var schemesession = clientmodules.createBlankSessionObject();
		
		schemesession.SCHEME = this.uuid;

		var network = this.getNetworkConfig();
		
		return clientmodules.setSessionNetworkConfig(schemesession, network)
		.then((session) => {
			if (callback)
				callback(null, session);
			
			return session;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
					
			throw new Error(err);
		});
	}
	
	
	//
	// ethnode
	//
	getEthNodeServerConfig() {
		return this.network.ethnodeserver;
		//return this.ethnodeserver;
	}
	
	setEthNodeServerConfig(ethnodeserver) {
		this.network.ethnodeserver = ethnodeserver;

		// deprecate below
/* 		this.ethnodeserver = ethnodeserver;
		this.activate_ethnode_server = (typeof ethnodeserver.activate !== 'undefined' ? ethnodeserver.activate : false);
		this.ethnode_web3_provider_url = ethnodeserver.web3_provider_url;
		this.ethnode_rest_server_url = (ethnodeserver ? ethnodeserver.rest_server_url : this.rest_server_url);
		this.ethnode_rest_server_api_path = (ethnodeserver ? ethnodeserver.rest_server_api_path : this.rest_server_url);
 */	}
	
	// web3 provider
	getWeb3ProviderUrl() {
		return this.network.ethnodeserver.web3_provider_url;
		//return this.ethnode_web3_provider_url;
	}
	
	setWeb3ProviderUrl(web3providerurl) {
		this.network.ethnodeserver.web3_provider_url = web3providerurl;
		//this.ethnode_web3_provider_url = web3providerurl;
	}
	
	// rest connection
	createEthNodeRestConnection(session) {
		var networkconfig = this.getNetworkConfig();
		
		if (!networkconfig.ethnodeserver.rest_server_url)
			return;
		
		var restconnection = session.createRestConnection(networkconfig.ethnodeserver.rest_server_url, networkconfig.ethnodeserver.rest_server_api_path);
		
		return restconnection;
	}
	
	// top up
	_getTopUpRestResource(address) {
		// TODO: replace with topup for version >= 0.14.5
		var resource = "/faucet/top/" + address;

		return resource;
	}
	
	sendTopUpRequestAsync(session, address) {
		return new Promise((resolve, reject) => {
			var restconnection = this.createEthNodeRestConnection(session);

			if (restconnection) {

				if (restconnection._isReady()) {
					var resource = this._getTopUpRestResource(address);
					
					restconnection.rest_get(resource, (err, res) => {
						var data = (res ? res['data'] : null);
						if (data) {
							resolve(data);
						}
						else {
							reject('rest error calling ' + resource + ' : ' + err);
						}
						
					});
					
				}
				else {
					reject('rest connection can not issue a faucet request');
				}
			}
			else {
				reject('no rest server to receive faucet request');
			}
			
		});
	}
	
	// minimal number of transactions
	getTransactionUnitsThreshold() {
		var number = 5;
		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.transaction_units_min)
			number = parseInt(ethnodeserver.transaction_units_min.toString());
		
		return number;
	}
	
	
	fetchDefaultWeb3ProviderUrl(callback) {
		var web3providerurl = this.getWeb3ProviderUrl();
		var ethnodeserver = this.getEthNodeServerConfig();

		
		if (!this.activate_ethnode_server) {
			if (callback)
				callback(null, web3providerurl);
			
			return Promise.resolve(web3providerurl);
		}
		else {
			var session = this._getSession();
			
			var restconnection = session.createRestConnection(ethnodeserver.rest_server_url, ethnodeserver.rest_server_api_path);
			
			return new Promise((resolve, reject) => { 
				restconnection.rest_get('/web3/provider', (err, res) => {
					if (err) 
						reject(err); 
					else {
						if (res && (res.status == 1)  && (res.data) && (res.data.web3_host)) {
							web3providerurl = res.data.web3_host;
						}
						
						resolve(web3providerurl);
					}
				});
			})
			.then(() => {
				this.setWeb3ProviderUrl(web3providerurl);
				
				return web3providerurl;
			})
			.catch(err => {
				return web3providerurl;
			});
		}
	}
	
	canHandleWeb3ProviderUrl(web3providerurl, callback) {
		return new Promise((resolve, reject) => {
			var networkconfig = this.getNetworkConfig();
			var schemeweb3url = networkconfig.ethnodeserver.web3_provider_url;
			
			// if this scheme is a remote scheme and it is accepting this web3url
			var schemetype = this.getSchemeType();
			
			if (schemetype == Scheme.CLIENT_SCHEME) {
				if (schemeweb3url) {
					if (schemeweb3url.toLowerCase() == web3providerurl.toLowerCase())
						resolve(true);
					else
						resolve(false);
				}
				else {
					reject('local scheme has no web3 provider url: ' + this.getSchemeUUID());
				}

			}
			else if (schemetype == Scheme.REMOTE_SCHEME) {
				if (schemeweb3url) {
					// scheme has a specific web3 provider url specified
					// can only handle exact same url
					if (schemeweb3url.toLowerCase() == web3providerurl.toLowerCase())
						resolve(true);
					else
						resolve(false);
				}
				else {
					//TODO: make a call to rest_server to know if it accepts this web3providerurl
					resolve(true);
				}
				
			}
			else {
				reject('wrong scheme type: ' + schemetype);
			}
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			return res;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
		
	}
	
	cloneOnWeb3ProviderUrl(url, callback) {
		var walletmodule = this.module;
		var Scheme = walletmodule.Scheme;

		var networkconfig = this.getNetworkConfig();
		
		var clonedscheme = new Scheme(this.module, this.session, networkconfig.restserver, networkconfig.authserver, networkconfig.keyserver, networkconfig.ethnodeserver);
		
		// change web3 url
		clonedscheme.setWeb3ProviderUrl(url);
		
		// label
		clonedscheme.label = 'Clone of ' + this.getLabel();
		
		// save
		return clonedscheme.save(callback);
	}
	
	// objects
	getTokenObject(tokenaddress, callback) {
		var global = this.global;

		var Token = global.getModuleClass('wallet', 'Token');
		
		var token = new Token(this, tokenaddress);
		
		if (callback)
			callback(null, token);
		
		return Promise.resolve(token);
	}
	
	// utils
	getTransactionUnits(transactioncredits) {
		var global = this.global;
		var ethnodemodule = global.getModuleObject('ethnode');
		var ethcredit = ethnodemodule.getEtherFromwei(transactioncredits);
		
		var avg_transaction_fee = Scheme.AVG_TRANSACTION_FEE;

		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.avg_transaction_fee)
			avg_transaction_fee = parseFloat(ethnodeserver.avg_transaction_fee.toString());
		
		var units = ethcredit/(avg_transaction_fee > 0 ? avg_transaction_fee : Scheme.AVG_TRANSACTION_FEE);
		
		return Math.floor(units);
	}
	
	getGasLimit(level) {
		var default_gas_limit = Scheme.DEFAULT_GAS_LIMIT;
		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.default_gas_limit)
			default_gas_limit = parseInt(ethnodeserver.default_gas_limit.toString());
		
		return default_gas_limit;
	}
	
	getGasPrice(level) {
		var default_gas_price = Scheme.DEFAULT_GAS_PRICE;
		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.default_gas_price)
			default_gas_price = parseInt(ethnodeserver.default_gas_price.toString());
		
		return default_gas_price;
	}

	save(callback) {
		// we do an non-atomic save
		var walletmodule = this.module;
		
		return walletmodule._saveScheme(this, callback);
	}
	
	
	// static methods
	static readFromJson(walletmodule, session, schemejson) {
		var Scheme = walletmodule.Scheme;

		var restserver = schemejson.restserver;
		var authserver = schemejson.authserver;
		var keyserver = schemejson.keyserver;
		var ethnodeserver = schemejson.ethnodeserver;
		
		if (!ethnodeserver) {
			// Obsolete: can be removed for ethereum_webapp version >= 0.14.3
			ethnodeserver = schemejson.ethnode;
		}
		
		var scheme = new Scheme(walletmodule, session, restserver, authserver, keyserver, ethnodeserver);
		
		// set scheme's uuid
		if (schemejson.uuid)
			scheme.setSchemeUUID(schemejson.uuid);
		
		scheme.setName(schemejson.name);
		scheme.setLabel(schemejson.label);
		scheme.setConfigUrl(schemejson.configurl);
		
		scheme.xtra_data = (schemejson.xtra_data ? schemejson.xtra_data : {});
		
		return scheme;
	}
	
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('wallet', 'Scheme', Scheme);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Scheme', Scheme);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Scheme', Scheme);
}