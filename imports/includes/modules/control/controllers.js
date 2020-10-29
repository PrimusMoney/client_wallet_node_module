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

	getArtifact(artifactname) {
		return this.ethereum_core.getArtifact(artifactname);
	}
	
	async getLocalJsonLeaf(session, keys, bForceRefresh) {
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
			.catch(err => reject(err));
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
	
	createFee(level) {
		var fee = {};
		
		fee.gaslimit = 4850000;
		fee.gasPrice = 10000000000;
		
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
					res.data_decoded_utf8 = ethereumnodeaccessmodule.web3ToUTF8(session, data);
				
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
					res.input_decoded_utf8 = ethereumnodeaccessmodule.web3ToUTF8(session, input);
				
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
		const balance = erc20tokencontract.balanceOf(account)
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
	
	async sendERC20Tokens(session, providerurl, tokenaddress, senderprivatekey, recipientaddress, fee) {
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

	
	/***********************/
	/*      common         */
	/***********************/

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
	
	
	/***********************/
	/*      Wallet         */
	/***********************/

	//
	// Schemes
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