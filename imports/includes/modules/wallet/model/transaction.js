'use strict';

var Transaction = class {
	
	static get CLIENT_TRANSACTION() { return 0;}
	static get REMOTE_TRANSACTION() { return 1;}

	constructor(module, session, transactionhash) {
		this.module = module;
		this.global = module.global;
		this.session = session;
		
		this.walletuuid = null;
		this.carduuid = null;

		this.uuid = null;
		
		this.origin = Transaction.REMOTE_TRANSACTION;
		
		this.label = null;

		this.ethnodetransactionuuid = null; // if originated from ethnode, somewhere (client, server, other app)
		this.transactionhash = transactionhash;

		this.fromaddress = null;
		this.toaddress = null;
		
		this.value = null;
		
		this.creationdate = null;
		
		this.status = null;
		
		
		this.xtra_data = {};
	}
	
	getLocalJson() {
		var json = {};
		
		json.uuid = (this.uuid ? this.uuid : this.getTransactionUUID());

		json.walletuuid = this.walletuuid;
		json.carduuid = this.carduuid;
		json.ethnodetransactionuuid = this.ethnodetransactionuuid;

		json.origin = this.origin;
		
		json.label = this.label;
		
		json.transactionhash = this.transactionhash;

		json.fromaddress = this.fromaddress;
		json.toaddress = this.toaddress;
		
		json.value = this.value;
		
		json.creationdate = this.creationdate;
		
		json.status = this.status;
		
		json.xtra_data = this.xtra_data;

		return json;
	}
	
	getTransactionType() {
		return this.origin;
	}
	
	getTransactionUUID() {
		if (this.uuid)
		return this.uuid;
		
		this.uuid = this.session.guid();
		
		return this.uuid;
	}
	
	setTransactionUUID(uuid) {
		this.uuid = uuid;
	}
	
	getWalletUUID() {
		return this.walletuuid;
	}
	
	_getWalletAsync() {
		if (!this.walletuuid)
			return Promise.reject('transaction has no wallet uuid');
		
		var walletmodule = this.module;
		var session = this.session;
		
		return walletmodule.getWalletFromUUID(session, this.walletuuid);
	}
	
	getCardUUID() {
		return this.carduuid;
	}
	
	_getCardAsync() {
		if (!this.carduuid)
			return Promise.reject('transaction has no card uuid');
		
		var walletmodule = this.module;
		
		return this._getWalletAsync()
		.then((wllt) => {
			return wllt.getCardFromUUID(this.carduuid);
		});
	}
	
	getTransactionHash() {
		return this.transactionhash;
	}
	
	getEthNodeTransactionUUID() {
		return this.ethnodetransactionuuid;
	}
	
	getEthNodeTransactionObject(callback) {
		var card;
		
		return this._getCardAsync()
		.then((crd) => {
			card = crd;
			
			var session = card._getSession();
			var global = session.getGlobalObject();
			
			var ethnodemodule = global.getModuleObject('ethnode');
			
			return ethnodemodule.getTransactionObject(session, this.ethnodetransactionuuid);
		})
		.then((ethnodetransaction) => {
			// TODO: verify we can remove this part for version >= 0.14.6
			var scheme = card.getScheme();
			var web3url = scheme.getWeb3ProviderUrl();
			
			if (web3url)
				ethnodetransaction.setWeb3ProviderUrl(web3url);
			
			// if txhash no filled by ethnode module
			// TODO: (it should)
			// we fill it no
			var txhash = ethnodetransaction.getTransactionHash();
			if (!txhash) {
				ethnodetransaction.setTransactionHash(this.transactionhash);
			}
			
			return ethnodetransaction;
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
	
	getEthTransaction(callback) {
		return this.getEthNodeTransactionObject()
		.then((ethnodetransaction) => {
			return new Promise((resolve, reject) => {
				ethnodetransaction.getEthTransaction((err, res) => {
					if (err) reject(err); else resolve(res);
				})
				.catch(err => {
					reject(err);
				});
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

	getEthTransactionReceipt(callback) {
		return this.getEthNodeTransactionObject()
		.then((ethnodetransaction) => {
			return new Promise((resolve, reject) => {
				ethnodetransaction.getEthTransactionReceipt((err, res) => {
					if (err) reject(err); else resolve(res);
				})
				.catch(err => {
					reject(err);
				});
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

	
	getOrigin() {
		return this.origin;
	}
	
	setOrigin(origin) {
		this.origin = origin;
	}
	
	getLabel() {
		return this.label;
	}
	
	setLabel(label) {
		this.label = label;
	}
	
	/*getWallet() {
		return this.wallet;
	}
	
	getCard() {
		return this.card;
	}*/
	
	getFrom() {
		return this.fromaddress;
	}
	
	getTo() {
		return this.toaddress;
	}
	
	getValue() {
		return this.value;
	}
	
	getCreationDate() {
		return this.creationdate;
	}
	
	getStatus() {
		return this.status;
	}
	
	// xtra data (e.g. used to save token transaction data)
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
	
	save(callback) {
		// we do an non-atomic save
		var walletmodule = this.module;
		
		var wallet;
		
		return this._getWalletAsync()
		.then((wllt) => {
			wallet = wllt;
			
			return wallet._saveTransaction(this);
		});
	}
	
	
	// static methods
	static readFromJson(walletmodule, session, transactionjson) {
		var transactionhash = transactionjson.transactionhash;

		var transaction = new Transaction(walletmodule, session, transactionhash);
		
		transaction.walletuuid = transactionjson.walletuuid;
		transaction.carduuid = transactionjson.carduuid;
		transaction.ethnodetransactionuuid = transactionjson.ethnodetransactionuuid;
		
		if (!transaction.ethnodetransactionuuid) {
			// look if we can find back from its hash
			walletmodule.getWalletFromUUID(session, transaction.walletuuid)
			.then((wallet) => {
				return Transaction.findEthTransactionFromHash(wallet, transactionhash);
			})
			.then((ethtx) => {
				transaction.ethnodetransactionuuid = ethtx.getTransactionUUID();
			})
			.catch(err => {
				console.log('error looking for transaction with hash ' + transactionhash + ': ' + err);
			})
			
		}
		
		transaction.setLabel(transactionjson.label);
		transaction.setOrigin(transactionjson.origin);
		
		// set transaction's uuid
		if (transactionjson.uuid)
			transaction.setTransactionUUID(transactionjson.uuid);
		
		transaction.fromaddress = transactionjson.fromaddress;
		transaction.toaddress = transactionjson.toaddress;
		
		transaction.value = transactionjson.value;
		
		transaction.creationdate = transactionjson.creationdate;
		
		transaction.status = transactionjson.status;
		
		transaction.xtra_data = transactionjson.xtra_data;

		return transaction;
	}
	
	// ethereum transactions
	static findEthTransactionFromHash(wallet, ethtransactionhash, callback) {
		return Transaction.getEthTransactionList(wallet, true)
		.then((ethtxlist) => {
			for (var i = 0; i < ethtxlist.length; i++) {
				var ethtx = ethtxlist[i];
				var ethtxhash = ethtx.getTransactionHash();
				
				if (ethtxhash == ethtransactionhash)
					return ethtx;
			}

			throw new Error('ERR_ETH_TRANSACTION_NOT_FOUND');
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch(err => {
			if (callback)
				callback('ERR_ETH_TRANSACTION_NOT_FOUND', null);
					
			throw new Error('ERR_ETH_TRANSACTION_NOT_FOUND');
		});
	}
	
	static getEthTransactionList(wallet, bRefresh, callback) {
		var session = wallet._getSession();
		var global = session.getGlobalObject();
		
		var ethnodemodule = global.getModuleObject('ethnode');
		
		return new Promise((resolve, reject) => {
			// nota: ethnodemodule.getTransactionList is reading from cache but triggers
			// a refresh
			ethnodemodule.getTransactionList(session, (err, res) => {
				if (err) resolve([]); else resolve(res);
			})
			.catch(err => {
				resolve([]);
			});
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch(err => {
			if (callback)
				callback(null, []);
					
			return [];
		});
		

	}


}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('wallet', 'Transaction', Transaction);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Transaction', Transaction);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Transaction', Transaction);
}
