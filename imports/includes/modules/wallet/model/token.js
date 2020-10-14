'use strict';

var Token = class {
	static get CLIENT_TOKEN() { return 0;}
	static get STORAGE_TOKEN() { return 1;}
	
	constructor(scheme, tokenaddress) {
		this.scheme = scheme;
		this.global = scheme.global;
		
		this.uuid = null;
		this.tokentype = null;
		
		this.tokenaddress = tokenaddress;
		
		this.label = null;
		this.web3_provider_url = null;
		
		this.erc20tokencontract = null;
	}
	
	getTokenType() {
		return this.tokentype;
	}
	
	setTokenType(type) {
		this.tokentype = type;
	}
	
	getTokenUUID() {
		return this.uuid;
	}
	
	setTokenUUID(uuid) {
		this.uuid = uuid;
	}
	
	getAddress() {
		return this.tokenaddress;
	}
	
	getLabel() {
		return this.label;
	}
	
	setLabel(label) {
		this.label = label;
	}
	
	getScheme() {
		return this.scheme;
	}
	
	
	// erc20 token contract
	_createERC20TokenContract(session) {
		var global = session.getGlobalObject();

		var erc20tokenmodule = global.getModuleObject('erc20');

		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();

		var tokenaddress = this.getAddress();
		var tokenlabel = this.getLabel();

		// create (local) contract for this token address
		var data = {};
		
		data['description'] = (tokenlabel ? tokenlabel : tokenaddress);;
		data['address'] = tokenaddress;
		
		var erc20tokencontract = erc20tokencontrollers.createERC20TokenObject(session, data);
		
		// we set web3_provider_url if scheme is local
		var scheme = this.getScheme();
		
		// if token has already been specified a web3 provider url 
		// (e.g. when created on the client instead of being imported)
		// then we take it
		var web3providerurl = this.web3_provider_url;
		
		if (web3providerurl) {
			erc20tokencontract.setWeb3ProviderUrl(web3providerurl);
		}
		else {
			var scheme = this.getScheme();
			web3providerurl = scheme.getWeb3ProviderUrl();
			
			if (web3providerurl)
			erc20tokencontract.setWeb3ProviderUrl(web3providerurl);
		}
		
		
		// note the contract we have just created
		this.erc20tokencontract = erc20tokencontract;

		return erc20tokencontract;
	}
	
	_checkERC20TokenContractStatusAsync(session) {
		if (!this.erc20tokencontract)
			return Promise.resolve(false);
		
		var global = this.global;
		var contract = this.erc20tokencontract;
		
		var oldstatus = contract.getLiveStatus();
		
		return new Promise((resolve, reject) => {
			contract.checkStatus((err, res) => {
				var newstatus = contract.getLiveStatus();

				if (newstatus != oldstatus) {
					
					// save token
					var erc20tokenmodule = global.getModuleObject('erc20');
					
					var erc20tokencontrollers = erc20tokenmodule.getControllersObject();
					
					erc20tokencontrollers.saveERC20TokenObject(session, contract);
					
					resolve(true);
				}
				else {
					resolve(false);
				}
			});
		});
		
	}
	
	_getERC20TokenContract(session) {
		var global = this.global;
		
		if (this.erc20tokencontract)
			return this.erc20tokencontract;
		
		if (!session)
			throw new Error('need session object to retrieve erc20 token contract object');
		
		var tokenuuid = this.tokenuuid; // if in list
		var tokenaddress = this.tokenaddress;
		
		var erc20tokenmodule = global.getModuleObject('erc20');
		
		
		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();
		var erc20tokencontract;
		
		if (tokenuuid) {
			// try to find with uuid first in local list
			erc20tokencontract = erc20tokencontrollers.getERC20TokenFromUUID(session, tokenuuid);
		}
		
		if (!erc20tokencontract) {
			// if none exists, we create a local contract
			erc20tokencontract = this._createERC20TokenContract(session);
		}
		else {
			// we fill with erc20token local values
			this.setName(erc20tokencontract.getLocalName());
			this.setSymbol(erc20tokencontract.getLocalSymbol());
			this.setDecimals(erc20tokencontract.getLocalDecimals());
			this.setTotalSupply(erc20tokencontract.getLocalTotalSupply());
		}
		
		this.erc20tokencontract = erc20tokencontract;

		return erc20tokencontract;
	}
	
	_synchronizeERC20TokenContract(session, callback) {
		return Token.synchronizeERC20TokenContract(session, this, callback);
	}

	_save(session) {
		return Token.saveToken(session, this, callback);
	}

	
	_setERC20TokenContract(erc20tokencontract) {
		this.erc20tokencontract = erc20tokencontract;
	}
	
	getLiveStatus() {
		if (this.erc20tokencontract)
		return this.erc20tokencontract.getLiveStatus();
	}
	
	getName() {
		if (this.erc20tokencontract)
		return this.erc20tokencontract.getLocalName();
	}
	
	getSymbol() {
		if (this.erc20tokencontract)
		return this.erc20tokencontract.getLocalSymbol();
	}
	
	getDecimals() {
		if (this.erc20tokencontract)
		return this.erc20tokencontract.getLocalDecimals();
	}
	
	getTotalSupply() {
		if (this.erc20tokencontract)
		return this.erc20tokencontract.getLocalTotalSupply();
	}
	
	getDescription() {
		if (this.erc20tokencontract)
		return this.erc20tokencontract.getLocalDescription();
	}
	
	getWeb3ProviderUrl() {
		if (this.erc20tokencontract)
			this.web3_provider_url = this.erc20tokencontract.getWeb3ProviderUrl();
		
		return this.web3_provider_url;
	}
	
	setWeb3providerUrl(web3providerurl) {
		this.web3_provider_url = web3providerurl;
	}
	
	isLocalOnly() {
		if (this.erc20tokencontract)
			return this.erc20tokencontract.isLocalOnly();
		else
			return true;
	}
	
	isOnChain(callback) {
		return new Promise((resolve, reject) => {
			if (this.erc20tokencontract)
				return this.erc20tokencontract.isOnChain((err, res) => {
					if (err) reject(err); else resolve((res ? true : false));
				});
			else
				return false;
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
					
			return false;
		});
	}
	
	// static functions

	// token objects (handled by wallet module)
	static saveToken(session, token, callback) {
		var global = session.getGlobalObject();

		var erc20tokenmodule = global.getModuleObject('erc20');

		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();
		var erc20tokencontract;
		
		var tokenuuid = token.getTokenUUID();
		var tokenaddress = token.getAddress();
		var tokenlabel = token.getLabel();
		
		if (tokenuuid) {
			// try to find with uuid first in (cached) list
			erc20tokencontract = erc20tokencontrollers.getERC20TokenFromUUID(session, tokenuuid);
		}
		
		if (!erc20tokencontract) {
			// create (local) contract for this token address
			erc20tokencontract = token._createERC20TokenContract(session);
		}
		
		// we fill with erc20token local values
		erc20tokencontract.setLocalName(token.getLabel());
		
		return Token.saveERC20TokenContract(session, token)
		.then(() => {
			// set uuid in token
			token.setTokenUUID(erc20tokencontract.getUUID());
			
			return token.getTokenUUID();
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			throw err;
		});
		
	}
	
	// erc20token contracts (handled by @p2pmoney-org/ethereum_erc20)
	static getERC20TokenContractList(session, bRefresh, callback) {
		var global = session.getGlobalObject();
		
		var erc20tokenmodule = global.getModuleObject('erc20');

		return new Promise((resolve, reject) => {
			erc20tokenmodule.getERC20Tokens(session, bRefresh, (err, res) => {
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
	
	static saveERC20TokenContract(session, token, callback) {
		var global = session.getGlobalObject();
		
		var erc20tokencontract = token.erc20tokencontract;
		
		var erc20tokenmodule = global.getModuleObject('erc20');
		var erc20tokencontrollers = erc20tokenmodule.getControllersObject();

		return new Promise((resolve, reject) => {
			var tokentype = token.getTokenType();
			
			if (tokentype == Token.STORAGE_TOKEN) {
				erc20tokencontrollers.saveERC20TokenObject(session, erc20tokencontract, (err, res) => {
					if (err) reject(err); else resolve(erc20tokencontract);
				});
			}
			else {
				// we let token account keep the elements
				// to instantiate the token in memory
				resolve(erc20tokencontract);
			}
		})
		.then(() => {
			if (callback)
				callback(null, erc20tokencontract);
			
			return erc20tokencontract;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
					
			throw new Error(err);
		});
	}
	
	static synchronizeERC20TokenContract(session, token, callback) {
		var erc20tokencontract = token.erc20tokencontract;
		
		return erc20tokencontract.getChainName()
		.then((name) => {
			console.log("chain name is " + name);
			
			if (name)
			erc20tokencontract.setLocalName(name);
			
			return erc20tokencontract.getChainSymbol();
		})
		.then((symbol) => {
			console.log("symbol is " + symbol);
			
			if (symbol)
			erc20tokencontract.setLocalSymbol(symbol);
			
			return erc20tokencontract.getChainDecimals();
		})
		.then((decimals) => {
			console.log("decimals is " + decimals);
			
			if (decimals)
			erc20tokencontract.setLocalDecimals(decimals);
			
			return erc20tokencontract.getChainTotalSupply();
		})
		.then((totalsupply) => {
			console.log("total supply is " + totalsupply);
			
			if (totalsupply)
			erc20tokencontract.setLocalTotalSupply(totalsupply);
			
			return erc20tokencontract;
		})
		.then((erc20tokencontract)=> {
			// save erc20 token contract
			return Token.saveERC20TokenContract(session, token);
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
	

}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('wallet', 'Token', Token);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Token', Token);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Token', Token);
}