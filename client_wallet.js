'use strict';

var client_wallet;

class Client_Wallet {
	constructor() {
		this.load = null;
		
		this.initializing = false;
		this.initialized = false;
		
		this.initializationpromise = null;
		
		//var Ethereum_core = require('@p2pmoney-org/ethereum_core');
		var Ethereum_core = require('../../@p2pmoney-org/ethereum_core');
		var Ethereum_erc20 = require('../../@p2pmoney-org/ethereum_erc20');
		var Ethereum_xtra_web = require('../../@p2pmoney-org/ethereum_xtra_web');
		
		var PrimusMoney_ethereum_xtra_web = require('../../@primusmoney/ethereum_xtra_web');
		
		this.ethereum_core = Ethereum_core.getObject();
		this.ethereum_erc20 = Ethereum_erc20.getObject();
		this.ethereum_xtra_web = Ethereum_xtra_web.getObject();

		this.primus_ethereum_xtra_web = PrimusMoney_ethereum_xtra_web.getObject();
	}
	
	getVersion() {
		var packagejson = require('./package.json');
		return packagejson.version;
	}
	
	async init(callback) {
		console.log('@primusmoney/client_wallet init called');
		
		if (this.initialized) {
			console.log('module @primusmoney/client_wallet is already initialized.');
			return true;
		}
		
		if (this.initializing ) {
			console.log('module @primusmoney/client_wallet is already initializing. Wait till it\'s ready.');
			return this.initializationpromise;
		}

		// @p2pmoney dependencies
		var ethereum_core = this.ethereum_core;
		var ethereum_erc20 = this.ethereum_erc20;
		var ethereum_xtra_web = this.ethereum_xtra_web;
		
		if (ethereum_core.initialized === false) {
			await ethereum_core.init();
		}

		if (ethereum_erc20.initialized === false) {
			await ethereum_erc20.init();
		}

		if (ethereum_xtra_web.initialized === false) {
			await ethereum_xtra_web.init();
		}

		// @primusmoney dependencies
		var primus_ethereum_xtra_web = this.primus_ethereum_xtra_web;

		if (primus_ethereum_xtra_web.initialized === false) {
			await primus_ethereum_xtra_web.init();
		}


		// create loader
		if (typeof window !== 'undefined') {
			if (typeof document !== 'undefined' && document ) {
				// we are in a browser
				console.log('loading for browser');
				
				var BrowserLoad = require( './js/browser-load.js');

				this.load = new BrowserLoad(this);
			}
			else {
				// we are in react-native
				console.log('loading for react-native');
				
				var ReactNativeLoad = require( './js/react-native-load.js');

				this.load = new ReactNativeLoad(this);
			}	
		}
		else if (typeof global !== 'undefined') {
			console.log('loading for nodejs');
			
			// we are in nodejs
			var NodeLoad = require( './js/node-load.js');
			
			this.load = new NodeLoad(this);
		}

		var self = this;
		var promise;
		
		if (this.initializing === false) {
			
			this.initializationpromise = new Promise(function (resolve, reject) {
				self.load.init(function() {
				console.log('@primusmoney/client_wallet init finished');
				self.initialized = true;
				
				if (callback)
					callback(null, true);
				
				resolve(true);
				});
			});
			
			this.initializing = true;
		}
		
		return this.initializationpromise;
	}
	
	getGlobalObject() {
		if (typeof window !== 'undefined') {
			// we are in a browser or react-native
			return window.simplestore.Global.getGlobalObject();
		}
		else if (typeof global !== 'undefined') {
			// we are in nodejs
			return global.simplestore.Global.getGlobalObject();
		}
		
	}
	
	getControllersObject() {
		return require('./js/control/controllers.js').getObject();
	}

	getMvcAPI() {
		var clientglobal = this.getGlobalObject();
		
		var mvcmodule = clientglobal.getModuleObject('mvc-client-wallet');

		return mvcmodule;
	}
	
	getClientAPI() {
		var global = this.getGlobalObject();

		var clientsmodule = global.getModuleObject('clientmodules');

		var clientapicontrollers = clientsmodule.getControllersObject();

		return clientapicontrollers;
	}

	muteConsoleLog() {
		if (typeof window !== 'undefined') {
			if (!window.simplestore)
				return;

			// we are in a browser or react-native
			window.simplestore.noconsoleoverload = false;

			if (window.simplestore.Global) {
				var _clientglobal = window.simplestore.Global.getGlobalObject();

				_clientglobal.muteConsoleLog();
			}
		}
		else if (typeof global !== 'undefined') {
			if (!global.simplestore)
				return;

			// we are in nodejs
			global.simplestore.noconsoleoverload = false;

			if (global.simplestore.Global) {
				var _clientglobal = global.simplestore.Global.getGlobalObject();

				_clientglobal.muteConsoleLog();
			}
		}
	}

	
	// static methods
	static getObject() {
		if (client_wallet)
			return client_wallet;
		
			client_wallet = new Client_Wallet();
		
		return client_wallet;
	}
}

module.exports = Client_Wallet;