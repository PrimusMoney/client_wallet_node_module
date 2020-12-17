/**
 * 
 */
'use strict';

var Card = class {
	static get CLIENT_CARD() { return 0;}
	static get REMOTE_CARD() { return 1;}

	constructor(wallet, scheme, authname, address) {
		this.wallet = wallet;
		this.global = this.wallet.module.global;
		
		this.scheme = scheme;
		
		this.label = authname;
		this.uuid = null;
		
		this.authname = authname;
		this.address = address;
		this.password = null;
		
		this.xtra_data = {};
		
		// operations
		this.ethereumnodeaccess = null;
		
		this.locked = true;
		
		this.tokenaccountmap = Object.create(null);
		
		this.tokenaccountlist = [];
		
		this.session = null;
	}
	
	init(callback) {
		return this._createSession()
		.then((session) => {
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
	
	getLocalJson() {
		var json = {};
		
		json.schemeuuid = this.scheme.getSchemeUUID();
		json.authname = this.authname;
		json.address = this.address;
		json.password = this.password;
		
		json.name = (this.name ? this.name : 'no name');
		json.uuid = (this.uuid ? this.uuid : this.getCardUUID());
		json.label = this.label;
		
		json.xtra_data = this.xtra_data;

		return json;
	}
	
	getWallet() {
		return this.wallet;
	}
	
	getWalletUUID() {
		return this.wallet.getWalletUUID();
	}
	
	getScheme() {
		return this.scheme;
	}
	
	getSchemeUUID() {
		return this.scheme.getSchemeUUID();
	}
	
	getAuthName() {
		return this.authname;
	}
	
	getAddress() {
		return this.address;
	}
	
	getPublicKeys() {
		var session = this._getSession();
		
		var publickeys = {address: this.address}

		var sessionaccount = this._getSessionAccountObject();
		
		if (sessionaccount) {
			publickeys['public_key'] = sessionaccount.getPublicKey();
			publickeys['rsa_public_key'] = sessionaccount.getRsaPublicKey();
		}
		
		return publickeys;
	}
	
	getCardUUID() {
		if (this.uuid)
		return this.uuid;
		
		var session = this._getSession();
		
		if (session) {
			this.uuid = session.guid();
			session.CARD = this.uuid;
		}
		
		return this.uuid;
	}
	
	getCardType() {
		var scheme = this.scheme;
		
		if (scheme.isRemote())
			return Card.REMOTE_CARD
		else
			return Card.CLIENT_CARD;
	}

	
	setCardUUID(uuid) {
		this.uuid = uuid;
	}
	
	getLabel() {
		if (this.label)
		return this.label;
		
		return 'unknown';
	}
	
	setLabel(label) {
		this.label = label;
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
	
	_getSession() {
		return this.session;
	}
	
	_getLocalStorageSession() {
		// TODO: remove _getLocalStorageSession
		// we should normally no longer need _getLocalStorageSession
		// since we now impersonate local card session with wallet user (2020.04.10)
		var session;
		
		var cardtype = this.getCardType();
		
		switch(cardtype) {
			case Card.CLIENT_CARD:
				session = this.wallet._getSession();
				break;
				
			case Card.REMOTE_CARD:
				session = this._getSession();
				break;
				
			default:
				throw new Error('card is of a wrong type: ' + cardtype);
		}
		
		return session;
	}
	
	_createSession(callback) {
		var global = this.global;
		
		if ((this.wallet) && (this.uuid)){
			var session = this.wallet.cardsessions[this.uuid];
			
			if (session) {
				this.session = session;
				
				if (callback)
					callback(null, session);
					
				return Promise.resolve(session);
			}
		}
		
		return this.scheme.createSchemeSessionObject((err, session) => {
			this.session = session;
			
			this.session.CARD = this.uuid;
			
			// put in wallet's map to avoid recreating a session for same card uuid
			if (this.wallet) {
				this.wallet.cardsessions[this.uuid] = this.session;
			}
			
			// attach the card session to the wallet session
			// as a child
			var parentsession = this.wallet._getSession();
			
			var clientmodules = global.getModuleObject('clientmodules');
			
			clientmodules.attachChildSessionObject(session, parentsession)
			
			return session;
		})
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
	
	lock(callback) {
		this.locked = true;
		
		if (callback)
			callback(null, true);
		
		return Promise.resolve(true);
	}
	
	unlock(password, callback) {
		var global = this.global;
		var session = this._getSession();
		
		if (!session) {
			if (callback)
				callback('card should be initialized before being unlocked', null);
			
			return Promise.reject('card should be initialized before being unlocked');
		}
		
		if (this.wallet.isLocked()) {
			if (callback)
				callback('ERR_WALLET_LOCKED', null);

			return Promise.reject('ERR_WALLET_LOCKED');
		}

		var unlockpromise;

		if (!session.isAnonymous()) {
			this.locked = false;
			
			unlockpromise = Promise.resolve(true);
		}
		else {
			var cardtype = this.getCardType();
			
			switch(cardtype) {
				case Card.CLIENT_CARD:
					// check that wallet can obtain private key for our address
					var accountaddress = this.address;
					var accountobject = this._getSessionAccountObject();
					
					if (accountobject) {
						unlockpromise = new Promise((resolve, reject) => {
							
							// we impersonate session with wallet's user
							var walletsession = this.wallet._getSession();
							var walletuser = walletsession.getSessionUserObject() 
							
							session.impersonateUser(walletuser);

							// add cryptokeys to session
							var cryptokeys = walletuser.getCryptoKeyObjects();

							for (var i = 0; i < (cryptokeys ? cryptokeys.length : 0); i++) {
								var cryptokey = cryptokeys[i];
								session.addCryptoKeyObject(cryptokey);
							}
							
							this.locked = false;
							
							resolve(true);
						});
					}
					else {
						unlockpromise = Promise.reject('can not retrieve private key for ' + this.address);
					}
					
					break;

				
				case Card.REMOTE_CARD:
					var _password = password;
					
					if (!_password) {
						if (this.password) {
							// we fill with the password we have in memory
							// (that could have been decrypted from vault)
							_password = this.password;
						}
						else if (this.wallet.getWalletType() == 1) {
							_password = this.wallet.password;
						}
					} 
					
					var username = this.authname;
					
					var authkeymodule = global.getModuleObject('authkey');

					if (!authkeymodule.isActivated()) {
						unlockpromise = Promise.reject('authkey module is not activated');
					}
					else {
						// set scheme config first
						var clientmodules = global.getModuleObject('clientmodules');

						var scheme = this.getScheme();
						var remoteschemeconfig = scheme.getNetworkConfig();
						
						unlockpromise = clientmodules.setSessionNetworkConfig(session, remoteschemeconfig)
						.then((sess) => {
							// then authenticate
							return new Promise((resolve, reject) => { 
								authkeymodule._authenticate(session, username, _password, (err, res) => {
									if (err) {reject(err);}	else {resolve(res);	}
								})
								.catch(err => {
									reject(err);
								});
							});
						})
						.then((authenticated) => {
							this.password = _password; // we note the password
							
							this.locked = false;

							return authenticated;
						});
					}
					break;

					
				default:
					unlockpromise = Promise.reject('card has a wrong type: ' + cardtype);
					break;
			}
		}
		
		
		return unlockpromise
		.then(() => {
			return this._onUnlock();
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch((err) => {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			console.log('Error in Card.unlock:' + err);
			throw 'ERR_CARD_LOCKED'
		});
		
	}
	
	_onUnlock() {
		var global = this.global;
		var session = this._getSession();
		
		var cardtype = this.getCardType();
		var unlockpromise;
		
		// we refresh cached information
		return new Promise((resolve, reject) => { 
			// we read session accounts
			session.getSessionAccountObjects(true, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		})
		.then(() => {
			// and ERC20 tokens
			var erc20tokenmodule = global.getModuleObject('erc20');

			return new Promise((resolve, reject) => { 
				erc20tokenmodule.getERC20Tokens(session, true, (err, res) => {
					if (err) reject(err); else resolve(res);
				});
			});
		})
		.then(() => {
			return true;
		});
		
		
	}
	
	isLocked() {
		if (this.wallet.isLocked())
			return true;
		
		var cardtype = this.getCardType();
	
		switch(cardtype) {
			case Card.CLIENT_CARD:
				return this.locked;
				
			case Card.REMOTE_CARD: {
				
				if (this.locked)
				return this.locked;

				// update only every 5s
				var now = Date.now();

				if (this.remotelockchecked && ((now - this.remotelockchecked) < 5000)) {
					return this.locked;
				}

				// check remote
				this.remotelockchecked = now;
				var session = this._getSession();

				if (session.isAnonymous()) {
					this.locked = true;
				}

				return this.locked ;
			}
			
			default:
				return this.locked;
		}
	}
	
	_getEthereumNodeAccess() {
		if (this.ethereumnodeaccess)
			return this.ethereumnodeaccess;
		
		var global = this.global;
		var ethnodemodule = global.getModuleObject('ethnode');
		
		var session = this._getSession();
		
		this.ethereumnodeaccess  = ethnodemodule.getEthereumNodeAccessInstance(session);
		
		return this.ethereumnodeaccess;
	}
	
	_getAccountObject() {
		var global = this.global;
		var session = this._getSession();

		// create account with card address
		var address = this.getAddress();

		var commonmodule = global.getModuleObject('common');
		
		// get account with this address
		var account = session.getAccountObject(address);
		
		return account;
	}
	
	_getSessionAccountObject() {
		var global = this.global;
		var session = this._getLocalStorageSession();
		
		// create account with card address
		var address = this.getAddress();

		var commonmodule = global.getModuleObject('common');
		
		// get account with this address
		var account = session.getSessionAccountObject(address);
		
		return account;
	}
	

	getTransactionCredits(callback) {
		var ethereumnodeaccess = this._getEthereumNodeAccess() 
		
		// create account with this address
		return ethereumnodeaccess.web3_getBalance(this.address)
		.then((balance) => {
			if (callback)
				callback(null, balance);
			
			return balance;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw err;
		});
	}
	
	getTransactionUnits(callback) {
		var scheme = this.scheme;
		
		return this.getTransactionCredits()
		.then((transactioncredits) => {
			var transactionunits = scheme.getTransactionUnits(transactioncredits)
			
			return transactionunits;
		})
		.then((transactionunits) => {
			if (callback)
				callback(null, transactionunits);
			
			return transactionunits;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw err;
		});
	}
	
	topUpCard(callback) {
		var session = this._getSession();
		var scheme = this.scheme;
		
		var address = this.getAddress();

		
		return scheme.sendTopUpRequestAsync(session, address)
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
	
	// tokens
	getTokenList(bRefresh, callback) {
		var global = this.global;
		
		if (this.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
			
		var scheme = this.scheme;
		var schemeconfig = scheme.getNetworkConfig();
		var session = this._getLocalStorageSession();
		
		var Token = global.getModuleClass('wallet', 'Token');
		
		var erc20tokenmodule = global.getModuleObject('erc20');

		return new Promise((resolve, reject) => {
			// we read erc20 contracts from storage
			erc20tokenmodule.getERC20Tokens(session, bRefresh, (err, res) => {
				if (err) {
					reject(err); 
				}
				else {
					var erc20tokenarray = res;
					var tokens = [];
					
					for (var i = 0; i < erc20tokenarray.length; i++) {
						var tokenuuid = erc20tokenarray[i].getUUID();
						var tokenaddress = erc20tokenarray[i].getAddress();
						var web3providerurl = erc20tokenarray[i].getWeb3ProviderUrl();
						
						var tokenname = erc20tokenarray[i].getLocalName();
						var tokendescription = erc20tokenarray[i].getLocalDescription();
						
						if ((schemeconfig.ethnodeserver.activate == true)
								|| (schemeconfig.ethnodeserver.web3_provider_url == web3providerurl)) {
							// only erc20 tokens with web3 provider url matching scheme's one
							// for client schemes
							var token = this.getTokenObject(tokenaddress);
							
							token.setTokenUUID(tokenuuid);
							token.setTokenType(Token.STORAGE_TOKEN);
							
							token.setLabel((tokendescription ? tokendescription : tokenname));
							
							token._setERC20TokenContract(erc20tokenarray[i]);
							
							// check contract status (e.g. to update tokens after sent for deployment)
							token._checkERC20TokenContractStatusAsync(session);
							
							tokens.push(token);
						}

					}
					
					resolve(tokens);
				}
			});
		})		
		.then((tokens) => {
			if (callback)
				callback(null, tokens);
			
			return tokens;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getTokenObject(tokenaddress) {
		var global = this.global;
		var Token = global.getModuleClass('wallet', 'Token');
		
		// TODO: look if we already have a token object for this address
		
		var scheme = this.scheme;
		
		var token = new Token(scheme, tokenaddress);
		
		return token;
	}
	
	saveToken(token, callback) {
		var global = this.global;
		var session = this._getLocalStorageSession();
		
		if (this.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
			
		var Token = global.getModuleClass('wallet', 'Token');

		return Token.saveToken(session, token, callback);
	}
	
	deployToken(tokenname, symbol, totalsupply, decimals, callback) {
		var global = this.global;
		var session = this._getSession();
		
		var scheme = this.scheme;
		
		var Token = global.getModuleClass('wallet', 'Token');

		// fill data array
		var data = [];
		
		data['name'] = tokenname;
		data['symbol'] = symbol;
		data['decimals'] = decimals;
		data['totalsupply'] = totalsupply;
		
		data['description'] = tokenname;
		
		// call module controller
		var commonmodule = global.getModuleObject('common');
		var ethnodemodule = global.getModuleObject('ethnode');
		var erc20tokenmodule = global.getModuleObject('erc20');
		
		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();
		
		// create (local) erc20token for these values
		var erc20token = erc20tokencontrollers.createERC20TokenObject(session, data);
		
		var web3providerurl = scheme.getWeb3ProviderUrl();
		
		if (web3providerurl)
			erc20token.setWeb3ProviderUrl(web3providerurl);
		
		// save erc20token, then deploy
		return new Promise((resolve, reject) => {
			// save
			erc20tokencontrollers.saveERC20TokenObject(session, erc20token, (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(erc20token);
				}
			});
		})
		.then((res) => {
			// deploy
			var payingaccount = this._getSessionAccountObject();
			var gaslimit = scheme.getGasLimit();
			var gasPrice = scheme.getGasPrice();
			
			var password = this.password; // actually we sign on the client, so no real need for any password
			
			// unlock account
			return ethnodemodule.unlockAccount(session, payingaccount, password, 300)
			.then(() => {
				return erc20token.deploy(payingaccount, gaslimit, gasPrice);
			})
			.then(() => {
				// relock account
				ethnodemodule.lockAccount(session, payingaccount);
				
				// and save erc20token
				return new Promise((resolve, reject) => {
					// save
					erc20tokencontrollers.saveERC20TokenObject(session, erc20token, (err, res) => {
						if (err) {
							reject(err);
						}
						else {
							resolve(erc20token);
						}
					});
				});
			})
			.then(() => {
				var tokenaddress = erc20token.getAddress(); // will probably be null, unless transaction is committed before we come here
				var tokenuuid = erc20token.getUUID();
				
				var token = this.getTokenObject(tokenaddress);
				
				token.setTokenUUID(tokenuuid);
				token.setTokenType(Token.STORAGE_TOKEN);
				
				return token;
			});

		})
		.then((token) => {
			if (callback)
				callback(null, token);
			
			return token;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw err;
		});
		
	}
	
	getTokenFromUUID(tokenuuid, callback) {
		return this.getTokenList(true)
		.then((tokenarray) => {
			if (tokenarray) {
				for (var i = 0; i < tokenarray.length; i++) {
					var token = tokenarray[i];
					var tkuuid = token.getTokenUUID();
					
					if ( tkuuid == tokenuuid ) {
						return token;
					}
				}
				
				return Promise.reject('not found', null);
			} 
			else {
				return Promise.reject('could not retrieve token list', null);

			}
		})
		.then((token) => {
			if (callback)
				callback(null, token);
			
			return token;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw err;
		});

	}
	
	getTokenAccountList(bRefresh, callback) {
		var global = this.global;
		
		if (this.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
		
		if ( (!bRefresh) || (bRefresh === false)) {
			if (callback)
				callback(null, this.tokenaccountlist);
			
			return Promise.resolve(this.tokenaccountlist);
		}

		var scheme = this.scheme;
		var wallet = this.wallet;
		//var session = this._getSession();
		
		var walletmodule = global.getModuleObject('wallet');
		
		var Token = global.getModuleClass('wallet', 'Token');

		// get from wallet under 'tokenaccounts-{carduuid}'
		var TokenAccount = global.getModuleClass('wallet', 'TokenAccount');
		var key = 'tokenaccounts-' + this.getCardUUID();

		var tokenaccountsjson = wallet.getValue(key);
		
		var tokenaccountpromises = [];
		var tokenaccounts = [];
		
		// keep current list within closure
		var oldlist = this.tokenaccountlist;
		
		var tokenlist = [];
		
		var _findtokenfromuuid = function (tklist, tkuuid) {
			if (!tkuuid)
				return;
			
			for (var i = 0; i < tklist.length; i++) {
				if (tklist[i].uuid == tkuuid)
					return tklist[i];
			}
		}
		
		// get a refreshed tokenlist
		return this.getTokenList(true)
		.then((list) => {
			if (list)
			tokenlist = list;
			
			return tokenlist;
		})
		.then(() => {
			for (var i = 0; i < (tokenaccountsjson ? tokenaccountsjson.length : 0); i++) {
				var tokenuuid = tokenaccountsjson[i].tokenuuid;
				var tokenaddress = tokenaccountsjson[i].tokenaddress;
				
				var token = _findtokenfromuuid(tokenlist, tokenuuid);
				
				if (!token) {
					// token was not imported from a persisted list
					// or this list has been modified since then
					
					// create a memory object
					token = this.getTokenObject(tokenaddress);
					
					token.setTokenUUID(tokenuuid);
					token.setTokenType(Token.CLIENT_TOKEN);

					var tokenweb3providerurl = tokenaccountsjson[i].tokenweb3providerurl;
					
					token.setWeb3providerUrl(tokenweb3providerurl);
				}
				
				// then instantiate token account
				var tokenaccount = TokenAccount.readFromJson(this, token, tokenaccountsjson[i]);
				
				if (tokenaccount) {
					tokenaccounts.push(tokenaccount);
					
					var tokenaccountpromise = tokenaccount.init()
					.then((res) => {
						return res;
					});
					
					tokenaccountpromises.push(tokenaccountpromise);
				}
				
			}
			
			// return promise for all token accounts once they're initialized
			return Promise.all(tokenaccountpromises)
			.then((arr) => {
				this.tokenaccountlist = tokenaccounts;
				
				return tokenaccounts;
			});
		})
		.then(() => {
			if (callback)
				callback(null, tokenaccounts);
			
			return tokenaccounts;
		})
		.catch((err) => {
			// still want to return an array, even if empty
			if (callback)
				callback(null, tokenaccounts);
			
			return tokenaccounts;
		});

	}
	
	saveTokenAccountList(tokenaccounts, callback) {
		var global = this.global;
		
		if (this.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
			

		var scheme = this.scheme;
		var wallet = this.wallet;
		//var session = this._getSession();
		
		// get json to save
		var tokenaccountsjson = [];
		
		for (var i = 0; i < tokenaccounts.length; i++) {
			var tokenaccountjson = tokenaccounts[i].getLocalJson();
			
			tokenaccountsjson.push(tokenaccountjson);
		}
		
		// put in wallet under 'tokenaccounts-{carduuid}'
		var key = 'tokenaccounts-' + this.getCardUUID();

		return wallet.putValue(key, tokenaccountsjson)
		.then(() => {
			this.tokenaccountlist = tokenaccounts;
			
			if (callback)
				callback(null, tokenaccounts);
			
			return tokenaccounts;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}
	
	_updateTokenAccount(tokenaccount, refreshlist, callback) {
		if (this.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
			
		// we do an non-atomic save

		// save tokenaccount by adding it to list and saving list
		return this.getTokenAccountList(refreshlist)
		.then((tokenaccountarray) => {

			if (tokenaccountarray) {
				// check if it is in the list
				var bInList = false;
				
				for (var i = 0; i < tokenaccountarray.length; i++) {
					
					if (tokenaccount.getTokenAccountUUID() == tokenaccountarray[i].getTokenAccountUUID()) {
						bInList = true;
						tokenaccountarray[i] = tokenaccount;
						break;
					}
				}
				
				// add it if it is not
				if (!bInList)
				tokenaccountarray.push(tokenaccount);
			
				return this.saveTokenAccountList(tokenaccountarray);
			}
			else {
				return Promise.reject('could not retrieve the list of token accounts');
			}
		})
		.then(() => {
			if (callback)
				callback(null, tokenaccount);
			
			return tokenaccount;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}
	
	_saveTokenAccount(tokenaccount, callback) {
		return this._updateTokenAccount(tokenaccount, true, callback);
	}
	
	
	importTokenAccounts(callback) {
		var global = this.global;
		
		if (this.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
		
		var walletmodule = global.getModuleObject('wallet');
		var card = this;
		var cardscheme = card.getScheme();
		var schemeweb3providerurl = cardscheme.getWeb3ProviderUrl()
		
		return card.getTokenList(true)
		.then((tokenarray) => {
			if (tokenarray) {
				// need to use chained_resolve because of concurrency on token list
				// while waiting for using directly aync/await inside for loop
				var _createtokenaccountpromisefunc = (tkn) => {
					var tknaddress = tkn.getAddress();
					var web3providerurl = tkn.getWeb3ProviderUrl();
					
					// import only token compatible with card's scheme
					return cardscheme.canHandleWeb3ProviderUrl(web3providerurl)
					.then((canhandle) => {
						if (canhandle) {
							return card.getTokenAccountFromAddress(tknaddress)
							.catch(err => {
								return card.createTokenAccount(tkn);
							});
						}
						else {
							// drop this token
							return null;
						}
					})
					.catch(err => {
						console.log('error checking scheme can handle web3 provider url: ' + err);
						return null;
					});
					
				};
				
				// keep only tokens with an address (excludes tokens local to the remote server)
				var tkarray = [];
				
				for (var i = 0; i < tokenarray.length; i++) {
					var islocalonly = tokenarray[i].isLocalOnly();
					if (islocalonly === false)
						tkarray.push(tokenarray[i]);
				}
				
				return walletmodule.chained_resolve(tkarray, _createtokenaccountpromisefunc);
			}
			else {
				return Promise.resolve([]);
			}
		})
		.then(() => {
			if (callback)
				callback(null, card.tokenaccountlist);
			
			return card.tokenaccountlist;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

		
	}

	
	importTokenAccount(tokenuuid, callback) {
		if (this.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
			
		if (this.wallet.isLocked()) {
			if (callback)
				callback('ERR_WALLET_LOCKED', null);

			return Promise.reject('ERR_WALLET_LOCKED');
		}

		var global = this.global;
		var session = this._getLocalStorageSession();
		var tokenaccount;

		return this.getTokenFromUUID(tokenuuid)
		.then((token) => {
			var tokenaddress = token.getAddress();
			
			// look to see if we have already a token account
			// for this address in our card
			return this.getTokenAccountFromAddress(tokenaddress)
			.catch(err => {
				// if none, we create one
				return this.createTokenAccount(token);
			})
		})
		.then((tknaccnt) => {
			tokenaccount = tknaccnt;
			
			// retrieve on-chain values and save them
			return tokenaccount._synchronizeWithERC20TokenContract(session);
		})
		.then(() => {
			if (callback)
				callback(null, tokenaccount);
			
			return tokenaccount;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}

	
	createTokenAccount(token, callback) {
		var tokenaddress = token.getAddress();
		var tokenuuid = token.getTokenUUID();
		var key = (tokenaddress ? tokenaddress : tokenuuid).toLowerCase();
		
		var tokenaccount = this.tokenaccountmap[key];
		
		if (!tokenaccount) {
			var global = this.global;
			var TokenAccount = global.getModuleClass('wallet', 'TokenAccount');
			
			tokenaccount = new TokenAccount(this, token);
			
			this.tokenaccountmap[key] = tokenaccount;
		}
		
		return tokenaccount.init()
		.then((init) => {
			// save token account
			return tokenaccount.save();
		})
		.then(() => {
			if (callback)
				callback(null, tokenaccount);
			
			return tokenaccount;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
		
	}
	
	modifyTokenAccount(tokenaccountuuid, tokenaccountinfo, callback) {
		var global = this.global;
		var tokenaccount;
		
		return this.getTokenAccountFromUUID(tokenaccountuuid)
		.then((tknacc) => {
			tokenaccount = tknacc;
			
			tokenaccount.setLabel(tokenaccountinfo.label);
			
			if (tokenaccountinfo.xtra_data)
				tokenaccount.putXtraData(null, tokenaccountinfo.xtra_data);
			
			return tokenaccount.save();
		})
		.then(() => {
			if (callback)
				callback(null, tokenaccount);
			
			return tokenaccount;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}

	
	getTokenAccountFromUUID(tokenaccountuuid, callback) {
		return this.getTokenAccountList(true)
		.then((tokenaccountarray) => {
			if (tokenaccountarray) {
				for (var i = 0; i < tokenaccountarray.length; i++) {
					var tokenaccount = tokenaccountarray[i];
					var tkuuid = tokenaccount.getTokenAccountUUID();
					
					if ( tkuuid == tokenaccountuuid ) {
						return tokenaccount;
					}
				}
				
				return Promise.reject('not found', null);
			} 
			else {
				return Promise.reject('could not retrieve token account list', null);

			}
		})
		.then((tokenaccount) => {
			if (callback)
				callback(null, tokenaccount);
			
			return tokenaccount;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error('ERR_TOKEN_ACCOUNT_NOT_FOUND');
		});

	}
	
	getTokenAccountFromAddress(tokenaddress, callback) {
		// we do not handle collision of tokens with the same address
		// that would be on different web3url (supposedly extremely
		// unlikely to happen if web3url are on different chains)
		var global = this.global;
		var session = this._getSession();

		return this.getTokenAccountList(true)
		.then((tokenaccountarray) => {
			if (tokenaccountarray) {
				for (var i = 0; i < tokenaccountarray.length; i++) {
					var tokenaccount = tokenaccountarray[i];
					var tkaddress = tokenaccount.getTokenAddress();
					
					if ( session.areAddressesEqual(tkaddress, tokenaddress)) {
						return tokenaccount;
					}
				}
				
				return Promise.reject('not found', null);
			} 
			else {
				return Promise.reject('could not retrieve token account list', null);

			}
		})
		.then((tokenaccount) => {
			if (callback)
				callback(null, tokenaccount);
			
			return tokenaccount;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error('ERR_TOKEN_ACCOUNT_NOT_FOUND');
		});

	}
	
	save(callback) {
		var wallet = this.getWallet();
		
		return wallet._saveCard(this, callback);
	}
	
	// static methods
	static readFromJson(wallet, scheme, cardjson) {
		var walletmodule = wallet.module;
		var Card = walletmodule.Card;

		var authname = cardjson.authname;
		var address = cardjson.address;
		var password = cardjson.password;
		
		var card = new Card(wallet, scheme, authname, address);
		
		card.password = password;
		
		card.uuid = cardjson.uuid;
		card.label = cardjson.label;
		
		card.xtra_data = (cardjson.xtra_data ? cardjson.xtra_data : {});
		
		return card;
	}

	
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('wallet', 'Card', Card);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Card', Card);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Card', Card);
}