/**
 * 
 */
'use strict';

var Scheme = class {
	
	static get CLIENT_SCHEME() { return 0;}
	static get REMOTE_SCHEME() { return 1;}

	
	static get DEFAULT_GAS_LIMIT() { return 4850000;}
	static get DEFAULT_GAS_PRICE() { return 10000000000;}
	static get DEFAULT_GAS_UNIT() { return 21000;}

	static get AVG_TRANSACTION_FEE() { return 0.00021;}

	static get TRANSACTION_UNITS_MIN() { return 240;} 
		// AVG_TRANSACTION_FEE * TRANSACTION_UNITS_MIN should be higher than DEFAULT_GAS_LIMIT * DEFAULT_GAS_PRICE

	
	constructor(module, session, schemejson) {
		this.module = module;
		this.global = module.global;
		this.session = session;
		
		this.uuid = null;
		this.name = null;
		this.label = null;

		// we now keep the original json
		this.schemejson = schemejson

		// internal network config
		// to transparently forward additional parameters
		this.network = {};

		var restserver = schemejson.restserver;
		var authserver = schemejson.authserver;
		var keyserver = schemejson.keyserver;

		// legacy
		var ethnodeserver = schemejson.ethnodeserver; 
		
		if (!ethnodeserver) {
			// Obsolete: can be removed for ethereum_webapp version >= 0.14.3
			ethnodeserver = schemejson.ethnode;
		}
		
		this._setNetworkConfig(restserver, authserver, keyserver, ethnodeserver);

		// additional data
		
		// import url
		this.configurl = null;
		
		this.xtra_data = {};
	}

	_setNetworkConfig(restserver, authserver, keyserver, ethnodeserver) {
		this.network.restserver = restserver;
		this.network.authserver = authserver;
		this.network.keyserver = keyserver;

		if (ethnodeserver)
		this.network.ethnodeserver = ethnodeserver;

		// check activation flags
		this.network.restserver.activate = (typeof restserver.activate !== 'undefined' ? restserver.activate : false);
		this.network.authserver.activate = (typeof authserver.activate !== 'undefined' ? authserver.activate : false);
		this.network.authserver.activate = (typeof keyserver.activate !== 'undefined' ? keyserver.activate : false);
		
		if (ethnodeserver) {
			this.network.ethnodeserver.activate = (typeof ethnodeserver.activate !== 'undefined' ? ethnodeserver.activate : false);

			this.web3providerobject = null;
		}
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

		var reserved_keys = ['restserver', 'authserver', 'keyserver', 'uuid', 'name', 'label', 'configurl', 'xtra_data'];
		
		json.restserver = Object.assign({}, this.network.restserver);
		json.authserver = Object.assign({}, this.network.authserver);
		json.keyserver = Object.assign({}, this.network.keyserver);

		//json.ethnodeserver = Object.assign({}, this.network.ethnodeserver);
 		
		json.uuid = (this.uuid ? this.uuid : this.getSchemeUUID());
		json.name = (this.name ? this.name : 'no name');
		json.label = this.label;
		
		json.configurl = this.configurl;
		
		json.xtra_data = this.xtra_data;

		// possible additional parameters
		if (this.schemejson) {
			let keys = Object.keys(this.schemejson);

			for (var i = 0; i < keys.length; i++) {
				let key = keys[i];

				if (!reserved_keys.includes(key)) {
					json[key] = Object.assign({}, this.schemejson[key]);
				}
			}
		}

		return json;
	}
	
	getNetworkConfig() {
		var network = {};

		network.restserver = Object.assign({}, this.network.restserver);
		network.authserver = Object.assign({}, this.network.authserver);
		network.keyserver = Object.assign({}, this.network.keyserver);

		if (this.network.ethnodeserver)
		network.ethnodeserver = Object.assign({}, this.network.ethnodeserver); // legacy
		
		network.uuid = this.uuid;
		
		return network;
	}

	getJsonConfig() {
		return this.schemejson;
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
	// OBSOLETE: should not presuppose scheme makes a particular case with ethnode

	getEthNodeServerConfig() {
		console.log('OBSOLETE: Scheme.getEthNodeServerConfig should no longer be used!');
		return (this.network.ethnodeserver ? this.network.ethnodeserver : {});
		//return this.ethnodeserver;
	}
	
	setEthNodeServerConfig(ethnodeserver) {
		console.log('OBSOLETE: Scheme.setEthNodeServerConfig should no longer be used!');
		this.network.ethnodeserver = ethnodeserver;
	}
	
	// web3 provider
	getWeb3ProviderUrl() {
		console.log('OBSOLETE: Scheme.getWeb3ProviderUrl should no longer be used!');
		if (this.web3providerobject)
		return this.web3providerobject.getWeb3ProviderUrl();

		var _web3_provider_url = (this.network.ethnodeserver ? this.network.ethnodeserver.web3_provider_url : null);

		// get provider object and set its chainid and networkid
		// to be used by EthereumTransaction
		var global = this.global;
		var session = this._getSession();

		var ethnodemodule = global.getModuleObject('ethnode');

		this.web3providerobject = ethnodemodule.getWeb3ProviderObject(session, _web3_provider_url);

		// note: web3provider exists, only if an EthereumNodeAccessInstance has been instantiated
		// for this web3providerurl

		if (this.web3providerobject) {
			// set chainid, networkid, auth_basic,.. if they are specified
			if (this.network.ethnodeserver && this.network.ethnodeserver.chainid)
			this.web3providerobject.setVariable('chainid', parseInt(this.network.ethnodeserver.chainid));
		
			if (this.network.ethnodeserver && this.network.ethnodeserver.networkid)
				this.web3providerobject.setVariable('networkid', parseInt(this.network.ethnodeserver.networkid));

			if (this.network.ethnodeserver && this.network.ethnodeserver.auth_basic)
				this.web3providerobject.setVariable('auth_basic', this.network.ethnodeserver.auth_basic);
		}

		
		return _web3_provider_url;
	}
	
	setWeb3ProviderUrl(web3providerurl) {
		console.log('OBSOLETE: Scheme.setWeb3ProviderUrl should no longer be used!');
		if (this.network.ethnodeserver)
		this.network.ethnodeserver.web3_provider_url = web3providerurl;

		this.web3providerobject = null
	}
	
	// rest connection
	createEthNodeRestConnection(session) {
		console.log('OBSOLETE: Scheme.createEthNodeRestConnection should no longer be used!');
		var networkconfig = this.getNetworkConfig();
		
		if (!networkconfig.ethnodeserver || !networkconfig.ethnodeserver.rest_server_url)
			return;
		
		var restconnection = session.createRestConnection(networkconfig.ethnodeserver.rest_server_url, networkconfig.ethnodeserver.rest_server_api_path);
		
		return restconnection;
	}
	
	// top up
	_getTopUpRestResource(address) {
		console.log('OBSOLETE: Scheme._getTopUpRestResource should no longer be used!');
		// TODO: replace with topup for version >= 0.14.5
		var resource = "/faucet/top/" + address;

		return resource;
	}
	
	sendTopUpRequestAsync(session, address) {
		console.log('OBSOLETE: Scheme.sendTopUpRequestAsync should no longer be used!');
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
	getTransactionUnitsThreshold(feelevel) {
		console.log('OBSOLETE: Scheme.getTransactionUnitsThreshold should no longer be used!');
		var number = Scheme.TRANSACTION_UNITS_MIN;
		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.transaction_units_min)
			number = parseInt(ethnodeserver.transaction_units_min.toString());
		
		return number * (feelevel && feelevel.transaction_units_min_multiplier ? parseInt(feelevel.transaction_units_min_multiplier) : 1);
	}
	
	
	fetchDefaultWeb3ProviderUrl(callback) {
		console.log('OBSOLETE: Scheme.fetchDefaultWeb3ProviderUrl should no longer be used!');
		var web3providerurl = this.getWeb3ProviderUrl();
		var ethnodeserver = this.getEthNodeServerConfig();

		
		if (!this.activate_ethnode_server) {
			if (callback)
				callback(null, web3providerurl);
			
			return Promise.resolve(web3providerurl);
		}
		else {
			var session = this._getSession();
			
			var restconnection = (ethnodeserver ? session.createRestConnection(ethnodeserver.rest_server_url, ethnodeserver.rest_server_api_path) : session.createRestConnection());
			
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
		console.log('OBSOLETE: Scheme.canHandleWeb3ProviderUrl should no longer be used!');
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
		console.log('OBSOLETE: Scheme.cloneOnWeb3ProviderUrl should no longer be used!');
		var walletmodule = this.module;
		var Scheme = walletmodule.Scheme;

		var networkconfig = this.getNetworkConfig();
		
		var clonedscheme = new Scheme(this.module, this.session, networkconfig);
		
		// change web3 url
		clonedscheme.setWeb3ProviderUrl(url);

		// TODO: should set default transaction info
		
		// TODO: should set chainid and networkid in networkconfig.ethnodeserver
		
		// label
		clonedscheme.label = 'Clone of ' + this.getLabel();
		
		// save
		return clonedscheme.save(callback);
	}
	
	// objects
	getTokenObject(tokenaddress, callback) {
		console.log('OBSOLETE: Scheme.getTokenObject should no longer be used!');
		var global = this.global;

		var Token = global.getModuleClass('wallet', 'Token');
		
		var token = new Token(this, tokenaddress);
		
		if (callback)
			callback(null, token);
		
		return Promise.resolve(token);
	}
	
	// utils
	getAverageTransactionFee(feelevel) {
		console.log('OBSOLETE: Scheme.getAverageTransactionFee should no longer be used!');
		var global = this.global;
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var avg_transaction_fee = Scheme.AVG_TRANSACTION_FEE;

		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.avg_transaction_fee)
			avg_transaction_fee = parseFloat(ethnodeserver.avg_transaction_fee.toString());

		return avg_transaction_fee * (feelevel && feelevel.avg_transaction_fee_multiplier ? parseInt(feelevel.avg_transaction_fee_multiplier) : 1);
	}

	async getTransactionUnitsAsync(transactioncredits) {
		console.log('OBSOLETE: Scheme.getTransactionUnitsAsync should no longer be used!');
		// TODO: look if using DecimalAmount could improve the division
		return this.getTransactionUnits(transactioncredits);
	}

	getTransactionUnits(transactioncredits) {
		console.log('OBSOLETE: Scheme.getTransactionUnits should no longer be used!');
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

	async getTransactionCreditsAsync(transactionunits) {
		console.log('OBSOLETE: Scheme.getTransactionCreditsAsync should no longer be used!');
		var global = this.global;
		var session = this._getSession();

		var transactioninfo  = {};

		transactioninfo.avg_transaction_fee = this.getAverageTransactionFee();
		transactioninfo.units_threshold = this.getTransactionUnitsThreshold();
		
		var ethnodemodule = global.getModuleObject('ethnode');
		var walletmodule = this.module;

		var weiamount = ethnodemodule.getWeiFromEther(transactioninfo.avg_transaction_fee);
		var avg_transaction = await walletmodule.createDecimalAmountAsync(session, weiamount, 18);
		var credits_decimal = await avg_transaction.multiply(transactionunits);

		var credits = await credits_decimal.toInteger();
		
		return credits;
	}
	
	getTransactionCredits(transactionunits) {
		console.log('OBSOLETE: Scheme.getTransactionCredits should no longer be used!');
		var global = this.global;
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var avg_transaction_fee = Scheme.AVG_TRANSACTION_FEE;

		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.avg_transaction_fee)
			avg_transaction_fee = parseFloat(ethnodeserver.avg_transaction_fee.toString());
		
		var transactioncredits = transactionunits*(avg_transaction_fee > 0 ? avg_transaction_fee : Scheme.AVG_TRANSACTION_FEE);
		var ethcredit = ethnodemodule.getEtherFromwei(transactioncredits);
		
		return ethcredit;
	}
	
	getGasLimit(feelevel) {
		console.log('OBSOLETE: Scheme.getGasLimit should no longer be used!');
		var default_gas_limit = Scheme.DEFAULT_GAS_LIMIT;
		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.default_gas_limit)
			default_gas_limit = parseInt(ethnodeserver.default_gas_limit.toString());

		return default_gas_limit * (feelevel && feelevel.default_gas_limit_multiplier ? parseInt(feelevel.default_gas_limit_multiplier) : 1);
	}
	
	getGasPrice(feelevel) {
		console.log('OBSOLETE: Scheme.getGasPrice should no longer be used!');
		var default_gas_price = Scheme.DEFAULT_GAS_PRICE;
		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.default_gas_price)
			default_gas_price = parseInt(ethnodeserver.default_gas_price.toString());
		
		return default_gas_price * (feelevel && feelevel.default_gas_price_multiplier ? parseInt(feelevel.default_gas_price_multiplier) : 1);
	}

	getGasUnit() {
		console.log('OBSOLETE: Scheme.getGasUnit should no longer be used!');
		var default_gas_unit = Scheme.DEFAULT_GAS_UNIT;
		var ethnodeserver = this.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.gas_unit)
			default_gas_unit = parseInt(ethnodeserver.gas_unit.toString());

		return default_gas_unit;
	}

	//
	// end EthNode
	//
	// OBSOLETE: should not presuppose scheme makes a particular case with ethnode


	save(callback) {
		// we do an non-atomic save
		var walletmodule = this.module;
		
		return walletmodule._saveScheme(this, callback);
	}
	
	
	// static methods
	static readFromJson(walletmodule, session, schemejson) {
		var Scheme = walletmodule.Scheme;


		var scheme = new Scheme(walletmodule, session, schemejson);
		
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