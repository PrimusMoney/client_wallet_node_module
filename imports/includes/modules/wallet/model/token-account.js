'use strict';

var TokenAccount = class {
	static get CLIENT_TOKEN_ACCOUNT() { return 0;}
	static get REMOTE_TOKEN_ACCOUNT() { return 1;}
	
	constructor(card, token) {
		this.card = card;
		this.global = this.card.global;
		
		this.label = null;
		this.uuid = null;
		
		this.token = token;
		
		this.tokenuuid = token.getTokenUUID();
		
		this.tokenaddress = token.getAddress();
		
		this.name = null;
		this.symbol = null;
		this.decimals = null;
		this.totalsupply = null;
		this.description = null;
		
		this.xtra_data = {};
		
		// operations
		this.ethereumnodeaccess = null;
	}
	
	init(callback) {
		var session = this._getSession();
		
		// import erc20 token contract
		return this._importERC20TokenContract(session)
		.then((erc20tokencontract)=>  {

			return true;
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
	
	getLocalJson() {
		var json = {};
		
		json.carduuid = this.card.getCardUUID();
		
		// token elements (could be used to create a memory token
		// if storage erc20 contract is removed from storage)
		json.tokenuuid = this.token.getTokenUUID(); // in case token account was imported from existing token in list
		json.tokenaddress = this.token.getAddress();
		json.tokenweb3providerurl = this.token.getWeb3ProviderUrl();
		
		// token accounts
		json.uuid = (this.uuid ? this.uuid : this.getTokenAccountUUID());
		json.label = this.label;
		
		json.name = this.name;
		json.symbol = this.symbol;
		json.decimals = this.decimals;
		json.totalsupply = this.totalsupply;
		json.description = this.description;
		
		json.xtra_data = this.xtra_data;

		return json;
	}
	
	getTokenAccountUUID() {
		if (this.uuid)
		return this.uuid;
		
		var session = this._getSession();
		
		if (session)
		this.uuid = session.guid();
		
		return this.uuid;
	}
	
	setTokenAccountUUID(uuid) {
		this.uuid = uuid;
	}
	
	getTokenAccountType() {
		var tokenscheme = this.token.getScheme();
		var tokenschemetype = tokenscheme.getSchemeType();
		
		switch(tokenschemetype) {
			case 0:
				return TokenAccount.CLIENT_TOKEN_ACCOUNT;
			case 1: {
				var tokentype = this.token.getTokenType();
				
				if (tokentype == 1)
					return TokenAccount.REMOTE_TOKEN_ACCOUNT;
				else
					return TokenAccount.CLIENT_TOKEN_ACCOUNT; // memory token, created by our tokenaccount in memory
			}
			default:
				return -1;
		}
	}
	
	getCard() {
		return this.card;
	}
	
	getToken() {
		return this.token;
	}
	
	getTokenAddress() {
		return (this.token ? this.token.getAddress() : null);
	}
	
	getLabel() {
		return this.label;
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
		return this.card._getSession();
	}
	
	_synchronizeWithERC20TokenContract(session) {
		var global = this.global;
		var Token = global.getModuleClass('wallet', 'Token');
		
		var erc20tokencontract = this.token._getERC20TokenContract(session)

		return Token.synchronizeERC20TokenContract(session, this.token)
		.then((erc20tokencontract) => {
			var address = erc20tokencontract.getAddress();
			var name = erc20tokencontract.getLocalName();
			var symbol = erc20tokencontract.getLocalSymbol();
			var decimals = erc20tokencontract.getLocalDecimals();
			var totalsupply = erc20tokencontract.getLocalTotalSupply();
			var description = erc20tokencontract.getLocalDescription();
			
			if (name) this.setName(name);
			if (symbol) this.setSymbol(symbol);
			if (decimals) this.setDecimals(decimals);
			if (totalsupply) this.setTotalSupply(totalsupply);
			if (description) this.setDescription(description);
			
			if (!this.label) {
				if (!session.areAddressesEqual(address, description))
					this.setLabel(description); // imported from remote server
				else
					this.setLabel(erc20tokencontract.getLocalName());
			}
			
			return this._update(); // do not refresh token account list to avoid an infernal loop
		})
		.catch(err => {
			console.log('error in TokenAccount._synchronizeWithERC20Token: ' + err);
		});
		
	}
	
	_importERC20TokenContract(session) {
		var global = this.global;
		
		var erc20tokencontract = this.token._getERC20TokenContract(session)
		
		// we spawn fetching chain values
		// (actually only totalsupply and description could possibly change after initial import)
		this._synchronizeWithERC20TokenContract(session);
		
		// return contract
		return Promise.resolve(this.erc20tokencontract);
	}
	
	getName() {
		return this.name;
	}
	
	setName(name) {
		this.name = name;
	}
	
	getSymbol() {
		return this.symbol;
	}
	
	setSymbol(symbol) {
		this.symbol = symbol;
	}
	
	getDecimals() {
		return this.decimals;
	}
	
	setDecimals(decimals) {
		this.decimals = decimals;
	}
	
	getTotalSupply() {
		return this.totalsupply;
	}
	
	setTotalSupply(totalsupply) {
		this.totalsupply = totalsupply;
	}
	
	getDescription() {
		return this.description;
	}
	
	setDescription(description) {
		this.description = description;
	}
	
	getPosition(callback) {
		var global = this.global;
		var card = this.card;
		
		var account = card._getAccountObject();

		// ask for balance
		var erc20tokencontract = this.token._getERC20TokenContract();
		
		if (!erc20tokencontract) {
			if (callback)
				callback('ERR_TOKEN_ACCOUNT_NOT_INITIALIZED', null);
			
			return Promise.reject('ERR_TOKEN_ACCOUNT_NOT_INITIALIZED');
		}
		
		return erc20tokencontract.balanceOf(account)
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
	
	_createEthNodeTransactionObject(session, erc20tokencontract, sendingaccount, recipientaccount, txhash) {
		var global = this.global;
		var ethnodemodule = global.getModuleObject('ethnode');
		var Transaction = ethnodemodule.Transaction;
		
		var transaction = new Transaction(session); 

		transaction.setTransactionHash(txhash);
		transaction.setFrom(sendingaccount.getAddress());
		transaction.setTo(recipientaccount.getAddress());
		transaction.setValue(null);
		transaction.setCreationDate(Date.now());
		transaction.setStatus(null);
		transaction.setWeb3ProviderUrl(erc20tokencontract.getWeb3ProviderUrl());

		return transaction;
	}
	
	transferTo(contact, amount, callback) {
		var global = this.global;
		var card = this.card;
		var wallet = card.getWallet();
		var scheme = card.getScheme()
		var session = this._getSession();
		
		var walletmodule = wallet.module;
		var Transaction = walletmodule.Transaction;
		
		var ethnodemodule = global.getModuleObject('ethnode');

		// ask transfer to erc20contact
		var erc20tokencontract = this.token._getERC20TokenContract();
		
		if (!erc20tokencontract) {
			if (callback)
				callback('ERR_TOKEN_ACCOUNT_NOT_INITIALIZED', null);
			
			return Promise.reject('ERR_TOKEN_ACCOUNT_NOT_INITIALIZED');
		}
		
		
		var _senderaccount = card._getSessionAccountObject();
		var _recipientaccount = contact._getAccountObject(session);
		var _amount = amount; // could check we do not have too many decimals
		var _payingaccount = card._getSessionAccountObject();
		var _gas = scheme.getGasLimit();
		var _gasPrice = scheme.getGasPrice();
		
		var wallettransaction;
		var ethtransactionhash;
		var ethtransaction;
		
		// we force a refresh of the list of accounts
		// to be sure that the cache used in ReactNativeClientStorage.readClientSideJson
		// is up to date
		return Transaction.getEthTransactionList(wallet, true)
		.then(() => {
			// unlock paying account
			return ethnodemodule.unlockAccount(session, _payingaccount, null, 300);
		})
		.then(() => {
			// do the transfer
			return erc20tokencontract.transfer(_senderaccount, _recipientaccount, _amount, _payingaccount, _gas, _gasPrice)
		})
		.then((txhash) => {
			ethtransactionhash = txhash;
			
			// read new list of transaction
			return Transaction.getEthTransactionList(wallet, false);
		})
		.then((ethtxlist) => {
			if (!ethtransactionhash)
				throw new Error('could not retrieve a transaction hash');
			
			for (var i = 0; i < ethtxlist.length; i++) {
				var ethtx = ethtxlist[i];
				var ethtxhash = ethtx.getTransactionHash();
				
				if (ethtxhash == ethtransactionhash)
					return ethtx;
			}
			
			// if we could not find in the list (because of async handling)
			// we create a dummy transaction
			var ethtx = this._createEthNodeTransactionObject(session, erc20tokencontract, _senderaccount, _recipientaccount, ethtransactionhash);
			
			return ethtx;
		})
		.then((res) => {
			ethtransaction = res;
			
			// create corresponding wallet transaction
			return wallet.createCardTransaction(card, ethtransaction);
		})
		.then((tx) => {
			wallettransaction = tx;
			
			// set origin as client transaction
			wallettransaction.setOrigin(Transaction.CLIENT_TRANSACTION);
			
			// save token account info in xtra_data
			wallettransaction.putXtraData('contactuuid', contact.getContactUUID());
			wallettransaction.putXtraData('tokenaccountuuid', this.getTokenAccountUUID());
			wallettransaction.putXtraData('amount', _amount);
			wallettransaction.putXtraData('ethtransactionuuid', ethtransaction.getTransactionUUID());
			wallettransaction.putXtraData('ethtransactionhash', ethtransactionhash);
			
			return wallettransaction.save();
		})
		.then(() => {
			// relock paying account
			return ethnodemodule.lockAccount(session, _payingaccount);
		})
		.then(() => {
			
			if (callback)
				callback(null, wallettransaction);
			
			return wallettransaction;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
					
			throw new Error(err);
		});

	}
	
	_update(callback) {
		var card = this.card;
		
		return card._updateTokenAccount(this, false, callback)
	}
	
	save(callback) {
		var card = this.card;
		
		return card._saveTokenAccount(this, callback);
	}
	

	
	// static methods
	static readFromJson(card, token, tokenaccountjson) {
		var wallet = card.wallet;
		var walletmodule = wallet.module;
		var TokenAccount = walletmodule.TokenAccount;
		
		var tokenaccount = new TokenAccount(card, token);
		
		tokenaccount.uuid = tokenaccountjson.uuid;
		tokenaccount.label = tokenaccountjson.label;
		
		tokenaccount.name = tokenaccountjson.name;
		tokenaccount.symbol = tokenaccountjson.symbol;
		tokenaccount.decimals = tokenaccountjson.decimals;
		tokenaccount.totalsupply = tokenaccountjson.totalsupply;
		tokenaccount.description = tokenaccountjson.description;
		
		tokenaccount.xtra_data = (tokenaccountjson.xtra_data ? tokenaccountjson.xtra_data : {});
		
		return tokenaccount;
	}


}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('wallet', 'TokenAccount', TokenAccount);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'TokenAccount', TokenAccount);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'TokenAccount', TokenAccount);
}