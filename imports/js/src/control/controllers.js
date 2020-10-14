'use strict';

var modulecontrollers;

var ModuleControllers = class {
	
	constructor() {
		this.globalscope =  ((typeof window !== 'undefined') && window ? window : global);

		this.module = null;
		
		//this.ethereum_core = require('@p2pmoney-org/ethereum_core').getObject();
		//this.ethereum_erc20 = require('@p2pmoney-org/ethereum_erc20').getObject();
		//this.ethereum_xtra_web = require('@p2pmoney-org/ethereum_xtra_web').getObject();
		
		//this.ethereum_xtra_web = require('@primusmoney/ethereum_xtra_web').getObject();
		//this.primus_client_wallet = require('@primusmoney/client_wallet').getObject();

		
		this.ethereum_core = require('../../../nodemodules/@p2pmoney-org/ethereum_core').getObject();
		this.ethereum_erc20 = require('../../../nodemodules/@p2pmoney-org/ethereum_erc20').getObject();
		this.ethereum_xtra_web = require('../../../nodemodules/@p2pmoney-org/ethereum_xtra_web').getObject();
		
		this.primus_ethereum_xtra_web = require('../../../nodemodules/@primusmoney/ethereum_xtra_web').getObject();
		this.primus_client_wallet = require('../../../nodemodules/@primusmoney/client_wallet').getObject();
	
		this.global = null;
		
		this.clientcontrollers = null;
		
	}
	
	async init() {
		// @p2pmoney-org/ethereum_core init
		var ethereum_core_init = await this.ethereum_core_init();
		
		// load dependent node modules
		
		// @p2pmoney-org/ethereum_erc20
		var ethereum_erc20_init = await this.ethereum_erc20_init();
		
		
		// @p2pmoney-org/ethereum_xtra_web
		var ethereum_xtra_web_init = await this.ethereum_xtra_web_init();


		// @primusmoney/ethereum_xtra_web
		var primus_ethereum_xtra_web_init = await this.primus_ethereum_xtra_web_init();
		
		// @primusmoney/client_wallet
		var primus_client_wallet_init = await this.primus_client_wallet_init();
		
		// finished all initializations
		this.global = this.ethereum_erc20.getGlobalObject();
		
		if (this.global.getExecutionEnvironment() == 'dev') {
			await this._initdev();
		}
		
		return true;
	}
	
	async _initdev() {
		var global = this.global;
		var _globalscope = global.getExecutionGlobalScope();
		
		if (_globalscope.simplestore) {
			var commonmodule = global.getModuleObject('common');

			// to simplify access in debug window
			_globalscope.simplestore.session_array = commonmodule.session_array;
		}
		
		return true;
	}
	
	async ethereum_core_init() {
		var _globalscope = this.globalscope;
		var ethereum_core = this.ethereum_core;
		
		var ethereum_core_init = await ethereum_core.init()
		.catch(err => {
			console.log('error during @p2pmoney-org/ethereum_core init: ' + err);
		});
		
		console.log('@p2pmoney-org/ethereum_core init finished');

		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;

		var bootstrapobject = Bootstrap.getBootstrapObject();
		var rootscriptloader = ScriptLoader.getRootScriptLoader();

		var clientglobal = _globalscope.simplestore.Global.getGlobalObject();
		
		// nota: we probably register most of the following listeners too late
		rootscriptloader.registerEventListener('on_global_object_ready', (eventname) => {
			console.log('MobileControllers: global object is now ready');
		});
		
		rootscriptloader.registerEventListener('on_dapps_module_load_end', (eventname) => {
			console.log('MobileControllers: load of dapps module ended');

			if (_globalscope.dapp_mvc_no_load !== true) {
				console.log("mobile-load finished loads of dapps");
				var mvcui = bootstrapobject.getMvcUI();
				
			}
		});
		
		return ethereum_core_init;
	}
	
	async ethereum_erc20_init() {
		var _globalscope = this.globalscope;
		var ethereum_erc20 = this.ethereum_erc20;
		
		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;

		var bootstrapobject = Bootstrap.getBootstrapObject();
		var rootscriptloader = ScriptLoader.getRootScriptLoader();

		rootscriptloader.registerEventListener('on_erc20_module_ready', (eventname) => {
			console.log('MobileControllers: erc20 initialization has finished');
		});
		
		var ethereum_erc20_init = await ethereum_erc20.init()
		.catch(err => {
			console.log('error during @p2pmoney-org/ethereum_erc20 init: ' + err);
		});

		
		console.log('@p2pmoney-org/ethereum_erc20 init finished');
		
		return ethereum_erc20_init;
	}
	
	async ethereum_xtra_web_init() {
		var _globalscope = this.globalscope;
		var ethereum_xtra_web = this.ethereum_xtra_web;

		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;

		var bootstrapobject = Bootstrap.getBootstrapObject();
		var rootscriptloader = ScriptLoader.getRootScriptLoader();

		var clientglobal = _globalscope.simplestore.Global.getGlobalObject();

		rootscriptloader.registerEventListener('on_xtra_web_module_ready', (eventname) => {
			console.log('MobileControllers: xtra_web initialization has finished');
		});


		var ethereum_xtra_web_init = await ethereum_xtra_web.init()
		.catch(err => {
			console.log('error during @p2pmoney-org/ethereum_xtra_web init: ' + err);
		});

		
		console.log('@p2pmoney-org/ethereum_xtra_web init finished');
		
		return ethereum_xtra_web_init;
	}
	
	async primus_ethereum_xtra_web_init() {
		var _globalscope = this.globalscope;
		var primus_ethereum_xtra_web = this.primus_ethereum_xtra_web;

		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;

		var bootstrapobject = Bootstrap.getBootstrapObject();
		var rootscriptloader = ScriptLoader.getRootScriptLoader();

		var clientglobal = _globalscope.simplestore.Global.getGlobalObject();

		rootscriptloader.registerEventListener('on_primus_xtra_web_module_ready', (eventname) => {
			console.log('MobileControllers: primus_xtra_web initialization has finished');
		});
		
		var primus_ethereum_xtra_web_init = await primus_ethereum_xtra_web.init()
		.catch(err => {
			console.log('error during @primusmoney/ethereum_xtra_web init: ' + err);
		});


		console.log('@primusmoney/ethereum_xtra_web init finished');

		return primus_ethereum_xtra_web_init;
	}
	
	async primus_client_wallet_init() {
		var _globalscope = this.globalscope;
		var primus_client_wallet = this.primus_client_wallet;

		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;

		var bootstrapobject = Bootstrap.getBootstrapObject();
		var rootscriptloader = ScriptLoader.getRootScriptLoader();

		var clientglobal = _globalscope.simplestore.Global.getGlobalObject();

		rootscriptloader.registerEventListener('@primusmoney/on_primus_client_wallet_module_ready', (eventname) => {
			console.log('WebClientControllers: primus_client_wallet initialization has finished');
		});
		
		var primus_client_wallet_init = await primus_client_wallet.init()
		.catch(err => {
			console.log('error during @primusmoney/client_wallet init: ' + err);
		});


		console.log('@primusmoney/client_wallet init finished');

		return primus_client_wallet_init;
	}

	getClientControllers() {
		if (this.clientcontrollers)
			return this.clientcontrollers;
		
		var global = this.global;

		var clientmodules =  global.getModuleObject('clientmodules');
		
		this.clientcontrollers = clientmodules.getControllersObject();
		
		return this.clientcontrollers;
	}

/*	// TODO: remove functions below to use client controllers version
	
	//
	// Settings
	//
	async readSettings(session, keys, defaultvalue) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.readSettings(session, keys, defaultvalue);
	}
	
	async putSettings(session, keys, json) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.putSettings(session, keys, json);
	}
	
	//
	// Session
	//
	getCurrentSessionObject() {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.getCurrentSessionObject();
	}
	
	async getSessionObject(sessionuuid) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.getSessionObject(sessionuuid);
	}
	
	setCurrentSessionObject(session) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.setCurrentSessionObject(session);
	}
	
	createBlankSessionObject() {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.createBlankSessionObject();
	}
	
	async isSessionAnonymous(session) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		
		const result = new Promise((resolve, reject) => {
			try {
				var res = session.isAnonymous();
				
				resolve(res);
			}
			catch(e) {
				reject(e);
			}
		});
		
		return result;
		
	}
	
	async setSessionNetworkConfig(session, networkconfig) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.setSessionNetworkConfig(session, networkconfig);
	}
	
	async createNetworkSession(networkconfig) {
		var blanksession = this.createBlankSessionObject();
		
		await this.setSessionNetworkConfig(blanksession, networkconfig);
		
		return blanksession;
	}
	
	//
	// child sessions
	//
	async openChildSession(session, username, password, network) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');
		
		const result = new Promise((resolve, reject) => { 
			clientmodules.openChildSession(session, username, password, network, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	getChildSessionObjects(session) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');
		
		return clientmodules.getChildSessionObjects(session);
	}
	
	cleanChildSessionObjects(session) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');
		
		return clientmodules.cleanChildSessionObjects(session);
	}
	
	getParentSessionObject(session) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');
		
		return clientmodules.getParentSessionObject(session);
	}
	
	//
	// user
	//
	getUserInfo(session) {
		var global = this.global;
		var commonmodule = global.getModuleObject('common');
		
		var userinfo = {};
		
		if (!session.isAnonymous()) {
			var user = session.getSessionUserObject();
			
			userinfo.username = user.getUserName();
			
			userinfo.useremail = user.getUserEmail();
			
			userinfo.useruuid = user.getUserUUID();
		}
		
		return userinfo;
	}
	
	isValidEmail(session, emailaddress) {
		var global = this.global;
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.isValidEmail(session, emailaddress);
	}
	
	http_get_json(session, url) {
		var global = this.global;
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.http_get_json(session, url);
	}
	
	
	//
	// vault
	//
	
	async getVaultNames(session) {
		var global = this.global;
		var vaulttype = 0;
		
		var commonmodule = global.getModuleObject('common');
		
		const result = new Promise((resolve, reject) => { 
			commonmodule.getVaultList(session, vaulttype, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});

		var names = [];
		var array = await result
		.catch((err) => {
			console.log('no vault in list');
		});
		
		if (!array)
			return names;
		
		for (var i = 0; i < array.length; i++) {
			if (array[i].name)
			names.push(array[i].name);
		}
		
		return names;
	}
	
	getVaultObject(session, vaultname) {
		var global = this.global;
		var vaulttype = 0;
		
		var commonmodule = global.getModuleObject('common');
		
		return commonmodule.getVaultObject(session, vaultname);
	}
	
	async openVault(session, vaultname, passphrase) {
		var global = this.global;
		var vaulttype = 0;
		
		var commonmodule = global.getModuleObject('common');
		
		const result = new Promise((resolve, reject) => { 
			commonmodule.openVault(session, vaultname, passphrase, vaulttype, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}

	async createVault(session, vaultname, passphrase) {
		var global = this.global;
		var vaulttype = 0;
		
		var commonmodule = global.getModuleObject('common');
		
		const result = new Promise((resolve, reject) => { 
			commonmodule.createVault(session, vaultname, passphrase, vaulttype, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	getFromVault(session, vaultname, key) {
		var global = this.global;
		var vaulttype = 0;
		
		var commonmodule = global.getModuleObject('common');
		
		return commonmodule.getFromVault(session, vaultname, vaulttype, key);
	}

	async putInVault(session, vaultname, key, value) {
		var global = this.global;
		var vaulttype = 0;
		
		var commonmodule = global.getModuleObject('common');
		
		const result = new Promise((resolve, reject) => { 
			commonmodule.putInVault(session, vaultname, vaulttype, key, value, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	impersonateVault(session, vault) {
		if (!vault)
			return false;
		
		var global = this.global;
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.impersonateVault(session, vault);
	}
	
	async connectVault(session, vaultname, passphrase) {
		const vault = await this.openVault(session, vaultname, passphrase);
		
		if (vault)
			return this.impersonateVault(session, vault);
		else
			return false;
	}

	disconnectVault(session, vault) {
		if (!vault)
			return;
		
		var isvaultidentifier = this.isVaultSessionIdentifier(session, vault);
		
		vault.lock();
		
		if (isvaultidentifier)
		session.disconnectUser();
	}
	
	isVaultSessionIdentifier(session, vault) {
		if (!vault)
			return false;
		
		var sessionuser = session.getSessionUserObject();
		
		if (sessionuser) {
			var vaultname = vault.getName();
			var username = sessionuser.getUserName();
			
			if (username == vaultname) {
				return true;
			}
		}
		
		return false;
		
	}
	
	findVaultIdentifier(session) {
		var vaults = session.getVaultObjects();
		
		if (!vaults)
			return;
		
		for (var i = 0; i < vaults.length; i++) {
			var vault = vaults[i];
			
			if (this.isVaultSessionIdentifier(session, vault))
				return vault;
		}
	}
	
	//
	// Accounts
	//
	async getSessionAccountObjects(session, bRefresh) {
		const result = new Promise((resolve, reject) => { 
			session.getSessionAccountObjects(bRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async getAccountObjects(session, bRefresh) {
		const result = new Promise((resolve, reject) => { 
			session.getAccountObjects(bRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	createBlankAccountObject(session) {
		var global = this.global;

		var commonmodule = global.getModuleObject('common');
		
		return commonmodule.createBlankAccountObject(session);
	}
	
	createAccountObject(session, address, privatekey) {
		var global = this.global;

		var commonmodule = global.getModuleObject('common');
		
		// create account with this address
		var account = commonmodule.createBlankAccountObject(session);
		
		if (privatekey)
			account.setPrivateKey(privatekey);
		else
			account.setAddress(address);
		
		return account;
	}
	
	async saveAccountObject(session, account) {
		var global = this.global;

		var storagemodule = global.getModuleObject('storage-access');
		var storageaccess = storagemodule.getStorageAccessInstance(session);
		
		var sessionuser = session.getSessionUserObject();

		const result = new Promise((resolve, reject) => {
			storageaccess.user_add_account(sessionuser, account, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	
	//
	// Storage-access
	//
	getArtifact(artifactname) {
		return this.ethereum_core.getArtifact(artifactname);
	}
	
	async getLocalJsonLeaf(session, keys, bForceRefresh) {
		var localstorage = session.getLocalStorageObject();
		
		const result = new Promise((resolve, reject) => { 
			localstorage.readLocalJson(keys, bForceRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async saveLocalJson(session, keys, json) {
		var localstorage = session.getLocalStorageObject();
		
		const result = new Promise((resolve, reject) => { 
			localstorage.saveLocalJson(keys, json, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	//
	// Web 3 (ethnode)
	//
	
	async setWebProviderUrl(session, providerurl) {
		var global = this.global;

		var commonmodule = global.getModuleObject('common');
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		
		const result = new Promise((resolve, reject) => { 
			// set providerurl as web3 provider
			ethnodemodule.setWeb3ProviderUrl(providerurl, session, (err,res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async getNodeInfo(session) {
		var global = this.global;
		
		var mobileconfigmodule = global.getModuleObject('mobileconfig');
		

		var ethnodemodule = global.getModuleObject('ethnode');

		var ethereumnodeaccess = ethnodemodule.getEthereumNodeAccessInstance(session);

		var nodeinfo = {};

		nodeinfo.islistening = global.t('loading');
		nodeinfo.networkid = global.t('loading');
		nodeinfo.peercount = global.t('loading');
		nodeinfo.issyncing = global.t('loading');
		nodeinfo.currentblock = global.t('loading');
		nodeinfo.highestblock = global.t('loading');

		var writenodeinfo = function(nodeinfo, callback) {
			
			ethereumnodeaccess.web3_getNodeInfo(function(err, info) {
				console.log('returning from web3_getNodeInfo');
				
				if (info) {
					nodeinfo.islistening = info.islistening;
					nodeinfo.networkid = info.networkid;
					nodeinfo.peercount = info.peercount;
					nodeinfo.issyncing = info.issyncing;
					nodeinfo.currentblock = info.currentblock;
					nodeinfo.highestblock = info.highestblock;
				}
				else {
					nodeinfo.islistening = global.t('not available');
					nodeinfo.networkid = global.t('not available');
					nodeinfo.peercount = global.t('not available');
					nodeinfo.issyncing = global.t('not available');
					nodeinfo.currentblock = global.t('not available');
					nodeinfo.highestblock = global.t('not available');
				}

				console.log(JSON.stringify(nodeinfo));
				
				if (callback)
					callback(null, nodeinfo);
			});
		};

		const result = new Promise((resolve, reject) => { 
			writenodeinfo(nodeinfo, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async getEthAddressBalance(session, address) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');

		var account = this.createAccountObject(session, address);
		
		return this.getEthAccountBalance(session, account);
	}
	
	// using accounts
	async getEthAccountFromUUID(session, accountuuid) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		var commoncontrollers = commonmodule.getControllersObject();
		
		var account = commoncontrollers.getAccountObjectFromUUID(session, accountuuid);
		
		return account;
	}
	
	async getEthAccountBalance(session, account) {
		var global = this.global;

		var ethnodemodule = global.getModuleObject('ethnode');
		var ethnodecontrollers = ethnodemodule.getControllersObject();

		const result = new Promise((resolve, reject) => { 
			ethnodemodule.getChainAccountBalance(session, account, (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					var etherbalance = (ethnodecontrollers ? ethnodecontrollers.getEtherStringFromWei(res) : null);
					resolve(etherbalance);
				}
			});
		});
		
		return result;
	}
	
	createFee(level) {
		var fee = {};
		
		fee.gaslimit = 4850000;
		fee.gasPrice = 10000000000;
		
		return fee;
	}
	
	createTransaction(session, fromaccount) {
		var global = this.global;
		
		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
	
		var ethereumtransaction =  ethereumnodeaccessmodule.getEthereumTransactionObject(session, fromaccount);
		
		return ethereumtransaction;
	}
	
	async sendTransaction(session, transaction) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
		
		var EthereumNodeAccess = ethnodemodule.getEthereumNodeAccessInstance(session);
		
		const result = new Promise((resolve, reject) => { 
			EthereumNodeAccess.web3_sendEthTransaction(transaction, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async getTransaction(session, txhash) {
		var global = this.global;

		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');

		const result = new Promise((resolve, reject) => { 
			ethereumnodeaccessmodule.readEthereumTransactionObject(session, txhash, (err, res) => {
				if (err) reject(err);
				else {
					var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
					var data = res.data;
					res.data_decoded_utf8 = ethereumnodeaccessmodule.web3ToUTF8(session, data);
				
					resolve(res);
				}
			});
		});
		
		return result;

		
	}
	
	//
	// Web 3 (ethchainreader)
	//
	async readCurrentBlockNumber(session) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getCurrentBlockNumber((err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async readBlock(session, txhash) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getBlock(blocknumber, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async readTransaction(session, txhash) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getTransaction(txhash,(err, res) => {
				if (err) reject(err); 
				else {
					var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
					var input = res.input;
					res.input_decoded_utf8 = ethereumnodeaccessmodule.web3ToUTF8(session, input);
				
					resolve(res);
				}
			});
		});
		
		return result;
	}
	
	
	
	//
	// ERC20
	//
	
	importERC20Token(session, tokenaddress) {
		var global = this.global;
		
		var erc20tokenmodule = global.getModuleObject('erc20');
		
		var data = {};
		
		data['description'] = tokenaddress;
		data['address'] = tokenaddress;
		
		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();
		
		// create (local) contract for these values
		var erc20tokencontract = erc20tokencontrollers.createERC20TokenObject(session, data);
		
		return erc20tokencontract;
	}
	
	async saveERC20Token(session, token) {
		if (!token)
			return;
		
		var contract = token;
		
		var global = this.global;
		
		var erc20tokenmodule = global.getModuleObject('erc20');
		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();
		
		await erc20tokencontrollers.saveERC20TokenObject(session, contract);
		
		console.log("local token data saved");

		// start a promise chain, to collect name, symbol,..
		console.log("starting retrieving chain data");

		const name = await contract.getChainName();
		
		console.log("chain name is " + name);
		
		contract.setLocalName(name);

		const symbol = await contract.getChainSymbol();
		
		console.log("symbol is " + symbol);
		
		contract.setLocalSymbol(symbol);
		
		const decimals = await contract.getChainDecimals();
		
		console.log("decimals is " + decimals);
		
		contract.setLocalDecimals(decimals);
		
		const totalsupply = await contract.getChainTotalSupply();
		
		console.log("total supply is " + totalsupply);
		
		contract.setLocalTotalSupply(totalsupply);
		
		console.log("deployed contract completely retrieved");

		// save erc20token
		const result = await erc20tokencontrollers.saveERC20TokenObject(session, contract);
		
		console.log("erc20 token saved");


		return result;
	}
	
	async getERC20TokenList(session, bRefresh) {
		var global = this.global;
		
		var erc20tokenmodule = global.getModuleObject('erc20');

		const result = new Promise((resolve, reject) => { 
			erc20tokenmodule.getERC20Tokens(session, bRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}
	
	async getAddressERC20Position(session, providerurl, tokenaddress, address) {
		var global = this.global;
		var self = this;

		var commonmodule = global.getModuleObject('common');
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		const setweb3provider = await this.setWeb3ProviderUrl(session, providerurl);
		
		var ethereumnodeaccess = ethnodemodule.getEthereumNodeAccessInstance(session);
		
		const ready = await ethereumnodeaccess.isReady();
		
		
		// create account with this address
		var account = this.createAccountObject(session, address);

		// import erc20 token contract
		var erc20tokencontract = this.importERC20Token(session, tokenaddress);
		
		// ask for balance
		const balance = erc20tokencontract.balanceOf(account)
		.catch((err) => {
			console.log('balance position for ' + address + ' could not be retrieved');
			
			throw new Error('could not retrieve balance for ' + address);
		});
		
		console.log('balance position for ' + address + ' is: ' + balance);
		
		return balance;
	}
	
	async sendERC20Tokens(session, providerurl, tokenaddress, senderprivatekey, recipientaddress, fee) {
		var global = this.global;

		var commonmodule = global.getModuleObject('common');
		var ethnodemodule = global.getModuleObject('ethnode');

		// import erc20 token contract
		var erc20tokencontract = this.importERC20Token(session, tokenaddress);
		
		
		if (erc20tokencontract) {
			
			var fromaccount = this.createAccountObject(session, null, senderprivatekey);
			var toaccount = this.createAccountObject(session, recipientaddress);
			var payingaccount = fromaccount;
			
			var gaslimit = fee.gaslimit;
			var gasPrice = fee.gasPrice;
			
			try {
				// unlock account
				const unlock = await ethnodemodule.unlockAccount(session, payingaccount, password, 300) // 300s, but we can relock the account
				.catch((err) => {
					console.log('error in locking account: ' + err);

					return false;
				});
				
				console.log('paying account ' + payingaccount.getAddress() + ' is now unlocked');
				
				const transfer = await erc20tokencontract.transfer(fromaccount, toaccount, tokenamount, payingaccount, gaslimit, gasPrice)
				.catch((err) => {
					console.log('error in token transfer: ' + err);

					return false;
				});
				
				
				console.log('transfer transaction successful: ' + res);
					
				// relock account
				ethnodemodule.lockAccount(session, payingaccount);
	
			}
			catch(e) {
				console.log('error in token transfer: ' + e);
				return false;
			}
			
			return true;
		}
	}		

	
	//
	// cryptokey
	// 

	generatePrivateKey(session) {
		var privkey = session.generatePrivateKey();		
		
		return privkey;
		
	}
	
	isValidPrivateKey(session, privatekey) {
		try {
			return session.isValidPrivateKey(privatekey);
		}
		catch(e) {
			return false;
		}
	}
	
	isValidAddress(session, address) {
		try {
			return session.isValidAddress(address);
		}
		catch(e) {
			return false;
		}
	}
	
	getPublicKeys(session, privatekey) {
		var account = this.createAccountObject(session, null, privatekey);
		
		var keys = {};
		
		keys['private_key'] = account.getPrivateKey();
		keys['public_key'] = account.getPublicKey();
		keys['address'] = account.getAddress();
		keys['rsa_public_key'] = account.getRsaPublicKey();
		
		return keys;
	}
	
	
	aesEncryptString(session, privatekey, plaintext) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setPrivateKey(privatekey);

		return cryptokey.aesEncryptString(plaintext);
		
	}
	
	aesDecryptString(session, privatekey, cyphertext) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setPrivateKey(privatekey);

		return cryptokey.aesDecryptString(cyphertext);
	}
	
	rsaEncryptString(senderaccount, recipientaccount, plaintext) {
		return senderaccount.rsaEncryptString(plaintext, recipientaccount);
	}
	
	rsaDecryptString(recipientaccount, senderaccount, cyphertext) {
		return recipientaccount.rsaDecryptString(cyphertext, senderaccount);
	}
	
	//
	// authkey
	//
	async authenticate(session, username, password) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.authenticate(session, username, password);
	}
	
	
	//
	// Wallet
	//
	async getSchemeList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getSchemeList(session, bRefresh);
	}
	
	async getLocalSchemeList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getLocalSchemeList(session, bRefresh);
	}
	
	async getRemoteSchemeList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getRemoteSchemeList(session, bRefresh);
	}
	
	createLocalSchemeConfig(session, web3_provider_url) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.createLocalSchemeConfig(session, web3_provider_url);
	}
	
	getDefaultSchemeConfig(flag) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getDefaultSchemeConfig(flag);
	}
	
	async getDefaultScheme(session, flag) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getDefaultScheme(session, flag);
	}
	
	async isValidSchemeConfig(session, configurl) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.isValidSchemeConfig(session, configurl);
	}
	
	async importScheme(session, configurl) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.importScheme(session, configurl);
	}
	
	async createScheme(session, network) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.createScheme(session, network);
	}
	
	async modifyScheme(session, schemeuuid, schemeinfo) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.modifyScheme(session, schemeuuid, schemeinfo);
	}
	
	async getSchemeFromUUID(session, uuid) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getSchemeFromUUID(session, uuid);
	}
	
	async getSchemeFromConfigUrl(session, configurl) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getSchemeFromConfigUrl(session, configurl);
	}
	
	async getSchemeFromWeb3Url(session, web3url) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getSchemeFromWeb3Url(session, web3url);
	}
	
	async isValidEthnodeRPC(session, rpcurl) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.isValidEthnodeRPC(session, rpcurl);
	}
	
	
	// wallets
	async getWalletList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getWalletList(session, bRefresh);
	}
	
	async importWallet(session, url, authname, password) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.importWallet(session, url, authname, password);
	}
	
	async createWallet(session, walletname, password) {
		var global = this.global;
		var wallettype = 0; // we create only client wallets, we import them for remote wallets
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.createWallet(session, walletname, password, wallettype);
	}
	
	async modifyWallet(session, walletuuid, walletinfo) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.modifyWallet(session, walletuuid, walletinfo);
	}
	
	async openWallet(session, walletname, password) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.openWallet(session, walletname, password);
	}

	async openWalletFromUUID(session, walletuuid, password) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.openWalletFromUUID(session, walletuuid, password);
	}

	async closeWallet(session, wallet) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.closeWallet(session, wallet);
	}

	
	async getWallet(session, walletname) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getWallet(session, walletname);
	}
	
	async getWalletFromUUID(session, walletuuid) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getWalletFromUUID(session, walletuuid);
	}

	getFromWallet(session, wallet, key) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getFromWallet(session, wallet, key);
	}
	
	async putInWallet(session, wallet, key, value) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.putInWallet(session, wallet, key, value)
	}
	
	async getSessionAccountFromPrivateKey(session, wallet, privatekey) {
		var global = this.global;

		var sessionaccount;
		
		var bExists = false;
		var _privatekey = privatekey;
		var _publickeys = this.getPublicKeys(session, _privatekey)
		var _address = _publickeys['address'];
		
		// we look if address corresponds to an existing session account
		var sessionaccounts = await wallet.getSessionAccountObjects(true);
		
		for (var i = 0; i < (sessionaccounts ? sessionaccounts.length : 0); i++) {
			var accountaddress = sessionaccounts[i].getAddress();
			
			if (session.areAddressesEqual(_address, accountaddress)) {
				bExists = true;
				sessionaccount = sessionaccounts[i];
				break;
			}
		}
		// we save a session account object
		if (!bExists) {
			sessionaccount = await wallet.createSessionAccountObject(privatekey);
			
			await wallet.saveAccountObject(sessionaccount);
		}
		
		return sessionaccount;
	}

	
	// contacts
	async createContact(session, name, address, contactinfo) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.createContact(session, name, address, contactinfo);
	}
	
	async importContact(session, configurl) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.importContact(session, configurl);
	}
	
	async modifyContact(session, contactuuid, contactinfo) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.modifyContact(session, contactuuid, contactinfo);
	}
	
	async getContact(session, name) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getContact(session, name);
	}
	
	async getContactFromUUID(session, contactuuid) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getContactFromUUID(session, contactuuid);
	}
	
	async getContactFromEmail(session, email) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getContactFromEmail(session, email);
	}
	
	async getContactList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getContactList(session, bRefresh);
	}
	
	async getWalletCardsAsContactList(session, wallet, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getWalletCardsAsContactList(session, wallet, bRefresh);
	}
	
	async getWalletCardFromContact(session, wallet, contact) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getWalletCardFromContact(session, wallet, contact);
	}
	
	async getWalletCardAsContact(session, wallet, card) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getWalletCardAsContact(session, wallet, card);
	}
	
	// transactions
	async getTransactionList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getTransactionList(session, bRefresh);
	}
	
	// TODO: remove functions below to use client controllers version (end)
*/	
	
	// static
	static getObject() {
		if (modulecontrollers)
			return modulecontrollers;
		
		modulecontrollers = new ModuleControllers();
		
		return modulecontrollers;
	}
}

export default ModuleControllers; 