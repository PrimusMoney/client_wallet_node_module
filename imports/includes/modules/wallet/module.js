'use strict';

var Module = class {
	
	constructor() {
		this.name = 'wallet';
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;
		
		this.activated = true;
		
		// cached lists
		this.schemes = [];
		this.wallets = [];
		this.contacts = [];
		
		//this.transactions = [];
	}
	
	activation(choice) {
		if (choice === false) {
			this.activated = false;
		}
		else if (this.activated === false) {
			this.activated = true;
		}
	}
	
	init() {
		console.log('module init called for ' + this.name);
		
		this.isready = true;
	}
	
	// compulsory module functions
	loadModule(parentscriptloader, callback) {
		console.log('loadModule called for module ' + this.name);

		if (this.isloading)
			return;
			
		this.isloading = true;

		var self = this;
		var global = this.global;

		// wallet module script loader
		var modulescriptloader;
		
		// look if walletloader already created (e.g. for loading in node.js)
		modulescriptloader = global.findScriptLoader('walletloader');

		// if not, create on as child as parent script loader passed in argument
		if (!modulescriptloader)
		modulescriptloader = global.getScriptLoader('walletloader', parentscriptloader);
		
		
		var xtraroot = './includes';
		
		var interfaceroot = xtraroot + '/interface';

		//modulescriptloader.push_script( interfaceroot + '/wallet-server-access.js');
		
		//var moduleroot = './includes/modules/authkey';
		var moduleroot = xtraroot + '/modules/wallet';

		modulescriptloader.push_script( moduleroot + '/model/card.js');
		modulescriptloader.push_script( moduleroot + '/model/contact.js');
		modulescriptloader.push_script( moduleroot + '/model/scheme.js');
		modulescriptloader.push_script( moduleroot + '/model/token-account.js');
		modulescriptloader.push_script( moduleroot + '/model/transaction.js');
		modulescriptloader.push_script( moduleroot + '/model/token.js');
		modulescriptloader.push_script( moduleroot + '/model/wallet.js');
		
		modulescriptloader.load_scripts(function() { self.init(); if (callback) callback(null, self); });
		
		return modulescriptloader;
	}
	
	isReady() {
		return this.isready;
	}

	hasLoadStarted() {
		return this.isloading;
	}

	// optional  module functions
	registerHooks() {
		console.log('module registerHooks called for ' + this.name);
		
		var global = this.global;
		
		global.registerHook('setSessionNetworkConfig_asynchook', this.name, this.setSessionNetworkConfig_asynchook);
		
		
		// signal module is ready
		var rootscriptloader = global.getRootScriptLoader();
		rootscriptloader.signalEvent('on_wallet_module_ready');
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
	setSessionNetworkConfig_asynchook(result, params) {
		console.log('setSessionNetworkConfig_asynchook called for ' + this.name);
		
		var global = this.global;
		
		var session = params[0];
		var networkconfig = params[1];
		
		var promise = new Promise((resolve, reject) => {
			console.log('setting session\'s network config in module ' + this.name);
			
			resolve(true);
			
			return true;
		});
		
		result.push({module: this.name, handled: true});
		
		return promise;
	}

	
	//
	// API
	//
	
	

	//
	// wallets
	//
	_transferToList(newlist, oldlist) {
		var _findWallet = (uuid) => {
			for (var i = 0; i < oldlist.length; i++) {
				if (uuid == oldlist[i].uuid)
					return oldlist[i];
			}
		}
		
		// got through new list to copy existing sessions
		for (var i = 0; i < newlist.length; i++) {
			var oldwallet = _findWallet(newlist[i].uuid);
			
			if (oldwallet)
				newlist[i]._transfer(oldwallet);
		}
	}
	
	getWalletList(session, bRefresh, callback) {
		var global = this.global;
		
		if ( (!bRefresh) || (bRefresh === false)) {
			if (callback)
				callback(null, this.wallets);
			
			return Promise.resolve(this.wallets);
		}
		
		var commonmodule = global.getModuleObject('common');
		var walletmodule = this;
		var Wallet = this.Wallet;
		
		var _keys = ['shared', 'wallet', 'wallets']; // look in 'shared' branch
		
		var clientAccess = session.getClientStorageAccessInstance();
		
		// keep current list within closure
		var oldlist = this.wallets;
		
		return new Promise((resolve, reject) => { 
			clientAccess.readClientSideJson(_keys, (err, res) => {
				if (err) {
					resolve([]);
				}
				else {
					var array = (res ? res : []);
					var wallets = [];
					
					for (var i = 0; i < array.length; i++) {
						var wallet = Wallet.readFromJson(walletmodule, session, array[i]);
						
						wallets.push(wallet);
					}
					
					// transfer sessions
					this._transferToList(wallets, oldlist)
					
					this.wallets = wallets;

					resolve(this.wallets);
				}
			});
		})
		.then((wallets) => {

			if (callback)
				callback(null, wallets);
			
			return wallets;
		});
	}
	
	saveWalletList(session, wallets, callback) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		
		var _keys = ['shared', 'wallet', 'wallets']; // look in 'shared' branch
		
		// create json
		var walletsjson = [];
		
		for (var i = 0; i < wallets.length; i++) {
			var wallet = wallets[i];
			var walletjson = wallet.getLocalJson();
			
			walletsjson.push(walletjson);
		}
		
		var clientAccess = session.getClientStorageAccessInstance();
		
		return new Promise((resolve, reject) => { 
			clientAccess.saveClientSideJson(_keys, walletsjson, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		})
		.then((res) => {
			this.wallets = wallets;

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
	
	importWallet(session, configurl, authname, password, options, callback) {
		var global = this.global;
		var walletmodule = this;
		var Wallet = this.Wallet;
		
		if (!configurl)
			Promise.reject('no url provided to import wallet');
		
		var walletname = authname;
		var walletuuid = session.guid();
		var wallettype =  Wallet.REMOTE_WALLET;
		
		var commonmodule = global.getModuleObject('common');
		var clientsmodule = global.getModuleObject('clientmodules');
		
		var wallet;
		var scheme;
		var cards = [];

		// retrieve network config
		return this.importScheme(session, configurl)
		.then((schm) => {
			// note scheme object
			scheme = schm;
			
			// create a wallet on this scheme
			if (scheme.getSchemeType() == 0) {
				wallettype = Wallet.CLIENT_WALLET;
				
				return this.createWallet(session, walletname, password, wallettype)
				.then((wllt) => {
					wllt.setSchemeUUID(scheme.getSchemeUUID());
					return wllt;
				});
				
			}
			else {
				return new Promise((resolve, reject) => {
					wallettype = Wallet.REMOTE_WALLET;
					
					var walletjson = {};
					
					walletjson.authname = authname;
					walletjson.type = wallettype;
					walletjson.uuid = walletuuid;
					walletjson.schemeuuid = scheme.getSchemeUUID();
					walletjson.label = walletname;
					
					var wallet = Wallet.readFromJson(walletmodule, session, walletjson);

					resolve(wallet);
				});
			}

		})
		.then((res) => {
			// note wallet object
			wallet = res;
			
			// set config for wallet session
			var walletsession = wallet._getSession();
			var networkconfig = scheme.getNetworkConfig();
			
			return clientsmodule.setSessionNetworkConfig(walletsession, networkconfig);
		})
		.then(sess => {
			// authenticate
			return wallet.unlock(password);
		})
		.then(() => {
			// look if user has an email
			var walletsession = wallet._getSession();
			var walletuser = walletsession.getSessionUserObject();
			
			if (walletuser) {
				var username = walletuser.getUserName();
				var useremail = walletuser.getUserEmail();
				
				wallet.setOwnerName(username);
				wallet.setOwnerEmail(useremail);
			}

			// save the wallet
			return wallet.save();
		})
		.then(() => {
			// retrieve session accounts
			var walletsession = wallet._getSession();
			
			return walletsession.getSessionAccountObjects(true);
		})
		.then(sessionaccounts => {
			var _username = walletname;
			var _password = password;
			
			// we create one card for each personal account
			if (sessionaccounts) {
				var _createcardpromisefunc = (sessionaccount) => {
					var _address = sessionaccount.getAddress();
					var _description = sessionaccount.getDescription();
					var _card;
					
					return wallet.createCard(scheme, _username, _password, _address)
					.then((crd) => {
						_card = crd;
						_card.setLabel(_description);
						return _card.save();
					})
					.then(() => {
						return _card;
					})
					.catch((err) => {
						console.log('error while creating card ' + _username + ': ' + err);
					});
				};
				
				return this.chained_resolve(sessionaccounts, _createcardpromisefunc);
			}
			else {
				return Promise.resolve([]);
			}
		})
		.then((cardarray) => {
			if (cardarray) {
				cards = cardarray;
				
				var _createtokenpromisefunc = (card) => {
					return card.importTokenAccounts()
					.catch(err => {
						return Promise.resolve([]);
					});
					
				};
				
				return this.chained_resolve(cardarray, _createtokenpromisefunc);
			}
			else {
				return Promise.resolve([]);
			}
		})
		.then(() => {
			// then retrieve transaction history
			var walletsession = wallet._getSession();

			var ethnodemodule = global.getModuleObject('ethnode');
			
			return ethnodemodule.getTransactionList(walletsession)
			.catch(err => {
				return Promise.resolve([]);
			});
		})
		.then((ethtransactionarray) => {
			var walletsession = wallet._getSession();

			if (ethtransactionarray) {
				var _createtransactionpromisefunc = (tx) => {
					var from = tx.getFrom();
					var to = tx.getTo();
					
					// scan to find card involved
					var __txcard;
					
					for (var i = 0; i < cards.length; i++) {
						if (from && (from == cards[i].getAddress()))
							__txcard = cards[i];
					}
					
					if (!__txcard) {
						for (var i = 0; i < cards.length; i++) {
							if (to && (to == cards[i].getAddress()))
								__txcard = cards[i];
						}
					}
					
					return wallet.createCardTransaction(__txcard, tx);
					
				};
				
				return this.chained_resolve(ethtransactionarray, _createtransactionpromisefunc);
			}
			else {
				return Promise.resolve([]);
			}
		})
		.then(() => {
			if (callback)
				callback(null, wallet);
				
			return wallet;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	_saveWallet(wallet, callback) {
		if (wallet.isLocked()) {
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		// we do an non-atomic save
		var session = wallet._getSession();
		var wallets;
		
		return this.getWalletList(session, true)
		.then((wllts) => {
			wallets = wllts;
			
			if (wallets) {

				// check if it is in the list
				var bInList = false;
				
				for (var i = 0; i < wallets.length; i++) {
					if (wallet.getWalletUUID() == wallets[i].getWalletUUID()) {
						bInList = true;
						wallets[i] = wallet;
						break;
					}
				}
				
				// add it if it is not
				if (!bInList)
				wallets.push(wallet);
	
				
				return this.saveWalletList(session, wallets);
			}
			else {
				return Promise.reject('could not retrieve the list of wallets');
			}
			
		})		
		.then((walletsjson) => {
			if (callback)
				callback(null, wallet);
			
			return wallet;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}
	
	createWallet(session, walletname, password, wallettype, callback) {
		var global = this.global;
		var walletmodule = this;
		var Wallet = this.Wallet;
		
		var walletuuid = session.guid();
		
		var commonmodule = global.getModuleObject('common');
		

		switch(wallettype) {
			case Wallet.CLIENT_WALLET:
				var vaultname = Wallet._getSafeVaultNameFromUUID(walletuuid);
				var vaulttype = 0;
				
				var createvaultpromise = new Promise((resolve, reject) => { 
					commonmodule.createVault(session, vaultname, password, vaulttype, (err, res) => {
						if (err) {
							reject(err); 
						}
						else {
							var walletjson = {};
							walletjson.authname = walletuuid;
							walletjson.type = wallettype;
							walletjson.uuid = walletuuid;
							walletjson.schemeuuid = 'default-0';
							walletjson.label = walletname;
							
							var wallet = Wallet.readFromJson(walletmodule, session, walletjson);

							resolve(wallet);
						}
					});
				});
				break;
				
			case Wallet.REMOTE_WALLET:
				var createvaultpromise = new Promise((resolve, reject) => { 
					var walletjson = {};
					walletjson.authname = walletname;
					walletjson.type = wallettype;
					walletjson.uuid = walletuuid;
					walletjson.schemeuuid = 'default-1';
					walletjson.label = walletname;
					
					var wallet = Wallet.readFromJson(walletmodule, session, walletjson);

					resolve(wallet);
				});
				break;
				
			default:
				var createvaultpromise = Promise.reject('unknown wallet type: ' + wallettype);
				break;
		}
		
		var wallet;
		
		return createvaultpromise
		.then((wllt) => {
			wallet = wllt
			
			return wallet.unlock(password);
		})
		.then(() => {
			// save wallet
			return wallet.save();
		})
		.then(() => {
			if (callback)
				callback(null, wallet);
			
			return wallet;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	modifyWallet(session, walletuuid, walletinfo, callback) {
		var global = this.global;
		var wallet;
		
		var label = walletinfo.label;
		var ownername = walletinfo.ownername;
		var owneremail = walletinfo.owneremail;
		
		return this.getWalletFromUUID(session, walletuuid)
		.then((wllt) => {
			wallet = wllt;
			
			wallet.setLabel(label);
			wallet.setOwnerName(ownername);
			wallet.setOwnerEmail(owneremail);
			
			if (walletinfo.xtra_data)
				wallet.putXtraData(null, walletinfo.xtra_data);
			
			return wallet.save();
		})
		.then(wllt => {
			if (callback)
				callback(null, wallet);
			
			return wallet;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getWallet(session, walletname, callback) {
		return this.getWalletList(session, true)
		.then((wallets) => {
			for (var i = 0; i < (wallets ? wallets.length : 0); i++) {
				var wallet = wallets[i];
				var _walletname = wallet.getName();
				if (_walletname == walletname) {
					return wallet;
				}
			}
			
			throw new Error('ERR_WALLET_NOT_FOUND');
		})
		.then((wallet) => {
			if (callback)
				callback(null, wallet);
			
			return wallet;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}
	
	getWalletFromUUID(session, walletuuid, callback) {
		return this.getWalletList(session, true)
		.then((wallets) => {
			for (var i = 0; i < (wallets ? wallets.length : 0); i++) {
				var wallet = wallets[i];
				if (walletuuid == wallet.uuid) {
					return wallet;
				}
			}
			
			throw new Error('ERR_WALLET_NOT_FOUND');
		})
		.then((wallet) => {
			if (callback)
				callback(null, wallet);
			
			return wallet;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

		
	}
	
	openWalletFromUUID(session, walletuuid, password, callback) {
		var wallet;
		
		return this.getWalletFromUUID(session, walletuuid)
		.then((wllt) => {
			wallet = wllt
			return wallet.unlock(password);
		})
		.then((res) => {
			if (callback)
				callback(null, wallet);
			
			return wallet;
		})
		.catch( (err) =>{
			if (callback)
				callback(err, null);
			
			throw new Error('ERR_WALLET_LOCKED');
		});	}
	
	openWallet(session, walletname, password, callback) {
		var wallet;
		
		return this.getWallet(session, walletname)
		.then((wllt) => {
			wallet = wllt;
			
			return wallet.unlock(password);
		})
		.then((res) => {
			if (callback)
				callback(null, wallet);
			
			return wallet;
		})
		.catch( (err) =>{
			if (callback)
				callback(err, null);
			
			throw new Error('ERR_WALLET_LOCKED');
		});
	}
	
	closeWallet(session, wallet, callback) {
		return new Promise((resolve, reject) => { 
			wallet.lock((err, res) => {
				if (err) reject(err); else resolve(res);
			});
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
	
	getFromWallet(session, wallet, key) {
		// TODO: check session matches wallet's session
		return wallet.getValue(key);
	}
	
	putInWallet(session, wallet, key, value, callback) {
		// TODO: check session matches wallet's session
		return wallet.putValue(key, value, callback);
	}
	
	//
	// schemes
	//
	getSchemeList(session, bRefresh, callback) {
		var global = this.global;
		
		if ( (!bRefresh) || (bRefresh === false)) {
			if (callback)
				callback(null, this.schemes);
			
			return Promise.resolve(this.schemes);
		}
		
		var commonmodule = global.getModuleObject('common');
		var walletmodule = this;
		
		var _keys = ['shared', 'wallet', 'schemes']; // look in 'shared' branch
		
		var clientAccess = session.getClientStorageAccessInstance();
		
		return new Promise((resolve, reject) => { 
			clientAccess.readClientSideJson(_keys, (err, res) => {
				if (err) {
					resolve([]);
				}
				else {
					var schemelist = res;
					
					var schemes = [];
					
					for (var i = 0; i < (schemelist ? schemelist.length : 0); i++) {
						var schemejson = schemelist[i];
						var scheme = this.Scheme.readFromJson(walletmodule, session, schemejson);
						
						schemes.push(scheme);
					}
					
					this.schemes = schemes;

					resolve(this.schemes);
				}
			});
		})
		.then((schemes) => {
			if (callback)
				callback(null, schemes);
			
			return schemes;
		});

	}
	
	getLocalSchemeList(session, bRefresh, callback) {
		var global = this.global;
		
		return this.getSchemeList(session, bRefresh)
		.then((schemes) => {
			var array = [];
			for (var i = 0; i < (schemes ? schemes.length : 0); i++) {
				if (schemes[i].getSchemeType() == 0)
					array.push(schemes[i])
			}
			
			return array;
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

	
	getRemoteSchemeList(session, bRefresh, callback) {
		var global = this.global;
		
		return this.getSchemeList(session, bRefresh)
		.then((schemes) => {
			var array = [];
			for (var i = 0; i < (schemes ? schemes.length : 0); i++) {
				if (schemes[i].getSchemeType() == 1)
					array.push(schemes[i])
			}
			
			return array;
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

	saveSchemeList(session, schemes, callback) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		
		var _keys = ['shared', 'wallet', 'schemes']; // look in 'shared' branch
		
		// create json
		var schemesjson = [];
		
		for (var i = 0; i < schemes.length; i++) {
			var scheme = schemes[i];
			var schemejson = scheme.getLocalJson();
			
			schemesjson.push(schemejson);
		}
		
		var clientAccess = session.getClientStorageAccessInstance();
		
		return new Promise((resolve, reject) => { 
			clientAccess.saveClientSideJson(_keys, schemesjson, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
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
	
	_saveScheme(scheme, callback) {
		// we do an non-atomic save
		// save scheme by adding it to list and saving list
		var session = scheme.session;
		var schemes;
		var schemeuuid = scheme.getSchemeUUID();
		
		if (schemeuuid == 'default-0' || schemeuuid == 'default-1') {
			// no need to save built-in default schemes
			if (callback)
				callback(null, scheme);
			
			return Promise.resolve(scheme);
		}
		
		return this.getSchemeList(session, true)
		.then((schms) => {
			schemes = schms;
			
			if (schemes) {
				// check if it is in the list
				var bInList = false;
				
				for (var i = 0; i < schemes.length; i++) {
					if (scheme.getSchemeUUID() == schemes[i].getSchemeUUID()) {
						bInList = true;
						schemes[i] = scheme;
						break;
					}
				}
				
				// add it if it is not
				if (!bInList)
				schemes.push(scheme);
			
				return this.saveSchemeList(session, schemes);
			}
			else {
				return Promise.reject('could not retrieve the list of schemes');
			}
			
		})
		.then((schemesjson) => {
			if (callback)
				callback(null, scheme);
			
			return scheme;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	_getXMLHttpRequestClass() {
		if (typeof XMLHttpRequest !== 'undefined' && XMLHttpRequest ) {
			return XMLHttpRequest;
		}
		else if (typeof window !== 'undefined' && window ) {
			// normally (browser or react native), XMLHttpRequest should be directly accessible
			if (typeof window.XMLHttpRequest !== 'undefined')
				return window.XMLHttpRequest;
			else if ( (typeof window.simplestore !== 'undefined')
					&& (typeof window.simplestore.XMLHttpRequest !== 'undefined'))
					return window.simplestore.XMLHttpRequest;
		}
		else if ((typeof global !== 'undefined') && (typeof global.simplestore !== 'undefined')
				&& (typeof global.simplestore.XMLHttpRequest !== 'undefined')) {
			return global.simplestore.XMLHttpRequest;
		}
		else {
			throw 'can not find XMLHttpRequest class!!!';
		}
	}
	
	_http_get(configurl) {
		return new Promise((resolve, reject) => {
			var _XMLHttpRequest = this._getXMLHttpRequestClass()
			var xhttp = new _XMLHttpRequest();
			
			xhttp.open('GET', configurl, true);
			
			xhttp.setRequestHeader("Content-type", "application/json");
			
			xhttp.send();
			
			xhttp.onload = function(e) {
				if (xhttp.status == 200) {
					var res = {};
					
					try {
						res = JSON.parse(xhttp.responseText);
					}
					catch(e) {
					}

					resolve(res);
				}
				else {
					reject('wrong result');
				}
			};
			
			xhttp.onerror = function (e) {
				reject('rest error is ' + xhttp.statusText);
			};
		});
	}
	
	isValidSchemeConfig(session, configurl, callback) {
		var global = this.global;
		var walletmodule = this;
		
		if (!configurl) {
			if (callback)
				callback('no url provided to import scheme', null);
			
			return Promise.reject('no url provided to import scheme');
		}
		
		if ((!configurl.startsWith('http://')) && (!configurl.startsWith('https://'))) {
			if (callback)
				callback('support of only http:// or https:// URI', null);
			
			return Promise.reject('support of only http:// or https:// URI');
		}
		
		// retrieve network config
		return this._http_get(configurl)
		.then(res => {
			if (!res || !res.config)
				throw new Error('could not retrieve network configuration from this url');
			
			if (!res.config.restserver)
				throw new Error('content error for network configuration from this url'); // simple check for the moment
			
			return true
		})
		.catch(err => {
			return false;
		});
		
	}
	
	importScheme(session, configurl, callback) {
		var global = this.global;
		var walletmodule = this;
		
		if (!configurl) {
			if (callback)
				callback('no url provided to import scheme', null);
			
			return Promise.reject('no url provided to import scheme');
		}
		
		var scheme;
		
		// retrieve network config
		return this._http_get(configurl)
		.then(res => {
			if (!res || !res.config)
				throw new Error('could not retrieve network configuration from this url');
			
			// save config as scheme
			var schemeconfig = res.config;
			
			var schemeconfiguuid = schemeconfig.uuid
			
			return new Promise((resolve, reject) => {
				// look if we have already this scheme, based on the uuid
				var scheme;
				
				return this.getSchemeFromUUID(session, schemeconfiguuid)
				.then(schm => {
					scheme = schm;
					
					return this.updateScheme(session, scheme, schemeconfig);
				})
				.then(() => {
					resolve(scheme);
				})
				.catch(err => {
					// otherwise we create one now
					return this.createScheme(session, schemeconfig)
					.then(schm => {
						resolve(schm);
					});
				});
			});
		})
		.then(schm => {
			scheme = schm;

			scheme.setConfigUrl(configurl);
			
			// look if we need to fetch default web3 provider url
			var web3providerurl = scheme.getWeb3ProviderUrl();
			
			if (web3providerurl)
				return web3providerurl;
			else
				return scheme.fetchDefaultWeb3ProviderUrl();
		})
		.then(() => {
			return scheme.save();
		})
		.then(() => {
			if (callback)
				callback(null, scheme);
			
			return scheme;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}


	createScheme(session, schemejson, callback) {
		var walletmodule = this;
		var SchemeClass = walletmodule.Scheme;
		
		var scheme = SchemeClass.readFromJson(walletmodule, session, schemejson);
		

		return scheme.save()
		.then(schm => {
			if (callback)
				callback(null, scheme);
			
			return scheme;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
		
	}
	
	updateScheme(session, scheme, schemeinfo) {
		if (!schemeinfo)
			return;
		
		var label = schemeinfo.label;
		
		// overload label
		if (label)
		scheme.setLabel(label);
		
		// overload ethnode config
		if (schemeinfo.ethnodeserver)
			scheme.setEthNodeServerConfig(schemeinfo.ethnodeserver);
		
		// overload xtra data
		if (schemeinfo.xtra_data)
			scheme.putXtraData(null, schemeinfo.xtra_data);
		
		return scheme.save();
	}
	
	modifyScheme(session, schemeuuid, schemeinfo, callback) {
		var scheme;
		
		
		return this.getSchemeFromUUID(session, schemeuuid)
		.then((schm) => {
			scheme = schm;
			
			return this.updateScheme(session, scheme, schemeinfo);
		})
		.then(schm => {
			if (callback)
				callback(null, scheme);
			
			return scheme;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
		
	}
	
	getSchemeFromConfigUrl(session, configurl, callback) {
		var global = this.global;
		var walletmodule = this;
		var SchemeClass = walletmodule.Scheme
		
		if (!configurl) {
			if (callback)
				callback('no url provided to import scheme', null);
			
			return Promise.reject('no url provided to import scheme');
		}
		
		// retrieve network config
		
		// retrieve network config
		return this._http_get(configurl)
		.then(res => {
			if (!res || !res.config)
				throw new Error('could not retrieve network configuration from this url');
			
			// save config as scheme
			var schemejson = res.config;
			
			return SchemeClass.readFromJson(walletmodule, session, schemejson);
		})
		.then(schm => {
			if (callback)
				callback(null, schm);
			
			return schm;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getSchemeFromWeb3Url(session, web3url, callback) {
		var global = this.global;
		var walletmodule = this;
		var SchemeClass = walletmodule.Scheme
		
		if (!web3url) {
			if (callback)
				callback('no web3 url provided for scheme', null);
			
			return Promise.reject('no web3 url provided for scheme');
		}
		
		return this.getLocalSchemeList(session, true)
		.then((schemes) => {
			for (var i = 0; i < (schemes ? schemes.length : 0); i++) {
				var scheme = schemes[i];
				var schemeweb3url = scheme.ethnode_web3_provider_url;
				
				if (schemeweb3url == web3url) {
					return scheme;
				}
			}
			
			throw new Error('ERR_SCHEME_NOT_FOUND');
		})
		.then(schm => {
			if (callback)
				callback(null, schm);
			
			return schm;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	
	getSchemeFromUUID(session, schemeuuid, callback) {
		return this.getSchemeList(session, true)
		.then((schemes) => {
			for (var i = 0; i < (schemes ? schemes.length : 0); i++) {
				var scheme = schemes[i];
				if (schemeuuid == scheme.uuid) {
					return scheme;
				}
			}
			
			if (schemeuuid == 'default-0' || schemeuuid == 'default-1') {
				var flag = parseInt(schemeuuid.substring(8));
				var schemejson = this.getDefaultSchemeConfig(flag)
				
				var scheme = this.Scheme.readFromJson(this, session, schemejson);
				
				return scheme;
			}
			
			throw new Error('ERR_SCHEME_NOT_FOUND');
		})
		.then(schm => {
			if (callback)
				callback(null, schm);
			
			return schm;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getDefaultSchemeConfig(flag) {
		var global = this.global;

		var schemeconfig = {restserver: {activate: false}, authserver: {activate: false}, keyserver: {activate: false}, ethnodeserver: {activate: false}};
		
		schemeconfig.name = 'default ' + (flag == 0 ? 'local' : 'remote');
		schemeconfig.label = 'default ' + (flag == 0 ? 'local' : 'remote');
		schemeconfig.uuid = 'default-' + flag + '';
		
		var result = []; 
		var params = [];
		
		params.push(schemeconfig);
		params.push(flag);
		
		// call hook to let modify schemeconfig
		var ret = global.invokeHooks('getDefaultSchemeConfig_hook', result, params);
		
		return schemeconfig;
	}
	
	createLocalSchemeConfig(session, web3_provider_url) {
		var localschemeconfig = this.getDefaultSchemeConfig(0);
		
		localschemeconfig.ethnodeserver.web3_provider_url = web3_provider_url;
		
		localschemeconfig.uuid = session.guid()
		
		return localschemeconfig;
	}
	
	getDefaultScheme(session, flag, callback) {
		var schemeconfig = this.getDefaultSchemeConfig(flag);
		
		return this.createScheme(session, schemeconfig)
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch((err) => {
			if (callback)
				callback(null, cards);
			
			throw new Error(err);
		});
	}
	
	//
	// RPC
	//
	isValidEthnodeRPC(session, rpcurl, callback) {
		var global = this.global;
		var walletmodule = this;
		
		if (!rpcurl) {
			if (callback)
				callback('no url provided to import scheme', null);
			
			return Promise.reject('no url provided to import scheme');
		}
		
		if ((!rpcurl.startsWith('http://')) && (!rpcurl.startsWith('https://'))) {
			if (callback)
				callback('support of only http:// or https:// URI', null);
			
			return Promise.reject('support of only http:// or https:// URI');
		}
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var ethereumaccessinstance = ethnodemodule.getEthereumNodeAccessInstance(session, rpcurl);
		
		return ethereumaccessinstance.web3_getNetworkId()
		.then(res => {
			if (!res)
				throw new Error('could not retrieve network id from this url');
			
			return true
		})
		.catch(err => {
			return false;
		});
	}
	
	//
	// contacts
	//
	getContactList(session, bRefresh, callback) {
		var global = this.global;
		
		if ( (!bRefresh) || (bRefresh === false)) {
			if (callback)
				callback(null, this.contacts);
			
			return Promise.resolve(this.contacts);
		}
		
		var commonmodule = global.getModuleObject('common');
		var walletmodule = this;
		
		var _keys = ['shared', 'wallet', 'contacts']; // look in 'shared' branch
		
		var clientAccess = session.getClientStorageAccessInstance();
		
		return new Promise((resolve, reject) => { 
			clientAccess.readClientSideJson(_keys, (err, res) => {
				if (err) {
					resolve([]);
				}
				else {
					var contactlist = res;
					
					var contacts = [];
					
					for (var i = 0; i < (contactlist ? contactlist.length : 0); i++) {
						var contactjson = contactlist[i];
						var contact = this.Contact.readFromJson(walletmodule, session, contactjson);
						
						contacts.push(contact);
					}
					
					this.contacts = contacts;

					resolve(this.contacts);
				}
			});
		})
		.then((contacts) => {
			if (callback)
				callback(null, contacts);
			
			return contacts;
		});

	}
	
	saveContactList(session, contacts, callback) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		
		var _keys = ['shared', 'wallet', 'contacts']; // look in 'shared' branch
		
		// create json
		var contactsjson = [];
		
		for (var i = 0; i < contacts.length; i++) {
			var contact = contacts[i];
			var contactjson = contact.getLocalJson();
			
			contactsjson.push(contactjson);
		}
		
		var clientAccess = session.getClientStorageAccessInstance();
		
		return new Promise((resolve, reject) => { 
			clientAccess.saveClientSideJson(_keys, contactsjson, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
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
	
	_saveContact(contact, callback) {
		// we do an non-atomic save
		// save contact by adding it to list and saving list
		var session = contact.session;
		
		return this.getContactList(session, true)
		.then((contacts) => {
			if (contacts) {
				// check if it is in the list
				var bInList = false;
				
				for (var i = 0; i < contacts.length; i++) {
					if (contact.getContactUUID() == contacts[i].getContactUUID()) {
						bInList = true;
						contacts[i] = contact;
						break;
					}
				}
				
				// add it if it is not
				if (!bInList)
				contacts.push(contact);
			
				return this.saveContactList(session, contacts);
			}
			else {
				return Promise.reject('could not retrieve the list of contacts');
			}
			
		})
		.then((contactsjson) => {
			if (callback)
				callback(null, contact);
			
			return contact;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	importContact(session, configurl, callback) {
		var global = this.global;
		var walletmodule = this;
		
		var contacts = [];
		
		if (!configurl)
			Promise.reject('no url provided to import contact');
		
		// retrieve network config
		return new Promise((resolve, reject) => {
			var restconnection = session.createRestConnection(configurl, '');
			
			restconnection.rest_get('', (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		})
		.then(res => {
			if (!res || !res.data)
				throw new Error('could not retrieve contacts from this url');
			
			// we can import more than one contact
			// a single contact is returned as an array of 1 element
			// save data array as list of contacts
			var array = res.data;
			
			return new Promise((resolve, reject) => {
				var _createcontactpromisefunc = (contc) => {
					var contactuuid = contc.uuid;
					
					var name = contc.name;
					var address = contc.address;
					
					var label = contc.label;
					var email = contc.email;
					var phone = contc.phone;
					
					var rsa_public_key = contc.rsa_public_key;
					
					var contactinfo = {uuid: contactuuid, name, address, label, email, phone, rsa_public_key};
					
					var contact;
					
					// look if we have already this contact, based on the uuid
					return this.getContactFromUUID(session, contactuuid)
					.then((ctc) => {
						contact = ctc;
						
						contacts.push(contact);
						
						return this.updateContact(session, contact, contactinfo);
					})
					.then(() => {
						resolve(contact);
					})
					.catch(err => {
						// otherwise we create one now
						
						return this.createContact(session, name, address, contactinfo)
						.then(ctc => {
							contact = ctc;
							
							contacts.push(contact);
							
							resolve(contact);
						});
					});
				};
				
				return this.chained_resolve(array, _createcontactpromisefunc);
				
			});
		})
		.then(() => {
			if (callback)
				callback(null, contacts[0]);
			
			return contacts[0];
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}


	createContact(session, name, address, contactinfo, callback) {
		var walletmodule = this;
		
		var contact;
		var contactjson = {};
		
		contactjson.name = name;
		contactjson.type = this.Contact.CLIENT_CONTACT;
		
		// look if we have a contact with this address
		var promisecontact = this.getContactFromAddress(session, address)
		.catch(err => {
			// no existing contact yet, we create one
			contactjson.uuid = (contactinfo && contactinfo.uuid ? contactinfo.uuid : session.guid());

			contactjson.address = address;

			if (contactinfo) {
				contactjson.label = (contactinfo.label ? contactinfo.label : name);
				contactjson.email = contactinfo.email;
				contactjson.phone = contactinfo.phone;
			}
			
			return this.Contact.readFromJson(walletmodule, session, contactjson);
		});
		
		


		return promisecontact.
		then((ctc) => {
			contact = ctc;

			return this.updateContact(session, contact, contactinfo);
		})
		.then(ctc => {
			if (callback)
				callback(null, contact);
			
			return contact;
		})		
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
		
	}
	
	updateContact(session, contact, contactinfo) {
		if (!contactinfo)
			return;
		
		var label = contactinfo.label;
		var email = contactinfo.email;
		var phone = contactinfo.phone;
		
		// obligatory
		contact.setLabel(label);
		contact.setEmail(email);
		contact.setPhone(phone);
		
		// optional
		var rsa_public_key = contactinfo.rsa_public_key;
		
		if (rsa_public_key)
			contact.setRsaPublicKey(rsa_public_key);
		
		// for additional modules
		if (contactinfo.xtra_data)
			contact.putXtraData(null, contactinfo.xtra_data);
		
		return contact.save();
	}
	
	modifyContact(session, contactuuid, contactinfo, callback) {
		var contact;
		
		return this.getContactFromUUID(session, contactuuid)
		.then((ct) => {
			contact = ct;
			
			return this.updateContact(session, contact, contactinfo);
		})
		.then(ctc => {
			if (callback)
				callback(null, contact);
			
			return contact;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	removeContact(session, contactuuid, callback) {
		return this.getContactList(session, true)
		.then((contacts) => {
			var array = [];
			
			for (var i = 0; i < (contacts ? contacts.length : 0); i++) {
				var contact = contacts[i];
				if (contactuuid == contact.uuid) 
					continue;

				array.push(contact);
			}
			
			return this.saveContactList(session, array);
		})
		.then(() => {
			if (callback)
				callback(null, true);
			
			return true;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getContact(session, name, callback) {
		return this.getContactList(session, true)
		.then((contacts) => {
			for (var i = 0; i < (contacts ? contacts.length : 0); i++) {
				var contact = contacts[i];
				if (contact.name == name) {
					return contact;
				}
			}
			
			throw new Error('could not find contact with name: ' + name);
		})
		.then((contact) => {
			if (callback)
				callback(null, contact);
			
			return contact;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getWalletCardsAsContactList(session, wallet, bRefresh, callback) {
		var array = [];

		return wallet.getCardList(bRefresh)
		.then((cardarray) => {
			for (var i = 0; i < (cardarray ? cardarray.length : 0); i++) {
				array.push(this.getWalletCardAsContact(session, wallet, cardarray[i]));
			}
			
			return array;
		})
		.then(() => {
			if (callback)
				callback(null, array);
			
			return array;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getWalletCardAsContact(session, wallet, card) {
		var walletmodule = this;
		
		// TODO: we could check card is indeed in the wallet
		
		var contactjson = {};
		
		contactjson.name = card.getAuthName();
		contactjson.type = this.Contact.WALLET_CARD_CONTACT;
		
		contactjson.uuid = 'wallet.' + wallet.getWalletUUID() + '.card.' + card.getCardUUID();

		contactjson.address = card.getAddress();
		
		contactjson.label = card.getLabel();
		
		var contact = this.Contact.readFromJson(walletmodule, session, contactjson);

		// optional
		var card_public_keys = card.getPublicKeys();
		var rsa_public_key = (card_public_keys ? card_public_keys['rsa_public_key'] : null);
		
		if (rsa_public_key)
			contact.setRsaPublicKey(rsa_public_key);
		
		return contact;
	}
	
	getWalletCardFromContact(session, wallet, contact, callback) {
		if (!contact) {
			if (callback)
				callback('contact is undefined', null);
			
			return Promise.reject('contact is undefined');
		}
		
		if (wallet.isLocked()) {
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}

		
		var contactuuid = contact.getContactUUID();
		
		if (contactuuid.startsWith('wallet.')) {
			var split = contactuuid.split('.')
			var walletuuid = (split && split[1] ? split[1] : null);
			var carduuid = (split && split[3] ? split[3] : null);
			
			if (walletuuid && carduuid) {
				
				// check we are in the right wallet
				if (wallet.getWalletUUID() == walletuuid) {
					var card;
					
					return wallet.getCardFromUUID(carduuid)
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

			}
		}
		
		if (callback)
			callback('ERR_CARD_NOT_FOUND', null);

		return Promise.reject('ERR_CARD_NOT_FOUND');
	}
	
	getContactFromUUID(session, contactuuid, callback) {
		if (!contactuuid) {
			if (callback)
				callback('contact uuid is undefined', null);

			return Promise.reject('contact uuid is undefined');
		}
		
		var contactpromise;
		
		if (contactuuid.startsWith('wallet.')) {
			var split = contactuuid.split('.')
			var walletuuid = (split && split[1] ? split[1] : null);
			var carduuid = (split && split[3] ? split[3] : null);
			
			if (walletuuid && carduuid) {
				var wallet;
				var card;
				
				contactpromise = this.getWalletFromUUID(session, walletuuid)
				.then((wllt) => {
					wallet = wllt;
					
					return wallet.getCardFromUUID(carduuid);
				})
				.then((crd) => {
					card = crd;
					
					return this.getWalletCardAsContact(session, wallet, card);
				});
			}
			else {
				contactpromise = Promise.reject('contact uuid is malformed: ' + contactuuid);
			}
		}
		else {
			contactpromise = this.getContactList(session, true)
			.then((contacts) => {
				for (var i = 0; i < (contacts ? contacts.length : 0); i++) {
					var contact = contacts[i];
					if (contactuuid == contact.uuid) {
						return contact;
					}
				}
				
				throw new Error('could not find contact with uuid ' + contactuuid);
			});
		}
		
		return contactpromise
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
	
	getContactFromEmail(session, email, callback) {
		return this.getContactList(session, true)
		.then((contacts) => {
			for (var i = 0; i < (contacts ? contacts.length : 0); i++) {
				var contact = contacts[i];
				if (contact.email == email) {
					return contact;
				}
			}
			
			throw new Error('could not find contact with email ' + email);
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
	
	getContactFromAddress(session, address, callback) {
		return this.getContactList(session, true)
		.then((contacts) => {
			for (var i = 0; i < (contacts ? contacts.length : 0); i++) {
				var contact = contacts[i];
				if (session.areAddressesEqual(contact.address, address)) {
					return contact;
				}
			}
			
			throw new Error('could not find contact with address ' + address);
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
	
	
	
	//
	// utils
	//
	chained_resolve(arr, createpromisefunc) {
		var res = [];
		
		return arr.reduce( (previousPromise, next) => {
			return previousPromise.then(() => {
				return createpromisefunc(next);
			})
			.then((val) => {
				if (val)
				res.push(val);
				
				return val;
			});
		}, Promise.resolve())
		.then(()=>{
			return res;
		});
		
		/*var res = [];
		
		for (var i = 0; i < arr.length; i++) {
			console.log('starting promise ' + i)
			res[i] = await createpromisefunc(arr[i]);
			console.log('next on promise ' + i)
		}
		
		return res;*/
	}
}


if ( typeof GlobalClass !== 'undefined' && GlobalClass ) {
	GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	GlobalClass.getGlobalObject().registerModuleDepency('wallet', 'common');
	GlobalClass.getGlobalObject().registerModuleDepency('wallet', 'clientmodules');
}
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('wallet', 'common');
	_GlobalClass.getGlobalObject().registerModuleDepency('wallet', 'clientmodules');
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('wallet', 'common');
	_GlobalClass.getGlobalObject().registerModuleDepency('wallet', 'clientmodules');
}
