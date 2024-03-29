'use strict';


var Module = class {
	
	constructor() {
		this.name = 'mvc-client-wallet';
		this.current_version = "0.30.20.2023.03.03";
		
		this.global = null; // put by global on registration

		this.isready = false;
		this.isloading = false;

		this.clientmodule = null;
		
		this.clientapicontrollers = null;
	}
	
	init() {
		console.log('module init called for ' + this.name);

		var global = this.global;
		
		this.isready = true;

	}
	
	// compulsory  module functions
	loadModule(parentscriptloader, callback) {
		console.log('loadModule called for module ' + this.name);

		if (this.isready) {
			if (callback)
				callback(null, this);
			
			return;
		}

		if (this.isloading) {
			var error = 'calling loadModule while still loading for module ' + this.name;
			console.log('error: ' + error);
			
			if (callback)
				callback(error, null);
			
			return;
		}
			
		this.isloading = true;

		var self = this;
		var global = this.global;
		var mvcmodule = this;
		

		// mvc files

		// look if mvcclientwalletmoduleloader already created (e.g. for loading in node.js)
		modulescriptloader = global.findScriptLoader('mvcclientwalletmoduleloader');

		// if not, create on as child as parent script loader passed in argument
		if (!modulescriptloader)
		var modulescriptloader = parentscriptloader.getChildLoader('mvcclientwalletmoduleloader');
		
		var moduleroot = './includes';

		//modulescriptloader.push_script( moduleroot + '/control/controllers.js');
		//modulescriptloader.push_script( moduleroot + '/view/views.js');
		//modulescriptloader.push_script( moduleroot + '/model/models.js');

		// DAPPs
		modulescriptloader.load_scripts(function() { self.init(); if (callback) callback(null, self); });
		
		return modulescriptloader;
	}
	
	isReady() {
		return this.isready;
	}

	hasLoadStarted() {
		return this.isloading;
	}

	// optional module functions
	registerHooks() {
		console.log('module registerHooks called for ' + this.name);
		
		var global = this.global;
		
		// initialization
		//global.registerHook('postFinalizeGlobalScopeInit_hook', this.name, this.postFinalizeGlobalScopeInit_hook);

		// signal module is ready
		var rootscriptloader = global.getRootScriptLoader();
		rootscriptloader.signalEvent('on_mvc_client_wallet_module_ready');
	}

	postRegisterModule() {
		console.log('postRegisterModule called for ' + this.name);
		if (!this.isloading) {
			var global = this.global;
			var self = this;
			var rootscriptloader = global.getRootScriptLoader();
			
			this.loadModule(rootscriptloader, function() {
				if (self.registerHooks)
				self.registerHooks();
			});
		}
	}
	

	
	//
	// hooks
	//
	

	
	// objects
 	
	// client module 
	getClientModuleObject() {
		if (this.clientmodule)
		return this.clientmodule;

		// legacy
		var global = this.global;
		var mobileclientmodule = global.getModuleObject('mobileclient');

		if (mobileclientmodule) {
			this.clientmodule = mobileclientmodule;

			return mobileclientmodule;
		}
	}

	setClientModuleObject(module) {
		if (!module)
			throw new Error('null module passed!');

		this.clientmodule = module;

		if (!this.clientmodule.getClientControllers)
			throw new Error('no getClientControllers method in client module to retrieve controllers object!');

		let moduleclientcontrollers = this.clientmodule.getClientControllers();

		if (!moduleclientcontrollers.getClientControllers)
			throw new Error('no getClientControllers method to retrieve controllers object!');

		this.clientapicontrollers = moduleclientcontrollers.getClientControllers();
	}

	_getClientAPI() {
		if (this.clientapicontrollers)
		return this.clientapicontrollers;

		// setClientModuleObject was not called
		var global = this.global;

		var clientsmodule = global.getModuleObject('clientmodules');

		this.clientapicontrollers = clientsmodule.getControllersObject();

		return this.clientapicontrollers;
	}

	getAPIVersion() {
		var _apicontrollers = this._getClientAPI();

		return _apicontrollers.getClientVersion();
	}

	
	// legacy functions for mobile
	// mobile wrapping to help callers (like react/actions)
	getMobileControllersObject(){
		return this._getClientAPI();
	} 

	getMvcInfo() {
		var info = [];
		
		// TODO: check if need to put react-js
		info['framework'] = 'react-native';
		
		return info;
	}

	getMobileClientExecutionEnvironment() {
		var global = this.global;
		var mobileclientmodule = global.getModuleObject('mobileclient');
		
		if (!mobileclientmodule)
			return;

		return mobileclientmodule.getExecutionEnvironment();
	}
	// legacy end

	// Client config
	getClientExecutionEnvironment() {
		var clientmodule = this.getClientModuleObject()
		
		if (!clientmodule)
			return;

		return clientmodule.getExecutionEnvironment();
	}
	
	async initProdEnvironment() {
		var clientmodule = this.getClientModuleObject()
		
		if (!clientmodule)
			return;

		return clientmodule.initprod(true);
	}
	
	async initDevEnvironment() {
		var clientmodule = this.getClientModuleObject()
		
		return clientmodule.initdev(true);
	}

	getBuiltinLocalNetworks() {
		var clientmodule = this.getClientModuleObject()
		
		if (!clientmodule)
			return;

		let ClientConfig = clientmodule.getClientConfig();

		return ClientConfig.builtin_local_networks;
	}
	
	getBuiltinRemoteNetworks() {
		var clientmodule = this.getClientModuleObject()
		
		if (!clientmodule)
			return;

		let ClientConfig = clientmodule.getClientConfig();

		return ClientConfig.builtin_remote_networks;
	}
	
	//
	// API
	//

	guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}
		
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}
	
	t(string) {
		// translation
		return this.global.t(string);
	}

	//
	// Session functions
	//

	async createChildSession(sessionuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
	
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var childsession = await _apicontrollers.createChildSessionObject(session);
		childsession.MVCMOD = this.current_version;

		if (!childsession)
			return Promise.reject('could not create child session');
			
		return childsession.getSessionUUID();
	}

	async _getChildSessionOnWeb3Url(parentsession, web3providerurl) {
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		if (!parentsession)
			return Promise.reject('could not find create child of null session');

		var web3sessionmap = parentsession.getSessionVariable('web3sessionmap');
		
		if (!web3sessionmap) {
			web3sessionmap = Object.create(null);
			parentsession.setSessionVariable('web3sessionmap', web3sessionmap);
		}
		
		// we could look if a pre-existing session with corresponding web3providerurl could be re-used
		if (web3sessionmap[web3providerurl])
			return web3sessionmap[web3providerurl];

		// else we create one and set it
		var childsession = _apicontrollers.createChildSessionObject(parentsession);
		childsession.MVCMOD = this.current_version;

		if (!parentsession.MVCMOD_ROOT)
			parentsession.MVCMOD_ROOT = this.current_version;

		// we use local default scheme as template
		var networkconfig = await _apicontrollers.createLocalSchemeConfig(childsession, web3providerurl);

		await _apicontrollers.setSessionNetworkConfig(childsession, networkconfig);

		web3sessionmap[web3providerurl] = childsession;

		return childsession;
	}

		
	// session
	getCurrentSessionObject() {
		var _apicontrollers = this._getClientAPI();
		
		return _apicontrollers.getCurrentSessionObject();
	}
	
	async getSessionObject(sessionuuid) {
		var _apicontrollers = this._getClientAPI();
		
		return _apicontrollers.getSessionObject(sessionuuid);
	}
	
	// user
	async getUserInfo(sessionuuid) {
		if (!sessionuuid)
			return {};
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		return _apicontrollers.getUserInfo(session);
	}
	
	async isValidEmailAddress(sessionuuid, emailaddress) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		return _apicontrollers.isValidEmail(session, emailaddress);
	}

	//
	// Crypto functions
	//

	async isValidAddress(sessionuuid, address) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		return _apicontrollers.isValidAddress(session, address);
	}
	
	async generatePrivateKey(sessionuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		return _apicontrollers.generatePrivateKey(session);
	}
	
	async isValidPrivateKey(sessionuuid, privatekey) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		return _apicontrollers.isValidPrivateKey(session, privatekey);
	}
	
	async getPublicKeys(sessionuuid, privatekey) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		return _apicontrollers.getPublicKeys(session, privatekey);
	}
	
	async areAddressesEqual(sessionuuid, address1, address2) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		return session.areAddressesEqual(address1, address2);
	}
	

	//
	// Storage
	//

	// Settings
	async readSettings(keys, defaultvalue) {
		var _apicontrollers = this._getClientAPI();
		var session = this.getCurrentSessionObject();
		
		return _apicontrollers.readSettings(session, keys, defaultvalue);
	}
	
	async putSettings(keys, json) {
		var _apicontrollers = this._getClientAPI();
		var session = this.getCurrentSessionObject();
		
		return _apicontrollers.putSettings(session, keys, json);
	}

	// local storage
	async getLocalJsonLeaf(sessionuuid, keys, bForceRefresh) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();
	
		var session = await _apicontrollers.getSessionObject(sessionuuid);
	
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		return _apicontrollers.getLocalJsonLeaf(session, keys, bForceRefresh);
	}
	
	async saveLocalJson(sessionuuid, keys, json) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();
	
		var session = await _apicontrollers.getSessionObject(sessionuuid);
	
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		return _apicontrollers.saveLocalJson(session, keys, json);
	}

	async hasPrivateKey(sessionuuid, address) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();
	
		var session = await _apicontrollers.getSessionObject(sessionuuid);
	
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		return session.isSessionAccountAddress(address);
	}

	
	// events
	signalEvent(eventname, params) {
		var global = this.global;
		global.signalEvent(eventname, params);
	}
	
	registerEventListener(eventname, listerneruuid, callback) {
		var global = this.global;
		
		console.log('registerEventListener for event ' + eventname + ' by ' + listerneruuid);
		
		global.registerEventListener(eventname, listerneruuid, callback);
	}
	
	unregisterEventListener(eventname, listerneruuid) {
		var global = this.global;
		
		console.log('unregisterEventListener for event ' + eventname + ' by ' + listerneruuid);
		
		global.unregisterEventListener(eventname, listerneruuid);
	}
	
	// hooks
	async invokeHooks(hookname, result, params) {
		var global = this.global;
		
		return global.invokeHooks(hookname, result, params);
	}
		
	async invokeAsyncHooks(hookname, result, params) {
		var global = this.global;
		
		return global.invokeAsyncHooks(hookname, result, params);
	}
	

	//
	// Card encryption functions
	//

	// private keys
	async getWalletDecryptingCard(sessionuuid, walletuuid, address) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var mvcmodule = global.getModuleObject('mvc');
		var _apicontrollers = this._getClientAPI();
	
		var session = await _apicontrollers.getSessionObject(sessionuuid);
	
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);

		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid).catch(err => {});
	
		if (!wallet)
			return;

		var cards = await mvcmodule.getCardsWithAddress(sessionuuid, walletuuid, address).catch(err => {});

		if (!cards)
			return;

		for (var i = 0; i < cards.length; i++) {
			var _privatekey = await mvcmodule.getCardPrivateKey(sessionuuid, walletuuid, cards[i].uuid).catch(err => {});

			if (_privatekey)
				return cards[i];
		}
	}

	async getCardPrivateKey(sessionuuid, walletuuid, carduuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var mvcmodule = this;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		var cardaccount = card._getSessionAccountObject();

		if (!cardaccount)
			return Promise.reject('card has no private key ' + carduuid);

		var privatekey = cardaccount.getPrivateKey();

		return privatekey;
	}

	async setCardPrivateKey(sessionuuid, walletuuid, carduuid, privatekey) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var mvcmodule = this;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		var cardaccount = card._getSessionAccountObject();

		if (cardaccount)
			return false; // we don't change the private key

		var cardaddress = card.getAddress();

		var account = session.createBlankAccountObject();

		account.setPrivateKey(privatekey);

		if (account.getAddress() == cardaddress) {
			var bSave = true;

			wallet._createClientAccountObject(privatekey, bSave);

			return true;
		}

		return false;
	}
	
	// symetric encryption
	async aesEncryptString(sessionuuid, walletuuid, carduuid, plaintext) {
		if (!plaintext)
			return;

		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var mvcmodule = this;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		var cardaccount = card._getSessionAccountObject();

		if (!cardaccount)
			return Promise.reject('card can not encrypt texts ' + carduuid);

		var privatekey = cardaccount.getPrivateKey();

		return _apicontrollers.aesEncryptString(session, privatekey, plaintext);
	}

	async aesDecryptString(sessionuuid, walletuuid, carduuid, cyphertext) {
		if (!cyphertext)
			return;

		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var mvcmodule = this;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		var cardaccount = card._getSessionAccountObject();

		if (!cardaccount)
			return Promise.reject('card can not decrypt texts ' + carduuid);

		var privatekey = cardaccount.getPrivateKey();

		return _apicontrollers.aesDecryptString(session, privatekey, cyphertext);
	}
	
	// asymetric encryption
	async rsaEncryptString(sessionuuid, walletuuid, carduuid, recipientrsapublickey, plaintext) {
		if (!plaintext)
			return;

		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var mvcmodule = this;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);
			
		var senderaccount = card._getSessionAccountObject();
		var recipientaccount = session.createBlankAccountObject();
		
		recipientaccount.setRsaPublicKey(recipientrsapublickey);
		
		var cyphertext = _apicontrollers.rsaEncryptString(senderaccount, recipientaccount, plaintext);
	
		return cyphertext;
	}
	
	async rsaDecryptString(sessionuuid, walletuuid, carduuid, senderrsapublickey, cyphertext) {
		if (!cyphertext)
			return;

		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var mvcmodule = this;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);
			

		var senderaccount = session.createBlankAccountObject();
		var recipientaccount = card._getSessionAccountObject();;
		
		senderaccount.setRsaPublicKey(senderrsapublickey);
		
		var plaintext = _apicontrollers.rsaDecryptString(recipientaccount, senderaccount, cyphertext);

		return plaintext;
	}

	async signString(sessionuuid, walletuuid, carduuid, plaintext) {
		if (!plaintext)
			return Promise.reject('plain text is undefined');

		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		var cardaccount = card._getSessionAccountObject();

		if (!cardaccount)
			return Promise.reject('card can not sign texts ' + carduuid);

		var privatekey = cardaccount.getPrivateKey();

		return _apicontrollers.signString(session, privatekey, plaintext);
	}

	async validateStringCardSignature(sessionuuid, walletuuid, carduuid, plaintext, signature) {
		if (!plaintext)
			return Promise.reject('plain text is undefined');

		if (!signature)
			return Promise.reject('signature is undefined');

		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		var address = card.getAddress();

		return _apicontrollers.validateStringSignature(session, address, plaintext, signature);
	}





	//
	// Scheme functions
	//

	_getSchemeNetworkConfig(scheme) {
		var network = scheme.getNetworkConfig();

		return network;
	}

	async getDefaultLocalSchemeInfo(sessionuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();
	
		var session = await _apicontrollers.getSessionObject(sessionuuid);
	
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var scheme = await _apicontrollers.getDefaultScheme(session, 0);

		var mvcmodule = this;

		let schemeinfo = {};
		mvcmodule._fillSchemeInfoFromScheme(schemeinfo, scheme);

		return schemeinfo;
	}

	_getAverageTransactionFee(scheme, feelevel) {
		return scheme.getAverageTransactionFee(feelevel);
	}

	_getTransactionCredits(scheme, transactionunits) {
		// TODO: for version >= 0.20.7 replace with
		// return scheme.getTransactionCredits(transactionunits)

		// NOTE: to get an integer we need to use DecimalAmount

		var global = this.global;
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var Scheme = global.getModuleClass('wallet', 'Scheme');
		var avg_transaction_fee = Scheme.AVG_TRANSACTION_FEE;

		var ethnodeserver = scheme.getEthNodeServerConfig();
		
		if (ethnodeserver && ethnodeserver.avg_transaction_fee)
			avg_transaction_fee = parseFloat(ethnodeserver.avg_transaction_fee.toString());
		
		var transactioncredits = transactionunits*(avg_transaction_fee > 0 ? avg_transaction_fee : Scheme.AVG_TRANSACTION_FEE);
		var ethcredit = ethnodemodule.getEtherFromwei(transactioncredits);
		
		return ethcredit;
	}

	async _createDecimalAmount(session, amount, decimals) {
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		return _apicontrollers.createDecimalAmount(session, amount, decimals);
	}

	_compareUrl(url1, url2) {
		var _url1 = (url1 && url1.endsWith('/') ? url1.substring(0, url1.length - 1 ) : url1);
		var _url2 = (url2 && url2.endsWith('/') ? url2.substring(0, url2.length - 1 ) : url2);

		if (_url1 && _url2 && (_url1 == _url2))
		return true;
		else
		return false;
	}

	async findLocalSchemeInfoFromWeb3Url(sessionuuid, web3url, options) {
		console.log('OBSOLETE: Module.findLocalSchemeInfoFromWeb3Url should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();


		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);

		var scheme;

		// get list of local schemes
		var localschemes = await _apicontrollers.getLocalSchemeList(session, true);

		for (var i = 0; i < localschemes.length; i++) {
			var networkconfig = localschemes[i].getNetworkConfig();
			var ethnodeserverconfig = (networkconfig.ethnodeserver ? networkconfig.ethnodeserver : {});

			if (this._compareUrl(web3_provider_url, web3url)) {
				// validate scheme matches options
				var bValid = true;
				var _keys = (options ? Object.keys(options) : []);

				for (var j = 0; j < _keys.length; j++) {
					if (options[_keys[j]] && (options[_keys[j]] != ethnodeserverconfig[_keys[j]]) ) {
						bValid = false;
						break;
					}
				}

				if (bValid) {
					scheme = localschemes[i];
					break;
				}
			}
		}

		if (!scheme)
			return Promise.reject('could not find scheme for ' + web3url);

		var mvcclientwalletmodule = global.getModuleObject('mvc-client-wallet');
		var schemeuuid = scheme.getSchemeUUID();

		return mvcclientwalletmodule.getSchemeInfo(sessionuuid, schemeuuid);
	}

	async buildSchemeFromWeb3Url(sessionuuid, walletuuid, web3url, options) {
		console.log('OBSOLETE: Module.buildSchemeFromWeb3Url should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);


		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
	
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
			
		
		// clone scheme first
		var defaultlocalscheme = await _apicontrollers.getDefaultScheme(session, 0); // 0 = local
		
		var scheme = await defaultlocalscheme.cloneOnWeb3ProviderUrl(web3url)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not create scheme for ' + web3url);
		
		// change default ethnodeserver
		var ethnodeserverconfig = scheme.getEthNodeServerConfig();

		// set transaction info
		ethnodeserverconfig.default_gas_limit = (options.default_gas_limit ?  options.default_gas_limit : 21000);
		ethnodeserverconfig.default_gas_price = (options.default_gas_price ?  options.default_gas_price : 1000000000);
		ethnodeserverconfig.avg_transaction_fee = (options.avg_transaction_fee ?  options.avg_transaction_fee : 0.000021000);
		ethnodeserverconfig.transaction_units_min = (options.transaction_units_min ?  options.transaction_units_min : 2);


		// set chainid and networkid (not done at this time in cloneOnWeb3ProviderUrl 2021.05.16)
		var childsession = await this._getMonitoredSchemeSession(session, wallet, scheme);
		
		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
		var ethereumnodeaccessinstance = ethereumnodeaccessmodule.getEthereumNodeAccessInstance(childsession)

		if (options.chainid)
		ethnodeserverconfig.chainid = options.chainid;
		else
		ethnodeserverconfig.chainid = await ethereumnodeaccessinstance.web3_getChainId();

		if (options.networkid)
		ethnodeserverconfig.networkid = options.networkid;
		else
		ethnodeserverconfig.networkid = await ethereumnodeaccessinstance.web3_getNetworkId();

		// save scheme with modified parameters
		await scheme.save();

		// return scheme info
		var mvcclienwallet = global.getModuleObject('mvc-client-wallet');

		var schemeinfo = {uuid: scheme.getSchemeUUID()};

		mvcclienwallet._fillSchemeInfoFromScheme(schemeinfo, scheme);

		return schemeinfo;
	}

	async getSchemeTransactionInfo(sessionuuid, schemeuuid, feelevel = null) {
		console.log('OBSOLETE: Module.getSchemeTransactionInfo should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);

		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});


		var transactioninfo  = {};

		transactioninfo.gasLimit = scheme.getGasLimit(feelevel);
		transactioninfo.gasPrice = scheme.getGasPrice(feelevel);
		transactioninfo.avg_transaction_fee = this._getAverageTransactionFee(scheme, feelevel);
		transactioninfo.units_threshold = scheme.getTransactionUnitsThreshold(feelevel);
		
		var ethnodemodule = global.getModuleObject('ethnode');

		var weiamount = ethnodemodule.getWeiFromEther(transactioninfo.avg_transaction_fee);
		var avg_transaction = await this._createDecimalAmount(session, weiamount, 18);
		var credits_threshold = await avg_transaction.multiply(transactioninfo.units_threshold);

		transactioninfo.credits_threshold = await credits_threshold.toInteger();

		return transactioninfo;
	}

	async getSchemeList(sessionuuid, bRefresh) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var schemes = await _apicontrollers.getSchemeList(session, bRefresh);
		
		var schemeList = [];
		
		for (var i = 0; i < (schemes ? schemes.length : 0); i++) {
			/*let name = schemes[i].getName();
			let uuid = schemes[i].getSchemeUUID();
			let label = schemes[i].getLabel();
			let type = schemes[i].getSchemeType();
			
			schemeList.push({name: name, uuid: uuid, label: label, type: type});*/

			let schemeinfo = {};
			this._fillSchemeInfoFromScheme(schemeinfo, schemes[i]);
			
			schemeList.push(schemeinfo);
		}
		
		return schemeList;
	}
	
	async setSchemeLabel(sessionuuid, schemeuuid, label) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);
		
		scheme.setLabel(label);
		
		return scheme.save();
	}
	
	_fillSchemeInfoFromScheme(schemeinfo, scheme) {
		if (!scheme)
			return;
		
		schemeinfo.name = scheme.getName();
		schemeinfo.label = scheme.getLabel();
		schemeinfo.uuid = scheme.getSchemeUUID();
		schemeinfo.type = scheme.getSchemeType();
		schemeinfo.configurl = scheme.getConfigUrl();
		
		schemeinfo.xtra_data = scheme.getXtraData();
		
		var networkconfig = scheme.getNetworkConfig();
		
		schemeinfo.network = {};
		
		schemeinfo.network.restserver = {};
		schemeinfo.network.restserver.activate = networkconfig.restserver.activate;
		schemeinfo.network.restserver.rest_server_url = networkconfig.restserver.rest_server_url;
		schemeinfo.network.restserver.rest_server_api_path = networkconfig.restserver.rest_server_api_path;
		
		schemeinfo.network.authserver = {};
		schemeinfo.network.authserver.activate = networkconfig.authserver.activate;
		schemeinfo.network.authserver.rest_server_url = networkconfig.authserver.rest_server_url;
		schemeinfo.network.authserver.rest_server_api_path = networkconfig.authserver.rest_server_api_path;
		
		schemeinfo.network.keyserver = {};
		schemeinfo.network.keyserver.activate = networkconfig.keyserver.activate;
		schemeinfo.network.keyserver.rest_server_url = networkconfig.keyserver.rest_server_url;
		schemeinfo.network.keyserver.rest_server_api_path = networkconfig.keyserver.rest_server_api_path;

		if (networkconfig.ethnodeserver) {
			schemeinfo.network.ethnodeserver = {};
			schemeinfo.network.ethnodeserver.activate = networkconfig.ethnodeserver.activate;
			schemeinfo.network.ethnodeserver.rest_server_url = networkconfig.ethnodeserver.rest_server_url;
			schemeinfo.network.ethnodeserver.rest_server_api_path = networkconfig.ethnodeserver.rest_server_api_path;
			schemeinfo.network.ethnodeserver.web3_provider_url = networkconfig.ethnodeserver.web3_provider_url;
		}
		
	}
	
	async getSchemeTransactionUnitsThreshold(sessionuuid, schemeuuid) {
		console.log('OBSOLETE: Module.getSchemeTransactionUnitsThreshold should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);
		
		var threshold= scheme.getTransactionUnitsThreshold();
		
		return threshold;
	}

	
	async getSchemeInfoFromConfigUrl(sessionuuid, configurl) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromConfigUrl(session, configurl);
		
		var schemeinfo = {uuid: scheme.getSchemeUUID()};
		
		this._fillSchemeInfoFromScheme(schemeinfo, scheme);
		
		return schemeinfo;
	}

	async getSchemeInfoFromWeb3Url(sessionuuid, web3url) {
		console.log('OBSOLETE: Module.getSchemeInfoFromWeb3Url should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromWeb3Url(session, web3url);
		
		var schemeinfo = {uuid: scheme.getSchemeUUID()};
		
		this._fillSchemeInfoFromScheme(schemeinfo, scheme);
		
		return schemeinfo;
	}
	
	async getSchemeInfo(sessionuuid, schemeuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);
		
		var schemeinfo = {uuid: schemeuuid};
		
		this._fillSchemeInfoFromScheme(schemeinfo, scheme);
		
		return schemeinfo;
	}
	
	async canSchemeHandleConfigUrl(sessionuuid, schemeuuid, configurl) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		if (!configurl)
			return Promise.reject('configurl is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);
		
		var schemeconfigurl = scheme.getConfigUrl();
		
		if (schemeconfigurl && schemeconfigurl.toLowerCase() == configurl.toLowerCase())
			return true;
		else
			return false;
	}
	
	async canSchemeHandleWeb3Url(sessionuuid, schemeuuid, web3_provider_url) {
		console.log('OBSOLETE: Module.canSchemeHandleWeb3Url should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		if (!web3_provider_url)
			return Promise.reject('web3_provider_url is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);
		
		return scheme.canHandleWeb3ProviderUrl(web3_provider_url);
	}

	async oauth2AuthorizeUrl(sessionuuid, schemeuuid, params) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();
	
		var session = await _apicontrollers.getSessionObject(sessionuuid);
	
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);

		if (!scheme)
			return Promise.reject('can not find scheme with uuid ' + schemeuuid);

		// set network config
		//var network = scheme.getNetworkConfig();
		var network = this._getSchemeNetworkConfig(scheme);
				
		await _apicontrollers.setSessionNetworkConfig(session, network);

		// get authorize url
		const authorizeurl = await _apicontrollers.getOAuth2AuthorizeUrl(session, params)
		.catch((err) => {
			console.log('error in oauth2AuthorizeUrl ' + err);
		});

		return authorizeurl;
	}

	async _getUnitsFromCredits(session, scheme, credits) {
		var units = scheme.getTransactionUnits(credits);
		
		return units;
	}

	async getUnitsFromCredits(sessionuuid, schemeuuid, credits) {
		console.log('OBSOLETE: Module.getUnitsFromCredits should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);

		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not find scheme ' + schemeuuid);

		return this._getUnitsFromCredits(session, scheme, credits);
	}

	async getCreditsFromUnits(sessionuuid, schemeuuid, units) {
		console.log('OBSOLETE: Module.getCreditsFromUnits should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);

		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not find scheme ' + schemeuuid);

		return scheme.getTransactionCreditsAsync(units);
	}

	_canWalletHandleScheme(wallet, scheme) {
		if (!wallet || !scheme)
			return false;

		if (scheme.isRemote()) {
			var walletschemeuuid = wallet.getSchemeUUID();

			// TODO: we could look if authserver are the same
			if (walletschemeuuid && (walletschemeuuid === scheme.getSchemeUUID()))
				return true;
			else
				return false;
		}
		else {
			return true;
		}

	}

	async _getChildSessionOnScheme(parentsession, scheme) {
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		if (!parentsession)
			return Promise.reject('could not find create child of null session');

		var schemesessionmap = parentsession.getSessionVariable('schemesessionmap');
		
		if (!schemesessionmap) {
			schemesessionmap = Object.create(null);
			parentsession.setSessionVariable('schemesessionmap', schemesessionmap);
		}
		
		// we could look if a pre-existing session with corresponding web3providerurl could be re-used
		var schemeuuid = scheme.getSchemeUUID();

		if (schemesessionmap[schemeuuid])
			return schemesessionmap[schemeuuid];

		// else we create one and set it
		var childsession = await _apicontrollers.createChildSessionObject(parentsession);
		childsession.CLIENT_WALLET = this.current_version;

		if (!parentsession.CLIENT_WALLET)
			parentsession.CLIENT_WALLET = this.current_version;

		var networkconfig = scheme.getNetworkConfig();

		await _apicontrollers.setSessionNetworkConfig(childsession, networkconfig);

		schemesessionmap[schemeuuid] = childsession;

		return childsession;
	}

	async _getMonitoredSchemeSession(session, wallet, scheme) {
		var fetchsession;

		if (!scheme)
			return Promise.reject('scheme is not defined');

		if (scheme.isRemote()) {
			if (wallet) {
				var walletschemeuuid = wallet.getSchemeUUID();
				var schemeuuid = scheme.getSchemeUUID();
	
				if (this._canWalletHandleScheme(wallet, scheme)) {
					// use wallet session
					fetchsession = wallet._getSession();
				}
				else {
					return Promise.reject('ERR_MISSING_CREDENTIALS');
				}
			}
			else {
				return Promise.reject('ERR_MISSING_CREDENTIALS');
			}
		}
		else {
			if (wallet) {
				var walletsession = wallet._getSession();
				fetchsession = await this._getChildSessionOnScheme(walletsession, scheme);
			}
			else {
				fetchsession = await this._getChildSessionOnScheme(session, scheme);
			}
		}

		return fetchsession;
	}


	

	async _getRecommendedSchemeFeeLevel(session, wallet, scheme, tx_fee) {
		// standard fee level
		var	feelevel = {
			default_gas_limit_multiplier: 1,
			default_gas_price_multiplier: 1,
			avg_transaction_fee_multiplier: 1, 
			transaction_units_min_multiplier: 1
		};

		// get scheme transaction info
		var sessionuuid = session.getSessionUUID();
		var card_scheme = scheme;
		var tx_info = await this.getSchemeTransactionInfo(sessionuuid, card_scheme.uuid, feelevel);

		var gasLimit = tx_info.gasLimit;
		var gasPrice = tx_info.gasPrice;
		var avg_transaction_fee = tx_info.avg_transaction_fee;

		var gas_unit = (card_scheme && card_scheme.network && card_scheme.network.ethnodeserver && card_scheme.network.ethnodeserver.gas_unit ? parseInt(card_scheme.network.ethnodeserver.gas_unit) : 21000);
		var credit_cost_unit_ratio = (avg_transaction_fee * 1000000000000000000) / (gas_unit * gasPrice);

		// execution cost
		var units_exec_fee; 
		var credits_exec_fee;
		
		if (tx_fee.estimated_cost_credits) {
			credits_exec_fee = tx_fee.estimated_cost_credits;
			units_exec_fee = await this._getUnitsFromCredits(session, card_scheme, credits_exec_fee);
		}
		else {
			units_exec_fee = (tx_fee.estimated_cost_units ? Math.ceil(tx_fee.estimated_cost_units / credit_cost_unit_ratio) : 1);
			credits_exec_fee = await card_scheme.getTransactionCreditsAsync(units_exec_fee);
		}

		// max price
		var credits_max_fee = gasLimit * gasPrice;
		var units_max_fee =  await this._getUnitsFromCredits(session, card_scheme, credits_max_fee);

		if (units_exec_fee > units_max_fee)
			feelevel.default_gas_limit_multiplier = Math.ceil(units_exec_fee / units_max_fee);

		return feelevel;
	}

	async getRecommendedSchemeFeeLevel(sessionuuid, walletuuid, schemeuuid, tx_fee) {
		console.log('OBSOLETE: Module.getRecommendedSchemeFeeLevel should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');

		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
	
		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not find scheme ' + schemeuuid);
		
	
		return this._getRecommendedSchemeFeeLevel(session, wallet, scheme, tx_fee);
	}

	async computeSchemeTransactionFee(sessionuuid, walletuuid, schemeuuid, tx_fee, feelevel = null) {
		console.log('OBSOLETE: Module.computeSchemeTransactionFee should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');

		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
	
		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not find scheme ' + schemeuuid);
	
		// get scheme transaction info
		var card_scheme = scheme;
		var tx_info = await this.getSchemeTransactionInfo(sessionuuid, card_scheme.uuid, feelevel);

		var gasLimit = tx_info.gasLimit;
		var gasPrice = tx_info.gasPrice;
		var avg_transaction_fee = tx_info.avg_transaction_fee;

		var gas_unit = (card_scheme && card_scheme.network && card_scheme.network.ethnodeserver && card_scheme.network.ethnodeserver.gas_unit ? parseInt(card_scheme.network.ethnodeserver.gas_unit) : 21000);
		var credit_cost_unit_ratio = (avg_transaction_fee * gasPrice) / gas_unit;

		// execution cost
		var units_exec_fee; 
		var credits_exec_fee;
		
		if (tx_fee.estimated_cost_credits) {
			credits_exec_fee = tx_fee.estimated_cost_credits;
			units_exec_fee = await this._getUnitsFromCredits(session, card_scheme, credits_exec_fee);
		}
		else {
			units_exec_fee = (tx_fee.estimated_cost_units ? Math.ceil(tx_fee.estimated_cost_units / credit_cost_unit_ratio) : 1);
			credits_exec_fee = await card_scheme.getTransactionCreditsAsync(units_exec_fee);
		}

		// transferred value
		var units_transferred;
		var credits_transferred;

		if (tx_fee.transferred_credits) {
			credits_transferred = tx_fee.transferred_credits;
			units_transferred = await this._getUnitsFromCredits(session, card_scheme, credits_exec_fee);
		}
		else {
			units_transferred = tx_fee.transferred_credit_units;
			credits_transferred = await card_scheme.getTransactionCreditsAsync(units_transferred);
		}

		// max price
		var credits_max_fee = gasLimit * gasPrice;
		var units_max_fee =  await this._getUnitsFromCredits(session, card_scheme, credits_max_fee);

		// fill tx_fee
		tx_fee.tx_info = tx_info;

		tx_fee.estimated_fee = {};

		// estimated execution fee
		tx_fee.estimated_fee.execution_units = units_exec_fee; 
		tx_fee.estimated_fee.execution_credits = credits_exec_fee; 

		// estimated transaction total
		tx_fee.estimated_fee.total_credits = credits_exec_fee + credits_transferred; 
		tx_fee.estimated_fee.total_units = await this._getUnitsFromCredits(session, card_scheme, tx_fee.estimated_fee.total_credits); 

		// max fee
		tx_fee.estimated_fee.max_units = units_max_fee; 
		tx_fee.estimated_fee.max_credits = credits_max_fee; 

		// required balance
		if (tx_fee.estimated_fee.max_credits > tx_fee.estimated_fee.total_credits) {
			tx_fee.required_credits = tx_fee.estimated_fee.max_credits;
		}
		else {
			if (tx_fee.estimated_fee.max_credits >= tx_fee.estimated_fee.execution_credits)
				tx_fee.required_credits = tx_fee.estimated_fee.max_credits + credits_transferred; // because of "Insufficient funds for gas * price + value" web3 error
			else {
				tx_fee.required_credits = tx_fee.estimated_fee.total_credits; // won't go through because will reach gas limit
				tx_fee.limit_overdraft = true;
			}
		}
		
		tx_fee.required_units =  await this._getUnitsFromCredits(session, card_scheme, tx_fee.required_credits); 

		return tx_fee;
	}
	
	async canCompleteSchemeTransaction(sessionuuid, walletuuid, schemeuuid, fromprivatekey, tx_fee, feelevel = null) {
		console.log('OBSOLETE: Module.canCompleteSchemeTransaction should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');

		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');

		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
	
		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not find scheme ' + schemeuuid);
		
	
		var childsession = await this._getMonitoredSchemeSession(session, wallet, scheme);
		
		// get account for privatekey
		var account = childsession.createBlankAccountObject();
		if (!account)
			return Promise.reject('could not create account object');

		account.setPrivateKey(fromprivatekey);

		if (account.isPrivateKeyValid() !== true)
			return Promise.reject('invalid private key');

		const balance_transactioncredits = await _apicontrollers.getEthAccountTransactionCredits(childsession, account);
		const balance_transactionunits = await scheme.getTransactionUnitsAsync(balance_transactioncredits);
	
		// get transaction fee
		var tx_fee = await this.computeSchemeTransactionFee(sessionuuid, walletuuid, schemeuuid, tx_fee, feelevel);

		// check estimated cost is not above max credits (corresponds to tx_fee.limit_overdraft == true)
		if (tx_fee.estimated_fee.execution_credits > tx_fee.estimated_fee.max_credits) {
			return false;
		}

		// check balance in units is above requirement
		if (balance_transactionunits < tx_fee.required_units) {
			return false;
		}

		// check
		var tx_info = tx_fee.tx_info;
		var scheme_units_threshold = tx_info.units_threshold;
		var scheme_credits_threshold = tx_info.credits_threshold;

		if (scheme_credits_threshold > balance_transactioncredits) {
			if (tx_fee.threshold_enforced === true) {
				tx_fee.required_units = scheme_credits_threshold;
				return false;
			}
			else {
				tx_fee.threshold_unmet = true;
			}
		}


		return true;
	}

	async transferSchemeTransactionUnits(sessionuuid, walletuuid, schemeuuid, fromprivatekey, toaddress, units, feelevel = null) {
		console.log('OBSOLETE: Module.transferSchemeTransactionUnits should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');

		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
	
		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not find scheme ' + schemeuuid);

		// session on scheme	
		var childsession = await this._getMonitoredSchemeSession(session, wallet, scheme);
	
		// get account for privatekey
		var fromaccount = childsession.createBlankAccountObject();
		if (!fromaccount)
			return Promise.reject('could not create account object');

		fromaccount.setPrivateKey(fromprivatekey);

		if (fromaccount.isPrivateKeyValid() !== true)
			return Promise.reject('invalid private key');

		// create transaction object
		var transactioninfo = await this.getSchemeTransactionInfo(sessionuuid, schemeuuid);
		var transaction = _apicontrollers.createEthereumTransaction(childsession, fromaccount);
		
		// parameters
		var ethnodemodule = global.getModuleObject('ethnode');

		var weiamount = ethnodemodule.getWeiFromEther(transactioninfo.avg_transaction_fee);
		var ethamount = await this._createDecimalAmount(childsession, weiamount, 18);
		ethamount.multiply(units);
		var valuestring = await ethamount.toFixedString();

		transaction.setToAddress(toaddress);
		transaction.setValue(valuestring);

		// fee
		var fee = await _apicontrollers.createSchemeFee(scheme, feelevel);

		transaction.setGas(fee.gaslimit);
		transaction.setGasPrice(fee.gasPrice);

		
		const txhash = await _apicontrollers.sendEthereumTransaction(childsession, transaction)
		.catch((err) => {
			console.log('error in transferTransactionUnits: ' + err);
		});

		if (!txhash)
			return Promise.reject('could not send ethereum transaction');

		return txhash;	
	}


	async createSchemeERC20Token(sessionuuid, walletuuid, schemeuuid, fromprivatekey, erc20token, feelevel = null) {
		console.log('OBSOLETE: Module.createSchemeERC20Token should no longer be used!');
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');

		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
	
		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});

		if (!scheme)
			return Promise.reject('could not find scheme ' + schemeuuid);

		// session on scheme	
		var childsession = await this._getMonitoredSchemeSession(session, wallet, scheme);

		// get account for privatekey
		var fromaccount = childsession.createBlankAccountObject();
		if (!fromaccount)
			return Promise.reject('could not create account object');

		fromaccount.setPrivateKey(fromprivatekey);

		if (fromaccount.isPrivateKeyValid() !== true)
			return Promise.reject('invalid private key');
	
		// create transaction object
		var transaction = _apicontrollers.createEthereumTransaction(childsession, fromaccount);

		// fee
		var fee = await _apicontrollers.createSchemeFee(scheme, feelevel);

		transaction.setGas(fee.gaslimit);
		transaction.setGasPrice(fee.gasPrice);
		

		// create contract object
		var ethnodemodule = global.getModuleObject('ethnode');
		var erc20tokenmodule = global.getModuleObject('erc20');
	
		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();

		// unlock account
		var password;
		var unlocked =	await ethnodemodule.unlockAccount(childsession, fromaccount, password, 300)
		
		// create (local) erc20token for these values
		var data = [];
		
		data['name'] = erc20token.name;
		data['symbol'] = erc20token.symbol;
		data['decimals'] = erc20token.decimals;
		data['totalsupply'] = erc20token.totalsupply;

		var erc20token_contract = erc20tokencontrollers.createERC20TokenObject(childsession, data);
	
		// deploy
		var gasLimit = transaction.getGas();
		var gasPrice = transaction.getGasPrice();
		var contract_address = await erc20token_contract.deploy(fromaccount, gasLimit, gasPrice);

		// relock account
		var relocked = await ethnodemodule.lockAccount(childsession, fromaccount);

		var tokenaddress = contract_address;
		var tokenuuid = erc20token_contract.getUUID();

		var result = {uuid: tokenuuid, address: tokenaddress};

		return result;


		return tokenuuid;
	}
	
	//
	// Wallet functions
	//

	async isWalletLocked(sessionuuid, walletuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		return wallet.isLocked();
	}

	async unlockWallet(sessionuuid, walletuuid, passphrase) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		if (!session)
			return Promise.reject('could not create session ' + sessionuuid);

		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
	
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);

		return wallet.unlock(passphrase);
	}
	
	async setWalletLabel(sessionuuid, walletuuid, label) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		wallet.setLabel(label);
		
		return wallet.save();
	}
	
	_fillWalletInfo(walletinfo, wallet) {
		if (!wallet)
			return;
		
		walletinfo.uuid = wallet.getWalletUUID();
		
		walletinfo.authname = wallet.getAuthName();
		walletinfo.name = wallet.getAuthName();
		walletinfo.type = wallet.getWalletType();
		walletinfo.label = wallet.getLabel();
		walletinfo.schemeuuid = wallet.getSchemeUUID();

		walletinfo.ownername = wallet.getOwnerName();
		walletinfo.owneremail = wallet.getOwnerEmail();
		
		walletinfo.xtra_data = wallet.getXtraData();
	}
	
	async getWalletInfo(sessionuuid, walletuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');


		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var walletinfo = {uuid: walletuuid};
		
		if (wallet) {
			this._fillWalletInfo(walletinfo, wallet);
		}
		
		return walletinfo;
	}

	async getWalletUserInfo(sessionuuid, walletuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);

		if (!session)
			return Promise.reject('could not create session ' + sessionuuid);

		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
	
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);

		var walletsession = wallet._getSession();

		if (!walletsession)
			return Promise.reject('could not find session for wallet ' + walletuuid);

		return _apicontrollers.getUserInfo(walletsession);
	}
	

	
	async getFromWallet(sessionuuid, walletuuid, key) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		return _apicontrollers.getFromWallet(session, wallet, key);
	}
	
	async putInWallet(sessionuuid, walletuuid, key, value) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		return _apicontrollers.putInWallet(session, wallet, key, value);
	}

	async makeWallet(sessionuuid, authname, schemeuuid, password) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);

		var	scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid)
		.catch(err => {});


		var wallet_new;

		if (!scheme || (scheme.isRemote() !== true))
			wallet_new =  await _apicontrollers.createWallet(session, authname, password);
		else
			wallet_new =  await _apicontrollers.makeWallet(session, authname, schemeuuid);

		if (wallet_new) {
			let unlocked = await wallet_new.unlock(password);
			
			if (unlocked) {
				// we add additional information like ownername and owner email
				let walletsession = wallet_new._getSession();
				let walletuser = walletsession.getSessionUserObject();

				if (walletuser) {
					wallet_new.setOwnerName(walletuser.getUserName());
					wallet_new.setOwnerEmail(walletuser.getUserEmail());
				}

				await wallet_new.save();
			}
			else {
				throw new Error('wrong credentials');
			}

			return wallet_new;
		}
		else
			throw new Error('could not create wallet');
	}

	async makeWalletFromSession(sessionuuid, schemeuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var commonmodule = global.getModuleObject('common');

		// look if session already exists
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		if (!session) {
			session = await commonmodule.createBlankSessionObject();
			session.setSessionUUID(sessionuuid);
		}

		if (!session)
			return Promise.reject('could not create session ' + sessionuuid);

		var walletmodule = global.getModuleObject('wallet');
		var Wallet = global.getModuleClass('wallet', 'Wallet');

		var scheme = await walletmodule.getSchemeFromUUID(session, schemeuuid);

		if (!scheme)
			throw new Error('could not find scheme');

		// set network config to the session
		//var network = scheme.getNetworkConfig();
		var network = this._getSchemeNetworkConfig(scheme);
				
		await _apicontrollers.setSessionNetworkConfig(session, network);

		let isanonymous = await this._isAnonymousAsync(session);
		if (isanonymous)
			return Promise.reject('session needs to be authenticated');

		let user = session.getSessionUserObject();

		// we create a new wallet
		var wallettype = scheme.getSchemeType();

		var walletjson = {};
		walletjson.type = wallettype;
		walletjson.uuid = session.guid();;
		walletjson.schemeuuid = schemeuuid;
		walletjson.authname = scheme.getName();
		walletjson.label = scheme.getName();

		walletjson.ownername = (user ? user.getUserName() : '');
		walletjson.owneremail = (user ? user.getUserEmail() : '');
	

		const wallet_new =  Wallet.readFromJson(walletmodule, session, walletjson);


		if (wallet_new) {
			// we attach the session to the wallet
			await this._attachSessionToWallet(session, wallet_new);
			
			// and save it
			await wallet_new.save();

			return wallet_new;
		}
		else
			throw new Error('could not create wallet');
	}

	async _isAnonymousAsync(session) {
		// we clean authkey isSessionAnonymous_hook to make it really async
		var global = this.global;

		var authkeymodule = global.getModuleObject('authkey');

		var authkeyinterface = authkeymodule.getAuthKeyInterface();
		var currentanonymousflag = (session.user == null);

		var sessionstatus = await authkeyinterface.session_status(session);

		if (sessionstatus['isauthenticated'] === false) {
			if (currentanonymousflag === false) {
				session.disconnectUser();
			}
		}
		else {
			if (currentanonymousflag === true) {
				var res = await authkeyinterface.load_user_in_session(session);

				var authenticated = (res['status'] == '1' ? true : false);
							
				if (authenticated) {
					// authenticated (and crypto-keys have been loaded)
					// we get list of accounts (that could be encrypted)
					await authkeymodule._initializeAccounts(session);
					
				}
			}
		}

		return sessionstatus['isanonymous'];
	}

	async _attachSessionToWallet(session, wallet) {
		wallet.walletsession = session;
		session.WALLET_ATTACHED = wallet.uuid;

		if (session.user) {
			wallet.locked = false;
			await wallet._onUnlock();

			// we check wallet user name and email
			var bSave = false;

			var session_username = session.user.getUserName();
			var session_useremail = session.user.getUserEmail();

			var wallet_ownername = wallet.getOwnerName();
			var wallet_owneremail = wallet.getOwnerEmail();

			if (!wallet_ownername) {
				if (session_username) {
					wallet.setOwnerName(session_username);
					bSave = true;
				}
			}
			else if (session_username && (session_username != wallet_ownername)) {
				wallet.setOwnerName(session_username);
				bSave = true;
			}

			if (!wallet_owneremail) {
				if (session_useremail) {
					wallet.setOwnerEmail(session_useremail);
					bSave = true;
				}
			}
			else if (session_useremail && (session_useremail != wallet_owneremail)) {
				wallet.setOwnerEmail(session_useremail);
				bSave = true;
			}

			if (bSave)
			await wallet.save();
		}
	}

	async attachSessionToWallet(sessionuuid, walletuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var commonmodule = global.getModuleObject('common');

		// look if session already exists
		var session = await _apicontrollers.getSessionObject(sessionuuid);

		if (!session) {
			session = await commonmodule.createBlankSessionObject();
			session.setSessionUUID(sessionuuid);
		}

		if (!session)
			return Promise.reject('could not create session ' + sessionuuid);

		session.setSessionUUID(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
	
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);

		var scheme = await wallet.getScheme();

		if (!scheme)
			throw new Error('could not find scheme for wallet ' + walletuuid);

		// set network config to the session
		//var network = scheme.getNetworkConfig();
		var network = this._getSchemeNetworkConfig(scheme);
				
		await _apicontrollers.setSessionNetworkConfig(session, network);

		let isanonymous = await this._isAnonymousAsync(session);
		if (isanonymous)
			return Promise.reject('session needs to be authenticated');


		await this._attachSessionToWallet(session, wallet);
	}

	async lockWallet(sessionuuid, walletuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var commonmodule = global.getModuleObject('common');

		var session = await commonmodule.createBlankSessionObject();

		if (!session)
			return Promise.reject('could not create session ' + sessionuuid);

		session.setSessionUUID(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
	
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);

		return wallet.lock();
	}
	
	//
	// Card functions
	//

	async _getMonitoredCardSession(session, wallet, card) {
		var cardsession = card._getSession();

		return cardsession;
	}



	async getCardList(sessionuuid, walletuuid, bRefresh) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		

		var cards = await wallet.getCardList(bRefresh);
		
		var array = [];
				
		for (var i = 0; i < (cards ? cards.length : 0); i++) {
			var carduuid = cards[i].getCardUUID();
			var cardinfo = {uuid: carduuid};
			
			this._fillCardInfo(cardinfo, cards[i]);
			
			array.push(cardinfo);
		}
		
		return array;
	}

	async getCardListOnWeb3Url(sessionuuid, walletuuid, web3url) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);

		
		var mvcmodule = this;

		var cards = await wallet.getCardList(true);

		var array = [];
			
		for (var i = 0; i < (cards ? cards.length : 0); i++) {
			var _crduuid = cards[i].getCardUUID();
			var cardinfo = {uuid: _crduuid};
			
			var bCanHandle = await mvcmodule.canCardHandleERC20TokensOn(sessionuuid, walletuuid, _crduuid, web3url);
			
			if (bCanHandle) {
				mvcmodule._fillCardInfo(cardinfo, cards[i]);
				
				array.push(cardinfo);
			}
		}
			
		return array;
	}

	
	async getCardSiblings(sessionuuid, walletuuid, carduuid, bRefresh = true) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');


		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		var cardscheme = card.getScheme();
		var web3url = cardscheme.getWeb3ProviderUrl();
		
		var cards = await wallet.getCardList(bRefresh);
		
		var array = [];
				
		for (var i = 0; i < (cards ? cards.length : 0); i++) {
			var _crduuid = cards[i].getCardUUID();
			var cardinfo = {uuid: carduuid};
			
			var bCanHandle = await this.canCardHandleERC20TokensOn(sessionuuid, walletuuid, _crduuid, web3url);
			
			if (bCanHandle) {
				this._fillCardInfo(cardinfo, cards[i]);
				
				array.push(cardinfo);
			}
		}
		
		return array;
	}
	
	_fillCardInfo(cardinfo, card) {
		if (!card)
			return;
		
		cardinfo.uuid = card.getCardUUID();
		cardinfo.authname = card.getAuthName();
		cardinfo.name = card.getAuthName();
		cardinfo.address = card.getAddress();
		cardinfo.type = card.getCardType();
		cardinfo.label = card.getLabel();
		cardinfo.schemeuuid = card.getSchemeUUID();
		cardinfo.walletuuid = card.getWalletUUID();
		cardinfo.publickeys = card.getPublicKeys();
		
		cardinfo.xtra_data = card.getXtraData();
	}
	
	async getCardInfo(sessionuuid, walletuuid, carduuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');


		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		var cardinfo = {uuid: carduuid};
		
		if (card) {
			this._fillCardInfo(cardinfo, card);
		}
		
		return cardinfo;
	}
	
	async getContactInfoFromCard(sessionuuid, walletuuid, carduuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');


		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		var contact = await _apicontrollers.getWalletCardAsContact(session, wallet, card);
		var contactuuid = contact.getContactUUID();
		
		return this.getContactInfo(sessionuuid, contactuuid);
	}

	
	async getCardInfoFromContact(sessionuuid, walletuuid, contactuuid) { 
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!contactuuid)
			return Promise.reject('contact uuid is undefined');


		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		var contact = await _apicontrollers.getContactFromUUID(session, contactuuid);
		
		if (contact.getContactType() != 10)
			return Promise.reject('contact is of the wrong type');

		var card = await _apicontrollers.getWalletCardFromContact(session, wallet, contact)
		.catch(err => {});
		
		if (card) {
			var cardinfo = {};
			
			this._fillCardInfo(cardinfo, card);
			
			return cardinfo;
		}
	}
	
	async getFirstCardInfoWithAddress(sessionuuid, walletuuid, address) { 
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!address)
			return Promise.reject('address is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);

		var card = await wallet.getFirstCardWithAddress(address)
		.catch(err => {});
		
		if (card) {
			var cardinfo = {};
			
			this._fillCardInfo(cardinfo, card);
			
			return cardinfo;
		}
	}
	
	async getCardsWithAddress(sessionuuid, walletuuid, address) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!address)
			return Promise.reject('address is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);

		var cards = await wallet.getCardsWithAddress(address)
		.catch(err => {});
		
		var array = [];
		
		for (var i = 0; i < (cards ? cards.length : 0); i++) {
			var cardinfo = {};
			
			this._fillCardInfo(cardinfo, cards[i]);
			
			array.push(cardinfo);
		}
		
		return array;
	}

	async getCardInfoFromAddressOnScheme(sessionuuid, walletuuid, schemeuuid, address) { 
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);


		var card = await wallet.getCardFromAddressOnScheme(address, scheme)
		.catch(err => {});
		
		if (card) {
			var cardinfo = {};
			
			this._fillCardInfo(cardinfo, card);
			
			return cardinfo;
		}
	}

	
	async createCardFromPrivatekey(sessionuuid, walletuuid, privatekey, configurl) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var scheme = await _apicontrollers.importScheme(session, configurl)
		.catch(err => {
			return null;
		});
		
		if (!scheme)
			return null;

		var card = await wallet.createCardFromPrivatekey(scheme, privatekey)
		.catch(err => {
			return null;
		});
		
		if (!card)
			return null;
		
		let carduuid = card.getCardUUID();
		
		let cardinfo = await this.getCardInfo(sessionuuid, walletuuid, carduuid);
		
		return cardinfo;
	}
	
	async createCardFromPrivatekeyOn(sessionuuid, walletuuid, privatekey, web3_provider_url) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		// search if a local scheme has this web3_provider_url
		var scheme;
		var localschemes = await _apicontrollers.getLocalSchemeList(session, true);
		var bCreateScheme = true;
		
		for (var i = 0; i < localschemes.length; i++) {
			// compare with web3_provider_url to see if we have a scheme that matches
			var networkconfig = localschemes[i].getNetworkConfig()
			if (networkconfig.ethnodeserver && (networkconfig.ethnodeserver.web3_provider_url == web3_provider_url)) {
				bCreateScheme = false;
				scheme = localschemes[i];
				break;
			}
		}
		
		if (bCreateScheme) {
			// else we create a local scheme and save it
			var defaultlocalscheme = await _apicontrollers.getDefaultScheme(session, 0);
			var scheme = await defaultlocalscheme.cloneOnWeb3ProviderUrl(web3_provider_url);
		}
		
		var card = await wallet.createCardFromPrivatekey(scheme, privatekey)
		.catch(err => {
			return null;
		});
		
		if (!card)
			return null;
		
		let carduuid = card.getCardUUID();
		
		let cardinfo = await this.getCardInfo(sessionuuid, walletuuid, carduuid);
		
		return cardinfo;
	}
	
	async canCardHandleERC20TokensOn(sessionuuid, walletuuid, carduuid, web3_provider_url) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		let cardinfo = await this.getCardInfo(sessionuuid, walletuuid, carduuid);
		let schemeinfo = await this.getSchemeInfo(sessionuuid, cardinfo.schemeuuid);
		
		if (!schemeinfo.network.ethnodeserver)
			return false;
			
		if (schemeinfo.network.ethnodeserver.web3_provider_url != web3_provider_url)
			return false;
		else
			return true;
	}
	
	async cloneCardOn(sessionuuid, walletuuid, carduuid, web3_provider_url) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		var unlock = await card.unlock();
		
		// simple scheme duplication (we do not look for a pre-existing
		// scheme that could match)
		var cardscheme = card.getScheme();
		
		var newscheme = await cardscheme.cloneOnWeb3ProviderUrl(web3_provider_url);
		
		var clonedcard = await wallet.cloneCard(card, newscheme);
		
		return this.getCardInfo(sessionuuid, walletuuid, clonedcard.getCardUUID());
	}

	async cloneCard(sessionuuid, walletuuid, carduuid, schemeuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		if (!schemeuuid)
			return Promise.reject('scheme uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		var unlock = await card.unlock();
		
		var scheme = await _apicontrollers.getSchemeFromUUID(session, schemeuuid);

		var clonedcard = await wallet.cloneCard(card, scheme);
		
		return this.getCardInfo(sessionuuid, walletuuid, clonedcard.getCardUUID());
	}

	async topUpCard(sessionuuid, walletuuid, carduuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');


		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		var topinfo = await card.topUpCard();
		
		return topinfo;
	}
	
	async getCardSchemeInfo(sessionuuid, walletuuid, carduuid) {
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var mvcmodule = this;

		var cardinfo = await mvcmodule.getCardInfo(sessionuuid, walletuuid, carduuid);

		var schemeinfo = await mvcmodule.getSchemeInfo(sessionuuid, cardinfo.schemeuuid);

		return schemeinfo;
	}

	async getCreditBalance(sessionuuid, walletuuid, carduuid) {
		
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');


		var _apicontrollers = this._getClientAPI();
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		
		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		var transactioncredits = await card.getTransactionCredits();
		var transactionunits = await card.getTransactionUnits();
		
		var credits = {transactioncredits: transactioncredits, transactionunits: transactionunits};

		// add threshold		
		var schemeuuid = card.getSchemeUUID();

		credits.threshold = await this.getSchemeTransactionUnitsThreshold(sessionuuid, schemeuuid);

		return credits;

	}

	async transferTransactionUnits(sessionuuid, walletuuid, cardfromuuid, cardtouuid, units, feelevel = null) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!cardfromuuid)
			return Promise.reject('from card uuid is undefined');
		
		if (!cardtouuid)
			return Promise.reject('to card uuid is undefined');
		
		
		var global = this.global;
		var mvcmodule = this;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
		
		var fromcard = await wallet.getCardFromUUID(cardfromuuid);
		
		if (!fromcard)
			return Promise.reject('could not find card ' + cardfromuuid);

		var tocard = await wallet.getCardFromUUID(cardtouuid);
	
		if (!tocard)
			return Promise.reject('could not find card ' + cardtouuid);
	
	
		var fromaccount = fromcard._getSessionAccountObject();

		if (!fromaccount)
			return Promise.reject('card has no private key ' + cardfromuuid);
		
		var cardsession = await this._getMonitoredCardSession(session, wallet, fromcard);
		var from_card_scheme = fromcard.getScheme();

		// TODO: for version >= 0.20.7 use call to scheme
		//var avg_transaction_fee = from_card_scheme.getAverageTransactionFee();
		var from_card_scheme_uuid = from_card_scheme.getSchemeUUID();
		var transactioninfo = await this.getSchemeTransactionInfo(sessionuuid, from_card_scheme.uuid);
		var avg_transaction_fee = transactioninfo.avg_transaction_fee; // end TODO

		// create transaction object
		var transaction = _apicontrollers.createEthereumTransaction(cardsession, fromaccount);
		
		// parameters
		var ethnodemodule = global.getModuleObject('ethnode');

		var toaddress = tocard.getAddress();
		var weiamount = ethnodemodule.getWeiFromEther(transactioninfo.avg_transaction_fee);
		var ethamount = await this._createDecimalAmount(cardsession, weiamount, 18);
		ethamount.multiply(units);
		var valuestring = await ethamount.toFixedString();

		transaction.setToAddress(toaddress);
		transaction.setValue(valuestring);

		// fee
		var fee = await _apicontrollers.createSchemeFee(from_card_scheme, feelevel);

		transaction.setGas(fee.gaslimit);
		transaction.setGasPrice(fee.gasPrice);

		
		const txhash = await _apicontrollers.sendEthereumTransaction(cardsession, transaction)
		.catch((err) => {
			console.log('error in transferTransactionUnits: ' + err);
		});

		if (!txhash)
		return Promise.reject('could not send ethereum transaction');

		return txhash;
	}

	async _getRecommendedFeeLevel(session, wallet, card, tx_fee) {
		// standard fee level
		var	feelevel = {
			default_gas_limit_multiplier: 1,
			default_gas_price_multiplier: 1,
			avg_transaction_fee_multiplier: 1, 
			transaction_units_min_multiplier: 1
		};

		// get scheme transaction info
		var sessionuuid = session.getSessionUUID();
		var card_scheme = card.getScheme();
		var tx_info = await this.getSchemeTransactionInfo(sessionuuid, card_scheme.uuid, feelevel);

		var gasLimit = tx_info.gasLimit;
		var gasPrice = tx_info.gasPrice;
		var avg_transaction_fee = tx_info.avg_transaction_fee;

		var gas_unit = (card_scheme && card_scheme.network && card_scheme.network.ethnodeserver && card_scheme.network.ethnodeserver.gas_unit ? parseInt(card_scheme.network.ethnodeserver.gas_unit) : 21000);
		var credit_cost_unit_ratio = (avg_transaction_fee * 1000000000000000000) / (gas_unit * gasPrice);

		// execution cost
		var units_exec_fee; 
		var credits_exec_fee;
		
		if (tx_fee.estimated_cost_credits) {
			credits_exec_fee = tx_fee.estimated_cost_credits;
			units_exec_fee = await this._getUnitsFromCredits(session, card_scheme, credits_exec_fee);
		}
		else {
			units_exec_fee = (tx_fee.estimated_cost_units ? Math.ceil(tx_fee.estimated_cost_units / credit_cost_unit_ratio) : 1);
			credits_exec_fee = await card_scheme.getTransactionCreditsAsync(units_exec_fee);
		}

		// max price
		var credits_max_fee = gasLimit * gasPrice;
		var units_max_fee =  await this._getUnitsFromCredits(session, card_scheme, credits_max_fee);

		if (units_exec_fee > units_max_fee)
			feelevel.default_gas_limit_multiplier = Math.ceil(units_exec_fee / units_max_fee);

		return feelevel;
	}

	async getRecommendedFeeLevel(sessionuuid, walletuuid, carduuid, tx_fee) {
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
	
		var card = await wallet.getCardFromUUID(carduuid);

		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		return this._getRecommendedFeeLevel(session, wallet, card, tx_fee);
	}

	async computeTransactionFee(sessionuuid, walletuuid, carduuid, tx_fee, feelevel = null) {
		var global = this.global;
		var _apicontrollers = this._getClientAPI();

		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		if (!session)
			return Promise.reject('could not find session ' + sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return Promise.reject('could not find wallet ' + walletuuid);
	
		var card = await wallet.getCardFromUUID(carduuid);

		if (!card)
			return Promise.reject('could not find card ' + carduuid);

		// get scheme transaction info
		var card_scheme = card.getScheme();
		var tx_info = await this.getSchemeTransactionInfo(sessionuuid, card_scheme.uuid, feelevel);

		var gasLimit = tx_info.gasLimit;
		var gasPrice = tx_info.gasPrice;
		var avg_transaction_fee = tx_info.avg_transaction_fee;

		var gas_unit = (card_scheme && card_scheme.network && card_scheme.network.ethnodeserver && card_scheme.network.ethnodeserver.gas_unit ? parseInt(card_scheme.network.ethnodeserver.gas_unit) : 21000);
		var credit_cost_unit_ratio = (avg_transaction_fee * gasPrice) / gas_unit;

		// execution cost
		var units_exec_fee; 
		var credits_exec_fee;
		
		if (tx_fee.estimated_cost_credits) {
			credits_exec_fee = tx_fee.estimated_cost_credits;
			units_exec_fee = await this._getUnitsFromCredits(session, card_scheme, credits_exec_fee);
		}
		else {
			units_exec_fee = (tx_fee.estimated_cost_units ? Math.ceil(tx_fee.estimated_cost_units / credit_cost_unit_ratio) : 1);
			credits_exec_fee = await card_scheme.getTransactionCreditsAsync(units_exec_fee);
		}

		// transferred value
		var units_transferred;
		var credits_transferred;

		if (tx_fee.transferred_credits) {
			credits_transferred = tx_fee.transferred_credits;
			units_transferred = await this._getUnitsFromCredits(session, card_scheme, credits_exec_fee);
		}
		else {
			units_transferred = tx_fee.transferred_credit_units;
			credits_transferred = await card_scheme.getTransactionCreditsAsync(units_transferred);
		}

		// max price
		var credits_max_fee = gasLimit * gasPrice;
		var units_max_fee =  await this._getUnitsFromCredits(session, card_scheme, credits_max_fee);

		// fill tx_fee
		tx_fee.tx_info = tx_info;

		tx_fee.estimated_fee = {};

		// estimated execution fee
		tx_fee.estimated_fee.execution_units = units_exec_fee; 
		tx_fee.estimated_fee.execution_credits = credits_exec_fee; 

		// estimated transaction total
		tx_fee.estimated_fee.total_credits = credits_exec_fee + credits_transferred; 
		tx_fee.estimated_fee.total_units = await this._getUnitsFromCredits(session, card_scheme, tx_fee.estimated_fee.total_credits); 

		// max fee
		tx_fee.estimated_fee.max_units = units_max_fee; 
		tx_fee.estimated_fee.max_credits = credits_max_fee; 

		// required balance
		if (tx_fee.estimated_fee.max_credits > tx_fee.estimated_fee.total_credits) {
			tx_fee.required_credits = tx_fee.estimated_fee.max_credits;
		}
		else {
			if (tx_fee.estimated_fee.max_credits >= tx_fee.estimated_fee.execution_credits)
				tx_fee.required_credits = tx_fee.estimated_fee.max_credits + credits_transferred; // because of "Insufficient funds for gas * price + value" web3 error
			else {
				tx_fee.required_credits = tx_fee.estimated_fee.total_credits; // won't go through because will reach gas limit
				tx_fee.limit_overdraft = true;
			}
		}
		
		tx_fee.required_units =  await this._getUnitsFromCredits(session, card_scheme, tx_fee.required_credits); 

		return tx_fee;
	}

	
	//
	// Token Accounts function
	//

	async getWalletERC20TokenAccountList(sessionuuid, walletuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return null;

		var tokenaccountarray = await wallet.getTokenAccountList(true);
		
		var tokenaccounts = [];
		
		for (var i = 0; i < tokenaccountarray.length; i++) {
			var tokenaccount = tokenaccountarray[i];
			var carduuid = tokenaccount.getCard().getCardUUID();
			var tokenaccountuuid = tokenaccount.getTokenAccountUUID();
			
			var tokenaccountinfo = await this.getERC20TokenAccountInfo(sessionuuid, walletuuid, carduuid, tokenaccountuuid);
			
			tokenaccounts.push(tokenaccountinfo);
		}
		
		return tokenaccounts;
	}
	
	async getWalletERC20TokenAccountInfo(sessionuuid, walletuuid, tokenaccountuuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!tokenaccountuuid)
			return Promise.reject('token account uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		if (!wallet)
			return null;

		var tokenaccount = await wallet.getTokenAccountFromUUID(tokenaccountuuid);
		
		if (!tokenaccount)
			return null;
		
		var carduuid = tokenaccount.getCard().getCardUUID();
		
		var tokenaccountinfo = await this.getERC20TokenAccountInfo(sessionuuid, walletuuid, carduuid, tokenaccountuuid);
		
		return tokenaccountinfo;
	}



	async getCardERC20TokenAccountList(sessionuuid, walletuuid, carduuid) {
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');
		
		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		var unlock = await card.unlock();
		
		var tokenaccounts = [];
		
		var tokenaccountlist = await card.getTokenAccountList(true);
		
		if (!tokenaccountlist)
			return null;
		
		for (var i = 0; i < tokenaccountlist.length; i++) {
			var tokenaccountuuid = tokenaccountlist[i].getTokenAccountUUID();
			var tokenaccount = await this.getERC20TokenAccountInfo(sessionuuid, walletuuid, carduuid, tokenaccountuuid)
			.catch(err => {});
			
			tokenaccounts.push(tokenaccount);
		}
		
		return tokenaccounts;
	}
	
	_getStatusString(status) {
		var global = this.global;
		
		if (!this.Contracts) {
			// Contracts class
			var commonmodule = this.global.getModuleObject('common');
			var ethnodemodule = global.getModuleObject('ethnode');
			
			this.Contracts = ethnodemodule.Contracts;
		}
		
		switch(status) {
			case this.Contracts.STATUS_LOST:
				return global.t('lost');
			case this.Contracts.STATUS_NOT_FOUND:
				return global.t('not found');
			case this.Contracts.STATUS_UNKOWN:
				return global.t('unknown');
			case this.Contracts.STATUS_LOCAL:
				return global.t('local');
			case this.Contracts.STATUS_SENT:
				return global.t('sent');
			case this.Contracts.STATUS_PENDING:
				return global.t('pending');
			case this.Contracts.STATUS_DEPLOYED:
				return global.t('deployed');
			case this.Contracts.STATUS_CANCELLED:
				return global.t('cancelled');
			case this.Contracts.STATUS_REJECTED:
				return global.t('rejected');
			case this.Contracts.STATUS_ON_CHAIN:
				return global.t('on chain');
			default:
				return global.t('undefined');
		}
		
	}
	
	async _fillERC20TokenAccountInfo(tokenaccountinfo, tokenaccount) {
		if (!tokenaccount)
			return;
		
		tokenaccountinfo.uuid = tokenaccount.getTokenAccountUUID();
		
		tokenaccountinfo.label = tokenaccount.getLabel();
		tokenaccountinfo.name = tokenaccount.getName();
		
		tokenaccountinfo.symbol = tokenaccount.getSymbol();
		tokenaccountinfo.decimals = tokenaccount.getDecimals();
		tokenaccountinfo.totalsupply = tokenaccount.getTotalSupply();
		tokenaccountinfo.description = tokenaccount.getDescription();
		
		tokenaccountinfo.address = tokenaccount.getTokenAddress();
		
		tokenaccountinfo.tokenuuid = tokenaccount.getToken().getTokenUUID();
		tokenaccountinfo.carduuid = tokenaccount.getCard().getCardUUID();
		tokenaccountinfo.schemeuuid = tokenaccount.getCard().getSchemeUUID();
		
		tokenaccountinfo.xtra_data = tokenaccount.getXtraData();

		// web3 provider url
		var token = tokenaccount.getToken();
		tokenaccountinfo.web3_provider_url = token.getWeb3ProviderUrl();
		tokenaccountinfo.status = token.getLiveStatus();
		tokenaccountinfo.statusstring = this._getStatusString(tokenaccountinfo.status);
		

		// with await
		
		// position
		tokenaccountinfo.position = await tokenaccount.getPosition();
		
	}

	
	async getERC20TokenAccountInfo(sessionuuid, walletuuid, carduuid, tokenaccountuuid) {
		
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');

		if (!tokenaccountuuid)
			return Promise.reject('token account uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		var unlock = await card.unlock();
		
		var tokenaccount = await card.getTokenAccountFromUUID(tokenaccountuuid);
		
		var tokenaccountinfo = {uuid: tokenaccountuuid};
		
		await this._fillERC20TokenAccountInfo(tokenaccountinfo, tokenaccount);
		
		return tokenaccountinfo;
	}
	
	async importERC20TokenAccount(sessionuuid, walletuuid, carduuid, tokenuuid) {
		
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!carduuid)
			return Promise.reject('card uuid is undefined');

		if (!tokenuuid)
			return Promise.reject('token uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var card = await wallet.getCardFromUUID(carduuid);
		var unlock = await card.unlock();
		
		var tokenaccount = await card.importTokenAccount(tokenuuid);
		
		var tokenaccountinfo = {};

		if (tokenaccount) {
			await this._fillERC20TokenAccountInfo(tokenaccountinfo, tokenaccount);
		}

		return tokenaccountinfo;
	}
	
	//
	// Transactions functions
	//

	_fillTransactionInfo(transactioninfo, transaction) {
		if (!transaction)
			return;
		
		transactioninfo.uuid = transaction.getTransactionUUID();
		transactioninfo.walletuuid = transaction.getWalletUUID();
		transactioninfo.carduuid = transaction.getCardUUID();
		transactioninfo.transactionhash = transaction.getTransactionHash();
		transactioninfo.label = transaction.getLabel();
		transactioninfo.type = transaction.getOrigin();
		transactioninfo.from = transaction.getFrom();
		transactioninfo.to = transaction.getTo();
		transactioninfo.creationdate = transaction.getCreationDate();
		transactioninfo.value = transaction.getValue();
		transactioninfo.status = transaction.getStatus();
		transactioninfo.xtra_data = transaction.getXtraData();
		
	}
	
	async getTransactionInfo(sessionuuid, walletuuid, transactionuuid) {
		
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!walletuuid)
			return Promise.reject('wallet uuid is undefined');
		
		if (!transactionuuid)
			return Promise.reject('token account uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var wallet = await _apicontrollers.getWalletFromUUID(session, walletuuid);
		
		var transactioninfo = {uuid: transactionuuid};
		
		var transaction = await wallet.getTransactionFromUUID(transactionuuid);
		
		if (transaction) {
			this._fillTransactionInfo(transactioninfo, transaction);
		}
		
		
		return transactioninfo;
	}
	

	//
	// Contacts functions
	//

	_fillContactInfo(contactinfo, contact) {
		if (!contact)
			return;
		
		contactinfo.name = contact.getName();
		contactinfo.label = contact.getLabel();
		contactinfo.address = contact.getAddress();
		contactinfo.email = contact.getEmail();
		contactinfo.phone = contact.getPhone();
		contactinfo.type = contact.getContactType();
		contactinfo.rsa_public_key = contact.getRsaPublicKey();
		
		contactinfo.xtra_data = contact.getXtraData();
	}
	
	async getContactInfo(sessionuuid, contactuuid) {
		
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!contactuuid)
			return Promise.reject('contact uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var contact = await _apicontrollers.getContactFromUUID(session, contactuuid);
		
		var contactinfo = {uuid: contactuuid};
		
		if (contact) {
			this._fillContactInfo(contactinfo, contact);
		}
		
		
		return contactinfo;
	}
	
	async setContactLabel(sessionuuid, contactuuid, label) {
		
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		if (!contactuuid)
			return Promise.reject('contact uuid is undefined');

		var _apicontrollers = this._getClientAPI();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var contact = await _apicontrollers.getContactFromUUID(session, contactuuid);
		
		var contactinfo = contact.getLocalJson();
		
		contactinfo.label = label;
		
		return _apicontrollers.modifyContact(session, contactuuid, contactinfo);
	}
	
	async getContactInfoFromEmail(sessionuuid, email) {
		
		if (!sessionuuid)
			return Promise.reject('session uuid is undefined');
		
		var _apicontrollers = this.getClientControllersObject();
		
		var session = await _apicontrollers.getSessionObject(sessionuuid);
		
		var contact = await _apicontrollers.getContactFromEmail(session, email)
		.catch(err => {
			return null;
		});

		if (contact) {
			var contactuuid = contact.getContactUUID();
			return this.getContactInfo(sessionuuid, contactuuid)
		}
		else {
			return null;
		}
	}
	
	//
	// Utils functions
	//

	formatDate(unixdate, format) {
		var global = this.global;
		
		return global.formatDate(new Date(unixdate*1000), format);
	}
	
	formatEtherAmount(amount) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');
		var ethnodecontrollers = ethnodemodule.getControllersObject();
		
		var ethamountstring = ethnodecontrollers.getEtherStringFromWei(amount);
		
		return ethamountstring + ' Eth';
	}
	
	formatAmount(amount, decimals) {
		if (!amount)
			return;
		
		var amountstring = amount.toString();
		var multiplier = Math.pow(10, decimals);
		var amountnumber = Number.parseInt(amountstring);
		var amountfloat = amountnumber/multiplier;
		
		return amountfloat.toFixed(decimals);
	}
	
	formatTokenAmount(amount, token, options) {
		if (!amount)
			return;
		
		var decimals = token.decimals;
		var symbol = token.symbol;
		
		var amountstring = this.formatAmount(amount, decimals);
		
		if (options) {
			if (typeof options.showdecimals !== 'undefined') {
				if (options.showdecimals === false) {
					// we remove . and after
					amountstring = amountstring.substring(0, amountstring.indexOf('.'));
				}
			}
		}
		return amountstring + ' ' + symbol;
	}
	
	parseAmount(amountstring, decimals = 2) {
		// DEFAULT_TOKEN_DECIMALS = 2
		if ((!amountstring) || isNaN(amountstring))
			return -1;
		
		var multiplier = Math.pow(10, decimals);
		
		var split = amountstring.toString().split(".");
		var amountnumber;
		
		if (typeof split[1] === 'undefined') {
			// no decimal
			amountnumber = Number.parseInt(amountstring) * multiplier;
		}
		else {
			var integerstring = split[0];
			
			if (split[1].length < decimals) {
				integerstring += split[1];
				// fill with trailing zeros
				for (var i = 0; i < (decimals - split[1].length); i++)
					integerstring += '0';
			}
			else {
				integerstring += split[1].substr(0, decimals);
			}
			
			amountnumber = Number.parseInt(integerstring)
		}
		
		return amountnumber;
	}
	
	fitString(str, maxlength) {
		if (!str)
			return;
		
		var _str = str;
		
		if (_str.length > maxlength) {
			var startlength = Math.floor(maxlength/2);
			var endlength = ((maxlength - startlength - 3) > 0 ? maxlength - startlength - 3 : 0);
			
			_str = _str.substring(0,startlength) + '...' + _str.substring(_str.length - endlength,_str.length);
		}
		
		return _str;
	}



}


if ( typeof window !== 'undefined' && typeof window.GlobalClass !== 'undefined' && window.GlobalClass ) {
	var _GlobalClass = window.GlobalClass;
}
else if (typeof window !== 'undefined') {
	var _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	var _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
}

_GlobalClass.getGlobalObject().registerModuleObject(new Module());

//dependencies
_GlobalClass.getGlobalObject().registerModuleDepency('mvc-client-wallet', 'common');    