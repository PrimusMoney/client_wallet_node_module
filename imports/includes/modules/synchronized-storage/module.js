'use strict';

var Module = class {
	
	constructor() {
		this.name = 'synchronized-storage';
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;
		
		this.activated = true;
		
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
		
		var global = this.global;
		
		var commonmodule = global.getModuleObject('common');
		
		// we replace commonmodule.LocalStorage by our synchronized version
		this.CommonLocalStorage = commonmodule.LocalStorage;
		commonmodule.LocalStorage = this.LocalStorage;
		
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

		// authkey
		var modulescriptloader = global.getScriptLoader('synchronizedmoduleloader', parentscriptloader);
		
		
		var xtraroot = './includes';
		
		var moduleroot = xtraroot + '/modules/synchronized-storage';

		modulescriptloader.push_script( moduleroot + '/model/localstorage.js');
		
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
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass ) {
	GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	GlobalClass.getGlobalObject().registerModuleDepency('synchronized-storage', 'common');
	GlobalClass.getGlobalObject().registerModuleDepency('synchronized-storage', 'clientmodules');
}
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('synchronized-storage', 'common');
	_GlobalClass.getGlobalObject().registerModuleDepency('synchronized-storage', 'clientmodules');
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('synchronized-storage', 'common');
	_GlobalClass.getGlobalObject().registerModuleDepency('synchronized-storage', 'clientmodules');
}
