'use strict';

var modulecontrollers;

var ModuleControllers = class {
	
	constructor(module) {
		this.module = module;
		
		this.global = module.global;
	}

	/***********************/
	/*      Client         */
	/***********************/
	
	getClientVersion() {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.current_version;
	}

	getModulesVersionInfo() {
		var global = this.global;

		return global.getVersionInfo();
	}
	
	//
	// Events & Hooks
	//

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
	
	createChildSessionObject(parentsession) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		var childsession =  clientmodules.createBlankSessionObject();

		clientmodules.attachChildSessionObject(childsession, parentsession);

		return childsession;
	}
	
	attachChildSessionObject(childsession, parentsession) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		clientmodules.attachChildSessionObject(childsession, parentsession);

		return childsession;
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
			})
			.catch(err => reject(err));
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

	impersonateVault(session, vault) {
		if (!vault)
			return false;
		
		var global = this.global;
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.impersonateVault(session, vault);
	}
	
	//
	// authkey
	//

	async authenticate(session, username, password) {
		var global = this.global;
		
		var clientmodules = global.getModuleObject('clientmodules');

		return clientmodules.authenticate(session, username, password);
	}
	
	


	/***********************/
	/*   common module     */
	/***********************/
	
	//
	// session
	//

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
			}); //  does not return a promise
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
			}); //  does not return a promise
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
			}); //  does not return a promise
		});
		
		return result;
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
			}); //  does not return a promise
		});
		
		return result;
	}
	
	async getAccountObjects(session, bRefresh) {
		const result = new Promise((resolve, reject) => { 
			session.getAccountObjects(bRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			}); //  does not return a promise
		});
		
		return result;
	}
	
	async getAccountObjectFromUUID(session, accountuuid) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		var commoncontrollers = commonmodule.getControllersObject();
		
		var account = commoncontrollers.getAccountObjectFromUUID(session, accountuuid);
		
		return account;
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
			})
			.catch(err => reject(err));
		});
		
		return result;
	}
	
	
	//
	// Storage-access
	//

	getArtifact(artifactpath) {
		var global = this.global;
		var Ethereum_core = global.getGlobalStoredObject('Ethereum_core');
		var ethereum_core = (Ethereum_core ? Ethereum_core.getObject() : null);

		if (ethereum_core)
		return ethereum_core.getArtifact(artifactpath);
	}

	putArtifact(artifactpath, artifactcontent) {
		var global = this.global;
		var Ethereum_core = global.getGlobalStoredObject('Ethereum_core');
		var ethereum_core = (Ethereum_core ? Ethereum_core.getObject() : null);

		if (ethereum_core)
		return ethereum_core.putArtifact(artifactpath, artifactcontent);
	}
	
	// stored on the local storage (either client or server side depending on session)
	async getLocalJsonLeaf(session, keys, bForceRefresh) {
		// obsolete naming
		var localstorage = session.getLocalStorageObject();
		
		const result = new Promise((resolve, reject) => { 
			localstorage.readLocalJson(keys, bForceRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			}); // does not return a promise
		});
		
		return result;
	}
	
	async readLocalJson(session, keys, bForceRefresh) {
		var localstorage = session.getLocalStorageObject();
		
		const result = new Promise((resolve, reject) => { 
			localstorage.readLocalJson(keys, bForceRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			}); // does not return a promise
		});
		
		return result;
	}
	
	async saveLocalJson(session, keys, json) {
		var localstorage = session.getLocalStorageObject();
		
		const result = new Promise((resolve, reject) => { 
			localstorage.saveLocalJson(keys, json, (err, res) => {
				if (err) reject(err); else resolve(res);
			}); // does not return a promise
		});
		
		return result;
	}

	// stored on the client side
	async readClientSideJson(session, keys) {
		var clientAccess = session.getClientStorageAccessInstance();
		
		const result = new Promise((resolve, reject) => { 
			clientAccess.readClientSideJson(keys, (err, res) => {
				if (err) reject(err); else resolve(res);
			}); // does not return a promise
		});
		
		return result;
	}
	
	async saveClientSideJson(session, keys, json) {
		var clientAccess = session.getClientStorageAccessInstance();
		
		const result = new Promise((resolve, reject) => { 
			clientAccess.saveClientSideJson(keys, json, (err, res) => {
				if (err) reject(err); else resolve(res);
			}); // does not return a promise
		});
		
		return result;
	}

	
	/***********************/
	/*   Web3 (ethnode)    */
	/***********************/
	
	 getWeb3ProviderUrl(session) {
		var global = this.global;

		var ethnodemodule = global.getModuleObject('ethnode');

		return ethnodemodule.getWeb3ProviderUrl(session);
	 }
		
	async setWeb3ProviderUrl(session, providerurl) {
		var global = this.global;

		var ethnodemodule = global.getModuleObject('ethnode');
		
		
		const result = new Promise((resolve, reject) => { 
			// set providerurl as web3 provider
			ethnodemodule.setWeb3ProviderUrl(providerurl, session, (err,res) => {
				if (err) reject(err); else resolve(res);
			}); // does not return a promise
		});
		
		return result;
	}

	async getEthereumNodeAccessInstance(session, web3providerurl) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');

		var ethereumnodeaccessinstance = ethnodemodule.getEthereumNodeAccessInstance(session, web3providerurl);

		return ethereumnodeaccessinstance;
	}
	
	async getNodeInfo(session) {
		var global = this.global;
		
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
			})
			.catch(err => {if (callback) callback(err, null);});
		};

		const result = new Promise((resolve, reject) => { 
			writenodeinfo(nodeinfo, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		return result;
	}

	async getEthAccountTransactionCredits(session, account) {
		var global = this.global;
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var ethereumnodeaccess  = ethnodemodule.getEthereumNodeAccessInstance(session);
		var address = account.getAddress();
		var balance = await ethereumnodeaccess.web3_getBalance(address);

		return parseInt(balance);
	}


	
	async getEthAddressBalance(session, address) {
		var global = this.global;
		
		var account = this.createAccountObject(session, address);
		
		return this.getEthAccountBalance(session, account);
	}
	
	// using accounts
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
			})
			.catch(err => reject(err));
		});
		
		return result;
	}
	
	createFee(feelevel) {
		var fee = {};
		
		fee.gaslimit = 4850000 * (feelevel && feelevel.default_gas_limit_multiplier ? parseInt(feelevel.default_gas_limit_multiplier) : 1);
		fee.gasPrice = 	10000000000 * (feelevel && feelevel.default_gas_price_multiplier ? parseInt(feelevel.default_gas_price_multiplier) : 1);
		
		return fee;
	}
	
	createEthereumTransaction(session, fromaccount) {
		var global = this.global;
		
		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
	
		var ethereumtransaction =  ethereumnodeaccessmodule.getEthereumTransactionObject(session, fromaccount);
		
		return ethereumtransaction;
	}
	
	async sendEthereumTransaction(session, transaction) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var EthereumNodeAccess = ethnodemodule.getEthereumNodeAccessInstance(session);
		
		const result = new Promise((resolve, reject) => { 
			EthereumNodeAccess.web3_sendEthTransaction(transaction, (err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		});
		
		return result;
	}
	
	// transactions
	async getEthereumTransactionList(session, bRefresh) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');

		if (bRefresh !== undefined)
		console.log('getTransactionList: refresh parameter is not taken into account');

		const result = new Promise((resolve, reject) => { 
			ethnodemodule.getTransactionList(session, (err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		});

		return result;
	}

	async getEthereumTransactionCount(session, account, defaultBlock) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var EthereumNodeAccess = ethnodemodule.getEthereumNodeAccessInstance(session);

		var fromaddress = account.getAddress();
		
		const result = new Promise((resolve, reject) => { 
			EthereumNodeAccess.web3_getTransactionCount(fromaddress, defaultBlock, (err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		});
		
		return result;
	}
	


	async _getEthNodeTransactionObjectFromHash(session, txhash, callback) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');

		var transactionuuid = session.guid();
		
		var transaction = new ethnodemodule.Transaction(session, transactionuuid);

		transaction.setTransactionHash(txhash);

		if (callback)
			callback(null, transaction);

		return transaction;
	}
	
	async getTransaction(session, txhash) {
		var global = this.global;
		
		var ethnodemodule = global.getModuleObject('ethnode');

		const result = new Promise((resolve, reject) => { 
			//ethnodemodule.getTransactionObjectFromHash(session, txhash, (err, res) => {
			this._getEthNodeTransactionObjectFromHash(session, txhash, (err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		});

		return result;
	}

	async decodedDataToUTF8(session, data) {
		var global = this.global;

		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');

		var data_decoded_utf8 = ethereumnodeaccessmodule.web3ToUTF8(session, data);

		return data_decoded_utf8;
	}
	
	async getEthereumTransaction(session, txhash) {
		var global = this.global;

		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');

		const result = new Promise((resolve, reject) => { 
			ethereumnodeaccessmodule.readEthereumTransactionObject(session, txhash, (err, res) => {
				if (err) reject(err);
				else {
					var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
					var data = res.data;
					try {
						// can throw invalid UTF8 detected
						res.data_decoded_utf8 = ethereumnodeaccessmodule.web3ToUTF8(session, data);
					}
					catch(e) {}
				
					resolve(res);
				}
			})
			.then(res => {
				// fixing missing callback call when data == null
				// in EthereumNodeAccess.readEthereumTransactionObject
				if (res)
					return res;
				else
					throw new Error('no transaction found with hash ' + txhash);
			})
			.catch(err => {
				reject(err);
			});
		});
		
		return result;

		
	}
	
	async getEthereumTransactionReceipt(session, txhash) {
		var global = this.global;

		var ethnodemodule = global.getModuleObject('ethnode');
		
		var EthereumNodeAccess = ethnodemodule.getEthereumNodeAccessInstance(session);

		const result = new Promise((resolve, reject) => { 
			EthereumNodeAccess.web3_getTransactionReceipt(txhash, (err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		});
		
		return result;

		
	}

	async getEthereumContractInstance(session, address, contractpath, ethnodeserverconfig) {
		var global = this.global;

		var web3providerurl = ethnodeserverconfig.web3_provider_url;
		var chainid = ethnodeserverconfig.chainid;
		var networkid = ethnodeserverconfig.networkid;

		var ethnodemodule = global.getModuleObject('ethnode');

		var contractinstance = ethnodemodule.getContractInstance(session, address, contractpath, web3providerurl);
		
		if (chainid)
		contractinstance.setChainId(chainid);
		
		if (networkid)
		contractinstance.setNetworkId(networkid);

		return contractinstance;
	}
	
	/***************************/
	/*  Web3 (ethchainreader)  */
	/***************************/

	async readCurrentBlockNumber(session) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getCurrentBlockNumber((err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		});
		
		return result;
	}
	
	async readBlock(session, blocknumber) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getBlock(blocknumber, (err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
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
					try {
						res.input_decoded_utf8 = ethereumnodeaccessmodule.web3ToUTF8(session, input);
					}
					catch(e) {}
				
					resolve(res);
				}
			})			
			.then(res => {
				// fixing missing callback calls when data == null
				// because of error read property of null in Transaction._createTransactionObject
				if (res)
					return res;
				else
					throw new Error('no transaction found with hash ' + txhash);
			})
			.catch(err => {
				reject(err);
			});
		});
		
		return result;
	}

	async readLatestTransactions(session) {
		var global = this.global;

		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);
		
		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getLatestTransactions((err, res) => {
				if (err) reject(err); else	resolve(res);
			})
			.catch(err => reject(err));
		});
		
		return result;
	}
	
	async readBlockTransactions(session, blocknumber) {
		var global = this.global;

		var ethchainreadermodule = global.getModuleObject('ethchainreader');

		var block = await this.readBlock(session, blocknumber);
		
		const result = new Promise((resolve, reject) => { 
			block.getTransactions((err, res) => {
				if (err) reject(err); else	resolve(res);
			})
			.catch(err => reject(err));			
		});
		
		return result;
	}
	
	async readAccount(session, address) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);

		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getAccount(address,(err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		});
		
		return result;
	}

	async readContract(session, address, abi) {
		var global = this.global;
		
		var ethchainreadermodule = global.getModuleObject('ethchainreader');
		
		var chainreaderinterface = ethchainreadermodule.getChainReaderInterface(session);

		var contract;
		
		const result = new Promise((resolve, reject) => { 
			chainreaderinterface.getContract(address,(err, res) => {
				if (err) reject(err); else resolve(res);
			})
			.catch(err => reject(err));
		})
		.then(res => {
			contract = res;

			if (abi) {
				contract.setAbi(abi);

				return contract._getInstance();
			}
			else {
				return contract;
			}

		})
		.then(() => {
			return contract;
		});
		
		return result;
	}

	/***********************/
	/*      ERC20          */
	/***********************/
	
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
		return new Promise((resolve, reject) => { 
			// note: saveERC20TokenObject does not return a promise
			erc20tokencontrollers.saveERC20TokenObject(session, contract, (err, res) => {

				if (err) {
					console.log("error saving erc20 token: " + err);
					reject(err); 
				}
				else {
					console.log("erc20 token saved");
					resolve(contract);
				}
			});
		});
	}
	
	async getERC20TokenList(session, bRefresh) {
		var global = this.global;
		
		var erc20tokenmodule = global.getModuleObject('erc20');

		const result = new Promise((resolve, reject) => { 
			erc20tokenmodule.getERC20Tokens(session, bRefresh, (err, res) => {
				if (err) reject(err); else resolve(res);
			}); // does not return a promise
		});
		
		return result;
	}
	
	async getAddressERC20Position(session, providerurl, tokenaddress, address) {
		var global = this.global;
		var self = this;

		var ethnodemodule = global.getModuleObject('ethnode');
		var currentproviderurl = this.getWeb3ProviderUrl(session);
		var changedprovider = false;

		if (!providerurl && !currentproviderurl)
			throw new Error('missing a web3 url');

		
		if ((providerurl) && (providerurl != currentproviderurl)) {
			await this.setWeb3ProviderUrl(session, providerurl);
			changedprovider = true;
		}
		
		var ethereumnodeaccess = ethnodemodule.getEthereumNodeAccessInstance(session);
		
		const ready = await ethereumnodeaccess.isReady();
		
		
		// create account with this address
		var account = this.createAccountObject(session, address);

		// import erc20 token contract
		var erc20tokencontract = this.importERC20Token(session, tokenaddress);
		
		// ask for balance
		const balance = await erc20tokencontract.balanceOf(account)
		.catch((err) => {
			console.log('balance position for ' + address + ' could not be retrieved');
			
			throw new Error('could not retrieve balance for ' + address);
		});
		
		console.log('balance position for ' + address + ' is: ' + balance);

		if (changedprovider) {
			await this.setWeb3ProviderUrl(session, currentproviderurl);
		}
		
		return balance;
	}
	
	async sendERC20Tokens(session, providerurl, tokenaddress, senderprivatekey, recipientaddress, tokenamount, fee) {
		if (!tokenaddress)
			return Promise.reject('need a token address');

		if (!recipientaddress)
			return Promise.reject('need a recipient address');

		if (!this.isValidPrivateKey(session, senderprivatekey))
			return Promise.reject('need a valid private key');
		
		var txhash = null;
	
		var global = this.global;

		var ethnodemodule = global.getModuleObject('ethnode');

		// import erc20 token contract
		var erc20tokencontract = this.importERC20Token(session, tokenaddress);

		if (providerurl) {
			erc20tokencontract.setWeb3ProviderUrl(providerurl);
		}
		else {
			var currentproviderURL = this.getWeb3ProviderUrl(session);
			
			if (currentproviderURL)
				erc20tokencontract.setWeb3ProviderUrl(currentproviderURL);
			else
				throw new Error('missing a web3 url');
		}
		
		
		if (erc20tokencontract) {
			
			var fromaccount = this.createAccountObject(session, null, senderprivatekey);
			var toaccount = this.createAccountObject(session, recipientaddress);
			var payingaccount = fromaccount;
			let password = null; // no need since we have a private key
			
			var gaslimit = fee.gaslimit;
			var gasPrice = fee.gasPrice;
			
			try {
				// unlock account
				const unlock = await ethnodemodule.unlockAccount(session, payingaccount, password, 300) // 300s, but we can relock the account
				.catch((err) => {
					console.log('error in locking account: ' + err);
				});

				if (!unlock)
					return Promise.reject('could not unlock sending account');
				
				console.log('paying account ' + payingaccount.getAddress() + ' is now unlocked');
				
				txhash = await erc20tokencontract.transfer(fromaccount, toaccount, tokenamount, payingaccount, gaslimit, gasPrice)
				.catch((err) => {
					console.log('error in token transfer: ' + err);
				});
				
				
				// relock account
				ethnodemodule.lockAccount(session, payingaccount);
	
			}
			catch(e) {
				console.log('error in token transfer: ' + e);
			}
			
			return txhash;
		}
	}
	
	async transferERC20Tokens(session, providerurl, tokenaddress, tokenamount, ethtx) {
		if (!tokenaddress)
			return Promise.reject('need a token address');

		if (!ethtx)
			return Promise.reject('need a ethereum transaction definition');

		var txhash = null;

		var global = this.global;

		var ethnodemodule = global.getModuleObject('ethnode');

		// import erc20 token contract
		var erc20tokencontract = this.importERC20Token(session, tokenaddress);

		if (providerurl) {
			erc20tokencontract.setWeb3ProviderUrl(providerurl);
		}
		else {
			var currentproviderURL = this.getWeb3ProviderUrl(session);
			
			if (currentproviderURL)
				erc20tokencontract.setWeb3ProviderUrl(currentproviderURL);
			else
				throw new Error('missing a web3 url');
		}
		
		
		if (erc20tokencontract) {
			
			var fromaccount = ethtx.getFromAccount();
			var toaccount = ethtx.getToAccount();
			var payingaccount = (ethtx.getPayingAccount() ? ethtx.getPayingAccount() : fromaccount);
			let password = null; // no need since we have a private key
			
			try {
				// unlock account
				const unlock = await ethnodemodule.unlockAccount(session, payingaccount, password, 300) // 300s, but we can relock the account
				.catch((err) => {
					console.log('error in locking account: ' + err);
				});

				if (!unlock)
					return Promise.reject('could not unlock sending account');
				
				console.log('paying account ' + payingaccount.getAddress() + ' is now unlocked');
				
				txhash = await erc20tokencontract.transferAsync(fromaccount, toaccount, tokenamount, ethtx)
				.catch((err) => {
					console.log('error in token transfer: ' + err);
				});
				
				
				// relock account
				ethnodemodule.lockAccount(session, payingaccount);
	
			}
			catch(e) {
				console.log('error in token transfer: ' + e);
			}
			
			return txhash;
		}
	}

	
	/***********************/
	/*      common         */
	/***********************/

	//
	// cryptokey
	// 

	async derivePrivateKey(session, passphrase, salt) {
		const pbkdf2 = require('pbkdf2');

		// TODO: we could fetch a passphrase with more entropy via a REST request
		var _passphrase = passphrase.replace(/\s/g, '');
		_passphrase = _passphrase.toUpperCase();

		let iterations = 10000;
		let keylength = 32;
		let digest = 'sha512';

		var _derived_private_key_buff = pbkdf2.pbkdf2Sync(_passphrase, salt, iterations, keylength, digest);
		var _derived_private_key = '0x' + _derived_private_key_buff.toString('hex');

		return _derived_private_key;
	}

	async getCryptoKeyObject(session, privatekey) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setPrivateKey(privatekey);

		return cryptokey;
	}
	
	getPrivateKeyStoreString(session, privkey, passphrase) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setPrivateKey(privkey);
		
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);
		
		return cryptokeyencryptioninstance.getPrivateKeyStoreString(passphrase);
	}
	
	readPrivateKeyFromStoreString(session, keystorestring, passphrase) {
		var cryptokey = session.createBlankCryptoKeyObject();
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);
		
		return cryptokeyencryptioninstance.readPrivateKeyFromStoreString(keystorestring, passphrase);
	}

	generatePrivateKeyFromPassphrase(session, passphrase) {
		var cryptokey = session.createBlankCryptoKeyObject();
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);
		
		return cryptokeyencryptioninstance.generatePrivateKeyFromPassphrase(passphrase);
	}
	
	hash_hmac(session, hashforce, datastring, keystring) {
		var cryptokey = session.createBlankCryptoKeyObject();
		var cryptokeyencryptioninstance = session.getCryptoKeyEncryptionInstance(cryptokey);
	
		return cryptokeyencryptioninstance.hash_hmac(hashforce, datastring, keystring);
	}
	
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
	
	// symetric
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
	
	signString(session, privatekey, plaintext) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setPrivateKey(privatekey);

		return cryptokey.signString(plaintext);
	}

	validateStringSignature(session, address, plaintext, signature) {
		var cryptokey = session.createBlankCryptoKeyObject();
		cryptokey.setAddress(address);

		return cryptokey.validateStringSignature(plaintext, signature);
	}
	
	// asymetric
	rsaEncryptString(senderaccount, recipientaccount, plaintext) {
		return senderaccount.rsaEncryptString(plaintext, recipientaccount);
	}
	
	rsaDecryptString(recipientaccount, senderaccount, cyphertext) {
		return recipientaccount.rsaDecryptString(cyphertext, senderaccount);
	}
	
	
	/***********************/
	/*      Wallet         */
	/***********************/

	async createDecimalAmount(session, amount, decimals) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.createDecimalAmountAsync(session, amount, decimals);
	}

	//
	// Schemes
	//

	async getSchemeList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getSchemeList(session, bRefresh);
	}

	async getSchemeConfigList(session, bRefresh) {
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		var schemelist = await walletmodule.getSchemeList(session, bRefresh);
		var array = [];

		for (var i = 0; i < schemelist.length; i++) {
			let scheme_config = schemelist[i].getJsonConfig();
			array.push(scheme_config);
		}

		return array;
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
		console.log('OBSOLETE: Controllers.createLocalSchemeConfig should no longer be used!');
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
		console.log('OBSOLETE: Controllers.getSchemeFromWeb3Url should no longer be used!');
		var global = this.global;
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getSchemeFromWeb3Url(session, web3url);
	}

	async createSchemeFee(scheme, feelevel) {
		console.log('OBSOLETE: Controllers.createSchemeFee should no longer be used!');
		var fee = this.createFee(feelevel);
		
		if (scheme) {
			fee.gaslimit = scheme.getGasLimit(feelevel);
			fee.gasPrice = scheme.getGasPrice(feelevel);
		}	
		
		return fee;
	}

	async createSchemeEthereumTransaction(session, scheme, fromaccount) {
		console.log('OBSOLETE: Controllers.createSchemeEthereumTransaction should no longer be used!');
		var global = this.global;
		
		var ethereumnodeaccessmodule = global.getModuleObject('ethereum-node-access');
	
		var ethereumtransaction =  ethereumnodeaccessmodule.getEthereumTransactionObject(session, fromaccount);

		// set chainid and networkid if specified
		var ethnodeserver = scheme.getEthNodeServerConfig();

		if (ethnodeserver && ethnodeserver.chainid)
			ethereumtransaction.setChainId(ethnodeserver.chainid);

		if (ethnodeserver && ethnodeserver.networkid)
			ethereumtransaction.setNetworkId(ethnodeserver.networkid);

		// set default fee
		var fee = await this.createSchemeFee(scheme);

		ethereumtransaction.setGas(fee.gaslimit);
		ethereumtransaction.setGasPrice(fee.gasPrice);

		
		return ethereumtransaction;
	}
	
	async getSchemeEthereumContractInstance(session, address, contractpath, scheme) {
		console.log('OBSOLETE: Controllers.getSchemeEthereumContractInstance should no longer be used!');
		var ethnodeserverconfig = scheme.getEthNodeServerConfig();

		return this.getEthereumContractInstance(session, address, contractpath, ethnodeserverconfig);
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
	
	async makeWallet(session, authname, schemeuuid) {
		// we make client or remote wallets, depending on the scheme
		var global = this.global;

		var walletmodule = global.getModuleObject('wallet');
		var Wallet = walletmodule.Wallet;

		var scheme = await walletmodule.getSchemeFromUUID(session, schemeuuid);

		if (!scheme)
			throw new Error('could not find scheme');

		var wallettype = scheme.getSchemeType();

		var walletjson = {};
		walletjson.authname = authname;
		walletjson.type = wallettype;
		walletjson.uuid = session.guid();;
		walletjson.schemeuuid = schemeuuid;
		walletjson.label = authname;

		const wallet_new =  Wallet.readFromJson(walletmodule, session, walletjson);

		if (wallet_new)
			return wallet_new;
		else
			throw new Error('could not create wallet');
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

		if (bExists) {
			// if walletsession is remote for storage, we must check
			// that the account exists in the remote server
			let walletscheme = await wallet.getScheme();
			let networkconfig = walletscheme.getNetworkConfig();

			if (networkconfig.authserver.activate && networkconfig.restserver.activate) {
				let storageaccessmodule = global.getModuleObject('storage-access');

				let walletsession = wallet._getSession();
				let storage_access_instance = storageaccessmodule.getStorageAccessInstance(session);

				let _remotestored = await storage_access_instance.account_session_keys();
				let _remoteaccounts = _remotestored.keys;
				let bFound = false;

				for (var i = 0; i < (_remoteaccounts ? _remoteaccounts.length : 0); i++) {
					var accountaddress = _remoteaccounts[i].address;
					
					if (session.areAddressesEqual(_address, accountaddress)) {
						bFound = true;
						break;
					}
				}

				if (bFound === false)
					bExists = false;
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
		
		if (!name)
		throw new Error('name is undefined');
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getContact(session, name);
	}
	
	async getContactFromUUID(session, contactuuid) {
		var global = this.global;
		
		if (!contactuuid)
		throw new Error('contact uuid is undefined');
		
		var walletmodule = global.getModuleObject('wallet');

		return walletmodule.getContactFromUUID(session, contactuuid);
	}
	
	async getContactFromEmail(session, email) {
		var global = this.global;

		if (!email)
		throw new Error('email is undefined');
		
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

	// cards
	async importWalletCard(session, wallet, cardname, address, configurl, authname, password, options) {
		const card = await wallet.importCard(address, configurl, authname, password, options);

		card.setLabel(cardname);
				
		await card.save();

		return card;
	}

	async createWalletCard(session, wallet, scheme, privatekey) {
		
		if (!scheme)
			return Promise.reject('no scheme defined');

		var sessionaccount;

		if (privatekey) {
			// create a session account from private key
			if (this.isValidPrivateKey(session, privatekey)) {
				sessionaccount = await this.getSessionAccountFromPrivateKey(session, wallet, privatekey);
			}
	
			if (!sessionaccount)
				return Promise.reject('not a valid private key');
	
		}
		else {
			// we generate a key
			var _privatekey = this.generatePrivateKey();
			
			sessionaccount = await this.getSessionAccountFromPrivateKey(session, wallet, _privatekey);
	
			if (!sessionaccount)
				return Promise.reject('could not generate a private key');
		}

		var card;

		if (scheme.isRemote() === false) {
			var address = sessionaccount.getAddress();
			var configurl = 'storage://scheme?uuid=' + scheme.getSchemeUUID();
			var authname = null;
			var password = null;
			var options = {};
	
			card = await wallet.importCard(address, configurl, authname, password, options);
		}
		else {
			var wallettype = wallet.getWalletType();

			switch(wallettype) {
				case 0:
					return Promise.reject('ERR_MISSING_CREDENTIALS');
				case 1:
					var walletschemeuuid = wallet.getSchemeUUID();

					if (walletschemeuuid && (walletschemeuuid === scheme.getSchemeUUID())) {
						var address = sessionaccount.getAddress();
						var configurl = 'storage://scheme?uuid=' + scheme.getSchemeUUID();
						var authname = null;
						var password = null;
						var options = {};
				
						card = await wallet.importCard(address, configurl, authname, password, options);

						break;
					}
					else
						return Promise.reject('ERR_MISSING_CREDENTIALS');
				default:
					return Promise.reject('wrong wallet type: ' + wallettype);
			}
		}

		if (card) {
			await card.init();

			if (card.isLocked()) {
				await card.unlock();
			}

			return card
		}
		else
			throw new Error('could not create card');
	}

	async createWalletCardFromPrivateKey(session, wallet, web3providerurl, privatekey) {
		console.log('OBSOLETE: Controllers.createWalletCardFromPrivateKey should no longer be used!');
		
		// create a session account
		if (this.isValidPrivateKey(session, privatekey)) {
			var sessionaccount = await this.getSessionAccountFromPrivateKey(session, wallet, privatekey);
		}

		if (!sessionaccount)
			return Promise.reject('not a valid private key');


		// get a scheme, or create one if necessary
		var scheme;
								
		// get list of local schemes
		var localschemes = await this.getLocalSchemeList(session, true);
		var bCreateScheme = true;
		
		for (var i = 0; i < localschemes.length; i++) {
			// compare with web3_provider_url to see if we have a scheme that matches
			var networkconfig = localschemes[i].getNetworkConfig()
			if (networkconfig.ethnodeserver && (networkconfig.ethnodeserver.web3_provider_url == web3providerurl)) {
				bCreateScheme = false;
				scheme = localschemes[i];
				break;
			}
		}
		
		if (bCreateScheme) {
			// else we create a local scheme and save it
			var defaultlocalscheme = await this.getDefaultScheme(session, 0);
			scheme = await defaultlocalscheme.cloneOnWeb3ProviderUrl(web3providerurl);
		}
		
		if (!scheme)
			return Promise.reject('could not retrieve a scheme for ' + web3providerurl);

		var address = sessionaccount.getAddress();
		var configurl = 'storage://scheme?uuid=' + scheme.getSchemeUUID();
		var authname = null;
		var password = null;
		var options = {};

		var card = await wallet.importCard(address, configurl, authname, password, options);

		return card;
	}

	async makeWalletCard(session, wallet, scheme, authname, password, address) {
		// to create a remote card on a remote wallet, with different schemes
		var global = this.global;
		var Card = global.getModuleClass('wallet', 'Card');;

		var cardjson = {};
		cardjson.authname = authname;
		cardjson.address = address;
		cardjson.password = password;

		cardjson.uuid = session.guid();
		cardjson.label = authname;

		const card_new =  Card.readFromJson(wallet, scheme, cardjson);

		if (card_new) {
			await card_new.init();

			if (card_new.isLocked()) {
				await card_new.unlock();
			}

			return card_new;
		}
		else
			throw new Error('could not create card');

	}


	/***********************/
	/*    OAuth2           */
	/***********************/

	async getOAuth2AuthorizeUrl(session, params) {
		var global = this.global;
		
		var oauth2module = global.getModuleObject('oauth2');
		var oauth2interface = oauth2module.getOAuth2Interface();
		
		return oauth2interface.getOAuth2AuthorizeUrl(session, params);
	}


	/***********************/
	/*      Utils          */
	/***********************/
	compareUrl(url1, url2) {
		var _url1 = (url1 && url1.endsWith('/') ? url1.substring(0, url1.length - 1 ) : url1);
		var _url2 = (url2 && url2.endsWith('/') ? url2.substring(0, url2.length - 1 ) : url2);

		if (_url1 && _url2 && (_url1 == _url2))
		return true;
		else
		return false;
	}

	

	

	
	/***********************/
	/*    MyTokens         */
	/***********************/
	
	async getPublicSchemeList(session, bRefresh) {
		var global = this.global;
		
		var mytokensmodule = global.getModuleObject('mytokens');

		return mytokensmodule.getPublicSchemeList(session, bRefresh);
	}
	
	
	/***********************/
	/*     static          */
	/***********************/

	// static
	static getObject() {
		if (modulecontrollers)
			return modulecontrollers;
		
		modulecontrollers = new ModuleControllers();
		
		return modulecontrollers;
	}
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('clientmodules', 'Controllers', ModuleControllers);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('clientmodules', 'Controllers', ModuleControllers);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('clientmodules', 'Controllers', ModuleControllers);
}