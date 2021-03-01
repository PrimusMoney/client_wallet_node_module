/**
 * 
 */
'use strict';

var Wallet = class {
	static get CLIENT_WALLET() { return 0;}
	static get REMOTE_WALLET() { return 1;}

	constructor(module, session, authname, type) {
		this.module = module;
		this.global = module.global;
		
		this.parentsession = session;
		
		this.wallettype = type;

		this.authname = authname;
		this.password = null;
		
		this.uuid = null;
		this.label = null;
		
		this.ownername = null;
		this.owneremail = null;
		
		this.schemeuuid = null;
		
		this.xtra_data = {};
		
		// operations
		this.locked = true;
		this.walletsession = null;
		
		this.cardmap = Object.create(null);
		
		this.cardlist = [];
		this.cardsessions = Object.create(null);
		
		
		this.transactions = [];

		
		this.valuemap = Object.create(null);
	}
	
	_transfer(wallet) {
		this.locked = wallet.locked;
		this.walletsession = wallet.walletsession;
		
		this.cardmap = wallet.cardmap;
		
		this.cardlist = wallet.cardlist;
		this.cardsessions = wallet.cardsessions;
		
		this.valuemap = wallet.valuemap;
	}
	
	getLocalJson() {
		var json = {};
		
		json.uuid = (this.uuid ? this.uuid : this.getWalletUUID());
		json.label = this.label;
		
		json.ownername = this.ownername;
		json.owneremail = this.owneremail;
		
		json.schemeuuid = this.schemeuuid;
		
		json.authname = this.authname;
		json.type = this.wallettype;
		
		json.xtra_data = this.xtra_data;

		return json;
	}
	
	getWalletUUID() {
		if (this.uuid)
		return this.uuid;
		
		var session = this._getSession();
		
		if (session)
		this.uuid = session.guid();
		
		return this.uuid;
	}
	
	setWalletUUID(uuid) {
		this.uuid = uuid;
	}
	
	getSchemeUUID() {
		return this.schemeuuid;
	}
	
	getScheme(callback) {
		var global = this.global;
		var session = this._getSession();

		var walletmodule = this.module;
		
		return walletmodule.getSchemeFromUUID(session, this.schemeuuid)
	}
	
	setSchemeUUID(schemeuuid) {
		this.schemeuuid = schemeuuid;
	}
	
	getLabel() {
		if (this.label)
		return this.label;
		
		return this.authname;
	}
	
	setLabel(label) {
		this.label = label;
	}
	
	getName() {
		switch(this.wallettype) {
			case Wallet.CLIENT_WALLET:
				return this.getLabel();
			case Wallet.REMOTE_WALLET:
				return this.authname;
			default:
				return this.authname;
		}
	}
	
	getAuthName() {
		return this.authname;
	}
	
	_getVaultName() {
		// replace - by _ in wallet uuid
		var walletuuid = this.getWalletUUID();
		
		return Wallet._getSafeVaultNameFromUUID(walletuuid);
	}
	
	getWalletType() {
		return this.wallettype;
	}
	
	getOwnerName() {
		return this.ownername;
	}
	
	setOwnerName(ownername) {
		this.ownername = ownername;
	}
	
	getOwnerEmail() {
		return this.owneremail;
	}
	
	setOwnerEmail(owneremail) {
		this.owneremail = owneremail;
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
		if (this.walletsession)
			return this.walletsession;
		
		var global = this.global;
		var clientmodules = global.getModuleObject('clientmodules');
		
		this.walletsession = clientmodules.createBlankSessionObject(this.parentsession);
		
		this.walletsession.WALLET = this.uuid;
		
		return this.walletsession;
	}
	
	lock(callback) {
		this.locked = true;
		
		if (callback)
			callback(null, true);
		
		return Promise.resolve(true);
	}
	
	unlock(password, callback) {
		var username = this.authname;
		this.password = password;
		
		var global = this.global;
		var session = this._getSession();
		
		var walletmodule = this.module;
		
		switch(this.wallettype) {
			case Wallet.CLIENT_WALLET:
				var vault;
				var vaultname = this._getVaultName();
				var vaultype = 0;
				
				var commonmodule = global.getModuleObject('common');
				var clientmodules = global.getModuleObject('clientmodules');
				var walletmodule = this.module;
				
				var localschemeconfig = walletmodule.getDefaultSchemeConfig(0);
				
				var unlockpromise = clientmodules.setSessionNetworkConfig(session, localschemeconfig)
				.then(() => {
					return new Promise((resolve, reject) => {
						try {
							commonmodule.openVault(session, vaultname, password, vaultype, (err, res) => {
								if (err) {
									reject('ERR_WALLET_LOCKED');
								} 
								else {
									this.locked = false;
									
									resolve(res);
								}
							});
						}
						catch(e) {
							console.log('exception in promise Wallet.unlock: ' + e);
							reject('ERR_WALLET_LOCKED');
						}

					});
					
				})
				.then((vlt) => {
					vault = vlt;
					
					return clientmodules.impersonateVaultAsync(session, vault);
				})
				.then((impersonated) => {
					return this._onUnlock();
				});
				break;

			case Wallet.REMOTE_WALLET:
				// authentication
				var clientmodules = global.getModuleObject('clientmodules');

				// set scheme config first
				var unlockpromise = walletmodule.getSchemeFromUUID(session, this.schemeuuid)
				.then((scheme) => {
					var remoteschemeconfig = scheme.getNetworkConfig();
					
					return clientmodules.setSessionNetworkConfig(session, remoteschemeconfig);
				})
				.then((sess) => {
					// then authenticate
					return clientmodules.authenticate(session, username, password);
				})
				.then((authenticated) => {
					this.password = password; // keep password in memory for wallet's cards
					
					this.locked = false;
					
					return this.locked;
				})
				.then(() => {
					return this._onUnlock();
				});
				break;
				
			default:
				var unlockpromise = Promise.reject('wrong wallet type: ' + this.wallettype);
				break;
		}
		
		
		return unlockpromise
		.then((init) => {
			if (callback)
				callback(null, true);

			return true;
		})
		.catch((err) => {
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			throw 'ERR_WALLET_LOCKED'
		})
	}
	
	_onUnlock() {
		var global = this.global;
		var session = this._getSession();

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
			// fill value map if we are a remote wallet
			var fillvaluemappromise;
			
			switch(this.wallettype) {
				case Wallet.CLIENT_WALLET:
					fillvaluemappromise = Promise.resolve(this.valuemap);
					break;
				case Wallet.REMOTE_WALLET:
					fillvaluemappromise = new Promise((resolve, reject) => {
						var vaultname = this._getVaultName();
						var keys = ['common', 'wallets', vaultname, 'values'];
						
						var localStorage = session.getLocalStorageObject();
						localStorage.readLocalJson(keys, true, (err, res) => {
							// we must check if calls does not return an empty object
							// (which can be the case when localStorage is overloaded)
							if (res) {
								resolve(res);
							}
							else {
								console.log('error in reading remote wallet values: ' + this.authname, null);
								
								resolve({});
							}
						});
						
					})
					.then((value) => {
						var json = value;
						
						this.valuemap = Object.create(null);
						
						for (var key in json) {
							if (json.hasOwnProperty(key)) {
								this.valuemap[key] = json[key];
							}
						}
					});
					break;
					
				default:
					fillvaluemappromise = Promise.resolve(this.valuemap);
					break;
			}
			
			return fillvaluemappromise;
		})
		.then(() => {
			return true;
		});
		
		
	}
	
	checkLock(callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}

		return true;
	}

	isLocked() {
		switch(this.wallettype) {
			case Wallet.CLIENT_WALLET:
				return this.locked; // no time out
			case Wallet.REMOTE_WALLET:{
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
	
	// values saved in vault
	getValue(key) {
		if (this.isLocked()) {
			throw new Error('ERR_WALLET_LOCKED');
		}

		var global = this.global;
		var session = this._getSession();
		
		
		switch(this.wallettype) {
			case Wallet.CLIENT_WALLET:
				// read from vault
				var vaultname = this._getVaultName();
				var vaulttype = 0;
				
				var commonmodule = global.getModuleObject('common');
				
				return commonmodule.getFromVault(session, vaultname, vaulttype, key);
				
			case Wallet.REMOTE_WALLET:
				// read from internal memory cache
				return this.valuemap[key];
				
			default:
				throw new Error('wrong wallet type: ' + this.wallettype);
		}
	}
	
	putValue(key, value, callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}

		var global = this.global;
		var session = this._getSession();
		
		switch(this.wallettype) {
			case Wallet.CLIENT_WALLET:
				var vaultname = this._getVaultName();
				var vaulttype = 0;
				
				var commonmodule = global.getModuleObject('common');
				
				var putpromise = new Promise((resolve, reject) => { 
					commonmodule.putInVault(session, vaultname, vaulttype, key, value, (err, res) => {
						if (err) reject(err); else resolve(res);
					});
				});
				break;
				
			case Wallet.REMOTE_WALLET:
				this.valuemap[key] = value;
				
				// save memory cache
				var putpromise = new Promise((resolve, reject) => { 
					var localStorage = session.getLocalStorageObject();
					var vaultname = this._getVaultName();
					var keys = ['common', 'wallets', vaultname, 'values'];
					
					localStorage.saveLocalJson(keys, this.valuemap, (err, res) => {
						if (err) reject(err); else resolve(res);
					});
				});
				break;

				
			default:
				var putpromise = Promise.reject('wrong wallet type: ' + this.wallettype);
				break;
		}
		
		return putpromise
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
	
	
	// cards
	getCardList(bRefresh, callback) {
		var global = this.global;
		var session = this._getSession();
		var walletmodule = this.module;
		
		var cardpromises = [];
		var cards = [];
		
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		if ( (!bRefresh) || (bRefresh === false)) {
			if (callback)
				callback(null, this.cardlist);
			
			return Promise.resolve(this.cardlist);
		}
		
		var commonmodule = global.getModuleObject('common');
		var walletmodule = this.module;
		var cardarray;
		
		// keep current list within closure
		var oldlist = this.cardlist;
		
		// get list of cards
		var Card = global.getModuleClass('wallet', 'Card');
		var key = 'cards';

		cardarray = this.getValue(key);

		
		for (var i = 0; i < (cardarray ? cardarray.length : 0); i++) {
			// need a closure to stack cardjson
			var _funcpromise = (cardjson) => {
				return walletmodule.getSchemeFromUUID(session, cardjson.schemeuuid)
				.then((scheme) => {
					return Card.readFromJson(this, scheme, cardjson);
				})
				.then((card) => {
					if (card) {
						return card.init() // create and set session object
						.then((res) => {
							if (res)  {
								//return card.unlock(null); // promise, password in card's memory after read
								return true;
							}
						})
						.then((unlocked) => {
							if (unlocked)
							cards.push(card);
						});
					}
				})
				.catch((err) => {
					console.log('error: ' + err)
				});
			};
			
			// create promise
			var cardpromise = _funcpromise(cardarray[i]);
			
			cardpromises.push(cardpromise);
		}
		
		// return promise for all cards once they're open
		return Promise.all(cardpromises)
		.then((arr) => {
			this.cardlist = cards;
			
			return cards;
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch((err) => {
			if (callback)
				callback(null, cards);
			
			return cards;
		});
		
	}
	
	saveCardList(cards, callback) {
		var global = this.global;
		var session = this._getSession();
		var walletmodule = this.module;
		
		// get json to save
		var cardsjson = [];
		
		for (var i = 0; i < cards.length; i++) {
			var cardjson = cards[i].getLocalJson();
			
			cardsjson.push(cardjson);
		}
		
		// put in vault under 'cards'
		var key = 'cards';
		
		return this.putValue(key, cardsjson)
		.then((arr) => {
			this.cardlist = cards;
			
			return cards;
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getCardFromAuthName(scheme, cardauthname, callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		var schemeuuid = scheme.getSchemeUUID();

		return this.getCardList(true)
		.then((cardarray) => {
			if (cardarray) {
				for (var i = 0; i < cardarray.length; i++) {
					var card = cardarray[i];
					var authname = card.getAuthName();
					var schmuuid = card.getScheme().getSchemeUUID();
					
					if ( (authname == cardauthname) && (schmuuid == schemeuuid) ) {
						return card;
					}
				}
				
				return Promise.reject('ERR_CARD_NOT_FOUND');
			} 
			else {
				return Promise.reject('could not retrieve the list of cards');
			}
		})
		.then((card) => {
			if (callback)
				callback(null, card);
			
			return card;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getCardFromUUID(carduuid, callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		return this.getCardList(true)
		.then((cardarray) => {
			if (cardarray) {
				for (var i = 0; i < cardarray.length; i++) {
					var card = cardarray[i];
					var crduuid = card.getCardUUID();
					
					if ( crduuid == carduuid ) {
						return card;
					}
				}
				
				return Promise.reject('ERR_CARD_NOT_FOUND');
			} 
			else {
				return Promise.reject('could not retrieve the list of cards');
			}
		})
		.then((card) => {
			if (callback)
				callback(null, card);
			
			return card;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}
	
	getCardsOnSameScheme(card, callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		var global = this.global;
		var session = this._getSession();
		
		var array = [];

		return this.getCardList(true)
		.then((cardarray) => {
			if (cardarray) {
				var cardschemeuuid = card.getScheme().getSchemeUUID();
				;
				for (var i = 0; i < cardarray.length; i++) {
					var _schemeuuid = cardarray[i].getScheme().getSchemeUUID();
					
					if ( _schemeuuid == cardschemeuuid) {
						array.push(cardarray[i]);
					}
				}
			}
			else {
				return Promise.reject('could not retrieve the list of cards');
			}
		})
		.then(() => {
			if (callback)
				callback(null, array);
			
			return array;
		})
		.catch((err) => {
			if (callback)
				callback(null, []);
			
			return [];
		});
	}
	
	getCardsWithAddress(address, callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		var global = this.global;
		var session = this._getSession();
		
		var array = [];

		return this.getCardList(true)
		.then((cardarray) => {
			if (cardarray) {
				for (var i = 0; i < cardarray.length; i++) {
					var card = cardarray[i];
					var _addrss = card.getAddress();
					
					if ( session.areAddressesEqual(_addrss, address) ) {
						array.push(card);
					}
				}
			}
			else {
				return Promise.reject('could not retrieve the list of cards');
			}
		})
		.then(() => {
			if (callback)
				callback(null, array);
			
			return array;
		})
		.catch((err) => {
			if (callback)
				callback(null, []);
			
			return [];
		});

	}
	
	getCardFromAddressOnScheme(address, scheme, callback) {
		var schemeuuid = scheme.getSchemeUUID();

		return this.getCardsWithAddress(address).
		then((cardarray) => {
			for (var i = 0; i < (cardarray ? cardarray.length : 0); i++) {
				var cardschemeuuid = cardarray[i].getSchemeUUID();
				
				if (cardschemeuuid == schemeuuid) {
					return cardarray[i];
				}
			}
			
			throw new Error('ERR_CARD_NOT_FOUND');
		});
	}

	
	getFirstCardWithAddress(address, callback) {
		// this returns first card with address if there are several
		// getCardFromUUID should be used if a specific card is looked for
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		var global = this.global;
		var session = this._getSession();

		return this.getCardList(true)
		.then((cardarray) => {
			if (cardarray) {
				for (var i = 0; i < cardarray.length; i++) {
					var card = cardarray[i];
					var _addrss = card.getAddress();
					
					if ( session.areAddressesEqual(_addrss, address) ) {
						return card;
					}
				}
				
				return Promise.reject('ERR_CARD_NOT_FOUND');
			} 
			else {
				return Promise.reject('could not retrieve the list of cards');
			}
		})
		.then((card) => {
			if (callback)
				callback(null, card);
			
			return card;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});

	}
	
	_createClientAccountObject(privkey, bSave) {
		var global = this.global;
		var session = this._getSession();
		var sessionuser = session.getSessionUserObject();
		
		var commonmodule = global.getModuleObject('common');
		
		// create account with this private key
		var account = commonmodule.createBlankAccountObject(session);
		
		account.setPrivateKey(privkey);
		
		if (sessionuser) {
			account.setOwner(sessionuser);
		}
		
		// add to session or would need to do a getAccountObjects(bForceRefresh = true)
		session.addAccountObject(account);
		
		if (bSave === true) {
			var storagemodule = global.getModuleObject('storage-access');
			var storageaccess = storagemodule.getStorageAccessInstance(session);
			
			if (!sessionuser) {
				return Promise.reject('wallet session need to be impersonated to save session account');
			}

			return new Promise((resolve, reject) => {
				// we force a refresh of the list of accounts
				// to be sure that the cache used in user_add_account
				// is up to date
				var keys = ['common', 'accounts'];
				var _localstorage = session.getLocalStorageObject();
				
				_localstorage.readLocalJson(keys, true, (err, res) => {
					if (err) reject(err); else resolve(res);
				});
			})
			.then(() => {
				return new Promise((resolve, reject) => {
					storageaccess.user_add_account(sessionuser, account, (err, res) => {
						if (err) reject(err); else resolve(account);
					})
					.catch(err => {
						reject(err);
					});
				})
			});
		}
		
		return Promise.resolve(account);
		
	}

	
	_generateClientAccountObject(bSave) {
		var global = this.global;
		var session = this._getSession();
		var sessionuser = session.getSessionUserObject();
		
		// generate key
		var privkey = session.generatePrivateKey();

		//then create session account object from key
		return this._createClientAccountObject(privkey, bSave);
	}
	
	_checkCardFromAddress(card, scheme) {
		// check card is on same scheme
		var _card = card;
		
		return new Promise((resolve, reject) => {
			var cardschemeuuid = _card.getSchemeUUID();
			var schemeuuid = scheme.getSchemeUUID();
			
			if (cardschemeuuid == schemeuuid)
				resolve(true);
			else {
				// we look if other cards have same address
				// and one is on correct scheme
				var cardaddress = card.getAddress();
				
				return this.getCardsWithAddress(cardaddress)
				.then((cardlist) => {
					for (var i = 0; i < (cardlist ? cardlist.length : 0); i++) {
						var cardschemeuuid = cardlist[i].getSchemeUUID();
						
						if (cardschemeuuid == schemeuuid) {
							_card = cardlist[i];
							resolve(true);
						}
					}
					
					reject('could not find card compatible with scheme ' + schemeuuid)
				});
				
			}
				
		})
		.then(() => {
			// unlock this card to make it operable
			return _card.unlock();
		})
		.then(() => {
			return _card;
		});
	}
	
	importCard(address, configurl, authname, password, options, callback) {
		var global = this.global;
		var session = this._getSession();
		var walletmodule = this.module;
		
		
		switch(this.wallettype) {
			case Wallet.CLIENT_WALLET: {
				if (!configurl)
					throw new Error('you need to provide a url to import a card in a client wallet');
				
				if (!authname) {
					// client card
					var creationpromise = this.getSessionAccountObjects(true)
					.then((sessionaccounts) => {
						var sessionaccount;
						
						for (var i = 0; i < sessionaccounts.length; i++) {
							var accountaddress = sessionaccounts[i].getAddress();
							
							if (session.areAddressesEqual(accountaddress, address)) {
								sessionaccount = sessionaccounts[i];
								return sessionaccount;
							}
						}
						
						if (!sessionaccount)
						throw new Error('you need to provide an address corresponding to a session account');
					})
					.then((sessionaccount) => {
						if (configurl.startsWith('storage://')) {
							var schemeuuid = configurl.substring(configurl.indexOf("=") + 1);
							
							return walletmodule.getSchemeFromUUID(session, schemeuuid);
						}
						else {
							return walletmodule.importScheme(session, configurl);
						}
					})
					.then((scheme) => {
						if (scheme) {
							// look to see if we have already a card with this address
							return this.getFirstCardWithAddress(address)
							.then((card) => {
								return this._checkCardFromAddress(card, scheme);
							})
							.catch(err => {
								// if not, we create one
								return this.createCard(scheme, null, null, address);
							});
						}
						else
							throw new Error('could not import scheme');
					});
					
				}
				else {
					// remote card
					var scheme;

					var creationpromise = walletmodule.importScheme(session, configurl)
					.then((schm) => {
						// note scheme object
						scheme = schm;
						
						// look to see if we have already a card with this address
						return this.getFirstCardWithAddress(address)
						.then((card) => {
							return this._checkCardFromAddress(card, scheme);
						})
						.catch(err => {
							// if not, we create one
							return this.createCard(scheme, authname, password, address);
						});
					})
					.then((card) => {
						if (options && (options.notokenimport === true)) {
							return card;
						}
						else {
							// import tokens
							return card.importTokenAccounts()
							.then(() => {
								return card;
							})
							.catch(err => {
								return card;
							});
						}

					});

				}
				
				
			}
			break;
				
			case Wallet.REMOTE_WALLET: {
				if (!authname) {
					// client card
					var creationpromise = this.getSessionAccountObjects(true)
					.then((sessionaccounts) => {
						var sessionaccount;
						
						for (var i = 0; i < sessionaccounts.length; i++) {
							var accountaddress = sessionaccounts[i].getAddress();
							
							if (session.areAddressesEqual(accountaddress, address)) {
								sessionaccount = sessionaccounts[i];
								return sessionaccount;
							}
						}
						
						if (!sessionaccount)
						throw new Error('you need to provide an address corresponding to a session account');
					})
					.then((sessionaccount) => {
						if (configurl.startsWith('storage://')) {
							var schemeuuid = configurl.substring(configurl.indexOf("=") + 1);
							
							return walletmodule.getSchemeFromUUID(session, schemeuuid);
						}
						else {
							return walletmodule.importScheme(session, configurl);
						}
					})
					.then((scheme) => {
						if (scheme) {
							// look to see if we have already a card with this address
							return this.getFirstCardWithAddress(address)
							.then((card) => {
								return this._checkCardFromAddress(card, scheme);
							})
							.catch(err => {
								// if not, we create one
								return this.createCard(scheme, null, null, address);
							});
						}
						else
							throw new Error('could not import scheme');
					});
				}
				else {
					// cards based on personal accounts
					// registered within the remote user account
					var scheme;

					// retrieve network config
					var creationpromise = walletmodule.getSchemeFromUUID(session, this.schemeuuid)
					.then((schm) => {
						// note scheme object
						scheme = schm;
						
						// look to see if we have already a card with this address
						return this.getFirstCardWithAddress(address)
						.then((card) => {
							return this._checkCardFromAddress(card, scheme);
						})
						.catch(err => {
							// if not, we create one
							return this.createCard(scheme, authname, password, address);
						});
					})
					.then((card) => {
						if (options && (options.notokenimport === true)) {
							return card;
						}
						else {
							// import tokens
							return card.importTokenAccounts()
							.then(() => {
								return card;
							})
							.catch(err => {
								return card;
							});
						}


					});
				}


			}
			break;
				
				
			default:
				var creationpromise = Promise.reject('wrong wallet type: ' + this.wallettype);
		}


		return creationpromise
		.then((card) => {
			if (callback)
				callback(null, card);
			
			return card;
		})
		.catch((err) => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	createCard(scheme, authname, password, address, callback) {
		var global = this.global;
		var session = this._getSession();
		
		
		var Card = global.getModuleClass('wallet', 'Card');
		
		var card;
		
		
		var commonmodule = global.getModuleObject('common');

		var walletaccount;
		var pushcardaccount = false;
		
		var accountpromise;
		var _password;
		
		switch(this.wallettype) {
			case Wallet.CLIENT_WALLET:
				if (address) {
					var key = (scheme.uuid + '-' + authname + '-' + address).toLowerCase();
					
					if (this.cardmap[key])
						return Promise.resolve(this.cardmap[key]);

					accountpromise = this.getAccountObject(address);
				}
				else {
					var schemetype = scheme.getSchemeType();
					

					if (schemetype == 1) {
						//accountpromise = Promise.reject('creating a card for a remote scheme requires to provide the corresponding account address');

						// we generate a private key
						var privkey = session.generatePrivateKey();
						
						// create a memory account
						accountpromise = new Promise((resolve, reject) => {
							var account = commonmodule.createBlankAccountObject(session);
							
							account.setPrivateKey(privkey);
							
							resolve(account);
						});
						// that will be saved in the remote account below once card is unlocked
						pushcardaccount = true;
					}
					else {
						// we generate an account in the local wallet
						accountpromise = this._generateClientAccountObject(true);
					}
				}
				
				if (password) {
					_password = password
				}
				else {
					if (scheme.isRemote())
						accountpromise = Promise.reject('creating a card for a remote scheme requires to provide the corresponding password');
				}
				break;
				
			case Wallet.REMOTE_WALLET:
				if (address) {
					var key = (scheme.uuid + '-' + authname + '-' + address).toLowerCase();
					
					if (this.cardmap[key])
						return Promise.resolve(this.cardmap[key]);

					accountpromise = this.getAccountObject(address);
				}
				else {
					accountpromise = Promise.reject('creating a card for a remote scheme requires to provide the corresponding account address');
				}
				break;
				
				
			default:
				accountpromise = Promise.reject('wrong wallet type: ' + this.wallettype);
		}

		

		return accountpromise
		.then((account) => {
			walletaccount = account;
			
			var _address = walletaccount.getAddress();
			var key = (scheme.uuid + '-' + authname + '-' + _address).toLowerCase();
			
			card = new Card(this, scheme, authname, _address);
			
			this.cardmap[key] = card;
			
			return card;
		})
		.then((crd) => {
			// create scheme session
			// TODO: look if we should not call card.init instead
			return card._createSession();
		})
		.then((sess) => {
			// unlock card
			return card.unlock(password);
		})
		.then((unlocked) => {
			if (pushcardaccount) {
				var cardsession = card._getSession();
				var cardsessionuser = cardsession.getSessionUserObject();
				
				// we create an account in the card session
				var cardaccount = commonmodule.createBlankAccountObject(cardsession);
				
				cardaccount.setPrivateKey(walletaccount.getPrivateKey());
				cardaccount.setDescription(authname);
				
				// and add the account to cardsession's localstorage (remote call)
				if (cardsessionuser) {
					cardaccount.setOwner(cardsessionuser);
				}
				
				// add to session or would need to do a getAccountObjects(bForceRefresh = true)
				cardsession.addAccountObject(cardaccount);
				
				var storagemodule = global.getModuleObject('storage-access');
				var storageaccess = storagemodule.getStorageAccessInstance(cardsession);

				return new Promise((resolve, reject) => {
					// we force a refresh of the list of accounts
					// to be sure that the cache used in user_add_account
					// is up to date
					var keys = ['common', 'accounts'];
					var _localstorage = cardsession.getLocalStorageObject();
					
					_localstorage.readLocalJson(keys, true, (err, res) => {
						if (err) reject(err); else resolve(res);
					});
				})
				.then(() => {
					return new Promise((resolve, reject) => {
						storageaccess.user_add_account(cardsessionuser, cardaccount, (err, res) => {
							if (err) reject(err); else resolve(cardaccount);
						})
						.catch(err => {
							reject(err);
						});
					})
				});
			}
			else {
				// nothing to do
				return true;
			}
			
		})
		.then(() => {
			// save card
			return card.save();
		})
		.then(() => {
			if (callback)
				callback(null, card);
			
			return card;
		})
		.catch(err =>{
			if (callback)
				callback(err, null);
			
			throw err;
		});
	}
	
	createCardFromPrivatekey(scheme, privatekey, callback) {
		var global = this.global;
		var session = this._getSession();
		var walletmodule = this.module;
		
		var scheme;
		var authname;
		var password;
		var address;
		var card;

		// create session account from the privatekey
		return this._createClientAccountObject(privatekey, true)
		.then((sessionaccount) => {
			authname = sessionaccount.getAddress();
			address = sessionaccount.getAddress();
			
			// look if we have a card with this address
			return this.getFirstCardWithAddress(address)
			.then((card) => {
				return this._checkCardFromAddress(card, scheme);
			})
			.catch(err => {
				// if none found, we create one
				return this.createCard(scheme, authname, password, address);
			})
		})
		.then((crd) => {
			card = crd;
			
			return card;
		})
		.then(() => {
			if (callback)
				callback(null, card);
			
			return card;
		})
		.catch(err =>{
			if (callback)
				callback(err, null);
			
			throw err;
		});
		
	}
	
	modifyCard(carduuid, cardinfo, callback) {
		var global = this.global;
		var card;
		
		return this.getCardFromUUID(carduuid)
		.then((crd) => {
			card = crd;
			
			return card.unlock();
		})
		.then((unlocked) => {
			card.setLabel(cardinfo.label);
			
			if (cardinfo.xtra_data)
				card.putXtraData(null, cardinfo.xtra_data);
			
			return card.save();
		})
		.then(crd => {
			if (callback)
				callback(null, card);
			
			return card;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	cloneCard(card, newscheme, callback) {
		if (card.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}

		var global = this.global;
		var Card = global.getModuleClass('wallet', 'Card');
		
		var _authname = card.getAuthName()
		var _address = card.getAddress();
		var _password = card.password;

		var clonedcard = new Card(this, newscheme, _authname, _address);
		
		clonedcard.setLabel('Clone of ' + card.getLabel());
		
		return clonedcard.init()
		.then((sess) => {
			// unlock clonedcard
			return clonedcard.unlock(_password);
		})
		.then((unlocked) => {
			// save card
			return clonedcard.save();
		})
		.then(() => {
			if (callback)
				callback(null, clonedcard);
			
			return clonedcard;
		})
		.catch(err =>{
			if (callback)
				callback(err, null);
			
			throw err;
		});
	}


	
	_saveCard(card, callback) {
		if (card.isLocked()) {
			if (callback)
				callback('ERR_CARD_LOCKED', null);
			
			return Promise.reject('ERR_CARD_LOCKED');
		}
		
		// we do an non-atomic save
		return this.getCardList(true)
		.then((cards) => {
			if (cards) {
				
				// check if it is in the list
				var bInList = false;
				
				for (var i = 0; i < cards.length; i++) {
					if (card.getCardUUID() == cards[i].getCardUUID()) {
						bInList = true;
						cards[i] = card;
						break;
					}
				}
				
				// add it if it is not
				if (!bInList)
				cards.push(card);
				
				// save list
				return this.saveCardList(cards);
			}
			else {
				return Promise.reject('could not retrieve the list of cards');
			}
		})
		.then((res) => {
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
	
	// token accounts
	getTokenAccountList(bRefresh, callback) {
		var global = this.global;
		var walletmodule = this.module;
		
		var tokenaccounts = [];
		
		return this.getCardList(bRefresh)
		.then((cards) => {
			if (cards) {
				var _addcardtokenaccountlistpromisefunc = (card) => {
					var carduuid = card.getCardUUID();
					var cardlocked = card.isLocked();
					
					if (cardlocked)
						card.unlock();
					
					return card.getTokenAccountList(bRefresh)
					.then((cardtokenaccounts) => {
						if (cardtokenaccounts)
							tokenaccounts = tokenaccounts.concat(cardtokenaccounts);
						
						if (cardlocked)
							card.lock(); // we re-lock card if it was locked
						
						return cardtokenaccounts;
					})
					.catch((err) => {
						console.log('error while listing token accounts: ' + err);
					});
				};
				
				return walletmodule.chained_resolve(cards, _addcardtokenaccountlistpromisefunc);
			}
			else {
				return Promise.resolve([]);
			}
		})
		.then(() => {
			if (callback)
				callback(null, tokenaccounts);
			
			return tokenaccounts;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getTokenAccountFromUUID(tokenaccountuuid, callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		return this.getTokenAccountList(true)
		.then((tokenaccountarray) => {
			if (tokenaccountarray) {
				for (var i = 0; i < tokenaccountarray.length; i++) {
					var tkna = tokenaccountarray[i];
					var tknauuid = tkna.getTokenAccountUUID();
					
					if ( tknauuid == tokenaccountuuid ) {
						return tkna;
					}
				}
				
				return Promise.reject('ERR_TOKEN_ACCOUNT_NOT_FOUND');
			} 
			else {
				return Promise.reject('could not retrieve the list of cards');
			}
		})
		.then((tokenaccount) => {
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
	

	
	// accounts
	getSessionAccountObject(address, callback) {
		var global = this.global;
		var session = this._getSession();
		
		var commonmodule = global.getModuleObject('common');
		
		if (!session.isValidAddress(address))
			return Promise.reject('ERR_INVALID_ADDRESS');
		
		var account = session.getSessionAccountObject(session, address);
		
		if (callback)
			callback(null, account);
		
		return Promise.resolve(account);
	}
	
	createSessionAccountObject(privatekey, callback) {
		var global = this.global;
		var session = this._getSession();
		
		var commonmodule = global.getModuleObject('common');
		
		if (!session.isValidPrivateKey(privatekey))
			return Promise.reject('ERR_INVALID_PRIVATE_KEY');
		
		var sessionuser = session.getSessionUserObject();
		var sessionaccount = global.getModuleObject('common').createBlankAccountObject(session);
		
		sessionaccount.setPrivateKey(privatekey);
		sessionaccount.setDescription(sessionaccount.getAddress());
		
		if (sessionuser) {
			sessionaccount.setOwner(sessionuser);
		}
		
		session.addAccountObject(sessionaccount);
		
		if (callback)
			callback(null, sessionaccount);
		
		return Promise.resolve(sessionaccount);
	}
	
	saveAccountObject(account, callback) {
		var global = this.global;
		var session = this._getSession();

		var storagemodule = global.getModuleObject('storage-access');
		var storageaccess = storagemodule.getStorageAccessInstance(session);
		
		var sessionuser = session.getSessionUserObject();
		
		return new Promise((resolve, reject) => { 
			storageaccess.user_add_account(sessionuser, account, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			return true;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw new Error(err);
		});
	}
	
	getSessionAccountObjects(bRefresh, callback) {
		var session = this._getSession();
		
		return new Promise((resolve, reject) => { 
			session.getSessionAccountObjects(bRefresh, (err, res) => {
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
	
	getAccountObject(address, callback) {
		var global = this.global;
		var session = this._getSession();
		
		var commonmodule = global.getModuleObject('common');
		
		if (!session.isValidAddress(address))
			return Promise.reject('ERR_INVALID_ADDRESS');
		
		var account = commonmodule.getAccountObject(session, address);
		
		if (callback)
			callback(null, account);
		
		return Promise.resolve(account);
	}
	
	getAccountObjects(bRefresh, callback) {
		var session = this._getSession();
		
		return new Promise((resolve, reject) => { 
			session.getAccountObjects(bRefresh, (err, res) => {
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
	
	// transactions
	getTransactionList(bRefresh, callback) {
		var global = this.global;
		var walletmodule = this.module;
		var walletuuid = this.uuid;
		var walletsession = this._getSession();
		
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		if ( (!bRefresh) || (bRefresh === false)) {
			if (callback)
				callback(null, this.transactions);
			
			return Promise.resolve(this.transactions);
		}
		
		var commonmodule = global.getModuleObject('common');
		var walletmodule = this.module;
		var Transaction = walletmodule.Transaction;
		
		var key = 'transactions';

		return new Promise((resolve, reject) => {
			var transactionlist = this.getValue(key);

			if (transactionlist) {
				var transactions = [];
				
				for (var i = 0; i < (transactionlist ? transactionlist.length : 0); i++) {
					var transactionjson = transactionlist[i];
					var transaction = Transaction.readFromJson(walletmodule, walletsession, transactionjson);
					
					transactions.push(transaction);
				}
				
				this.transactions = transactions;

				resolve(this.transactions);
			}
			else {
				resolve([]);
			}
		})
		.then((transactions) => {
			if (callback)
				callback(null, transactions);
			
			return transactions;
		});
	}
	
	saveTransactionList(transactions, callback) {
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		
		// put in vault under 'transactions'
		var key = 'transactions';
		
		// create json
		var transactionsjson = [];
		
		for (var i = 0; i < transactions.length; i++) {
			var transaction = transactions[i];
			var transactionjson = transaction.getLocalJson();
			
			transactionsjson.push(transactionjson);
		}
		
		return this.putValue(key, transactionsjson)
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
	
	_saveTransaction(transaction, callback) {
		// we do an non-atomic save
		// save transaction by adding it to list and saving list
		return this.getTransactionList(true)
		.then((transactions) => {
			if (transactions) {
				// check if it is in the list
				var bInList = false;
				
				for (var i = 0; i < transactions.length; i++) {
					if (transaction.getTransactionUUID() == transactions[i].getTransactionUUID()) {
						bInList = true;
						transactions[i] = transaction;
						break;
					}
				}
				
				// add it if it is not
				if (!bInList)
				transactions.push(transaction);
			
				return this.saveTransactionList(transactions)
				.then((transactionsjson) => {
					return transaction;
				});
			}
			else {
				return Promise.reject('could not retrieve the list of transactions');
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

	
	getTransactionFromUUID(transactionuuid, callback) {
		if (this.isLocked()) {
			
			if (callback)
				callback('ERR_WALLET_LOCKED', null);
			
			return Promise.reject('ERR_WALLET_LOCKED');
		}
		
		return this.getTransactionList(true)
		.then((transactionarray) => {
			if (transactionarray) {
				for (var i = 0; i < transactionarray.length; i++) {
					var transaction = transactionarray[i];
					var txuuid = transaction.getTransactionUUID();
					
					if ( txuuid == transactionuuid ) {
						return transaction;
					}
				}
				
				return Promise.reject('ERR_TRANSACTION_NOT_FOUND');
			} 
			else {
				return Promise.reject('could not retrieve the list of transactions');
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
	
	createCardTransaction(card, ethtransaction, callback) {
		var global = this.global;
		var session = this._getSession();
		var walletmodule = this.module;
		
		//return walletmodule.createTransaction(session, this, card, ethtransaction);
		var Transaction = walletmodule.Transaction;
		var transactionhash = ethtransaction.getTransactionHash();
		var ethnodetransactionuuid = ethtransaction.getTransactionUUID();
		
		var transaction = new Transaction(walletmodule, session, transactionhash);
		
		transaction.walletuuid = this.getWalletUUID();
		
		if (card)
			transaction.carduuid = card.getCardUUID();
		
		transaction.ethnodetransactionuuid = ethnodetransactionuuid;
		
		transaction.fromaddress = ethtransaction.getFrom();
		transaction.toaddress = ethtransaction.getTo();
		
		transaction.value = ethtransaction.getValue();
		
		transaction.creationdate = ethtransaction.getCreationDate();
		
		transaction.status = ethtransaction.getStatus();

		return transaction.save(callback);
	}
	
	// persistence
	save(callback) {
		// we do an non-atomic save
		var walletmodule = this.module;
		
		return walletmodule._saveWallet(this, callback);
	}
	
	// static methods
	static _getSafeVaultNameFromUUID(uuid) {
		return uuid.replace(/-/g, '.');
	}

	static readFromJson(walletmodule, session, walletjson) {
		var Wallet = walletmodule.Wallet;
		var authname = walletjson.authname;
		var type = walletjson.type;
		
		var wallet = new Wallet(walletmodule, session, authname, type);
		
		wallet.uuid = walletjson.uuid;
		wallet.label = walletjson.label;
		
		wallet.ownername = walletjson.ownername;
		wallet.owneremail = walletjson.owneremail;
		
		wallet.schemeuuid = walletjson.schemeuuid;
		
		wallet.xtra_data = (walletjson.xtra_data ? walletjson.xtra_data : {});
		
		return wallet;
	}
	
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('wallet', 'Wallet', Wallet);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Wallet', Wallet);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Wallet', Wallet);
}