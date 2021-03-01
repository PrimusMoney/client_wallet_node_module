/**
 * 
 */
'use strict';

class ClientModules {
	constructor() {
		this.name = 'clientmodules';
		this.current_version = "0.20.8.1.2021.03.13";
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;
		
		this.controllers = null;

		// default current session
		this.session = null;

		this.sessionmap = Object.create(null);
	}
	
	init() {
		console.log('module init called for ' + this.name);
		
		this.isready = true;
	}
	
	// compulsory  module functions
	loadModule(parentscriptloader, callback) {
		console.log('loadModule called for module ' + this.name);
		
		if (this.isloading)
			return;
			
		this.isloading = true;

		var self = this;
		var global = this.global;

		// clients module script loader
		var modulescriptloader;
		
		// look if clientmodulesloader already created (e.g. for loading in node.js)
		modulescriptloader = global.findScriptLoader('clientmodulesloader');

		// if not, create on as child as parent script loader passed in argument
		if (!modulescriptloader)
		modulescriptloader = parentscriptloader.getChildLoader('clientmodulesloader');

		var xtraroot = './includes';
		var moduleroot = xtraroot + '/modules';

		modulescriptloader.push_script( moduleroot + '/control/controllers.js');

		modulescriptloader.load_scripts(function() { self.init(); if (callback) callback(null, self);});

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
		
		global.registerHook('getVersionInfo_hook', this.name, this.getVersionInfo_hook);
		global.modifyHookPriority('getVersionInfo_hook', this.name, -7);
		
		
		// authentication actions
		global.registerHook('isSessionAnonymous_hook', this.name, this.isSessionAnonymous_hook);
		global.modifyHookPriority('isSessionAnonymous_hook', this.name, 5);

		
		// signal module is ready
		var rootscriptloader = global.getRootScriptLoader();
		rootscriptloader.signalEvent('on_clientmodules_module_ready');
	}
	
	postRegisterModule() {
		console.log('postRegisterModule called for ' + this.name);
		if (!this.isloading) {
			var global = this.global;
			var self = this;
			var rootscriptloader = global.getRootScriptLoader();
			
			this.loadModule(rootscriptloader, () => {
				if (this.registerHooks)
				this.registerHooks();
			});
		}
	}
	
	
	//
	// hooks
	//
	getVersionInfo_hook(result, params) {
		console.log('getVersionInfo_hook called for ' + this.name);
		
		var global = this.global;
		var _globalscope = global.getExecutionGlobalScope();
		var Constants = _globalscope.simplestore.Constants;
		var mobile_versioninfo = this.current_version;
		
		var versioninfos = params[0];
		
		var versioninfo = {};
		
		versioninfo.label = global.t('client modules');
		versioninfo.value = (mobile_versioninfo ? mobile_versioninfo : global.t('unknown'));
		
		versioninfos.push(versioninfo);

		
		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	isSessionAnonymous_hook(result, params) {
		console.log('isSessionAnonymous_hook called for ' + this.name);
		
		if (this.isready === false)
			return false;
		
		var global = this.global;
		
		var session = params[0];
		
		// we look if we opened a vault in this session
		var vaults = session.getVaultObjects();
		
		if (vaults && (vaults.length > 0)) {
			var sessionuser = session.getSessionUserObject();
			
			if (sessionuser) {
				for (var i = 0; i < vaults.length; i++) {
					var vault = vaults[i];
					var vaultname = vault.getName();
					var username = sessionuser.getUserName();
					
					if (username == vaultname) {
						if (vault.isLocked()) {
							// vault has been relocked
							session.disconnectUser();
						}
						
						// stop to prevent authkey answering session is not authenticated
						result.push({module: this.name, handled: true, stop: true});
						
						return true;
					}
				}
			}
			
		}
		
		
		// treated hook event
		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	// api functions
	
	//
	// control
	//
	
	getControllersObject() {
		if (this.controllers)
			return this.controllers;
		
		this.controllers = new this.Controllers(this);
		
		return this.controllers;
	}


	hasLocalAuthentication() {
		var global = this.global;
		var authkeymodule = global.getModuleObject('authkey');
		
		var authkeyactivated = authkeymodule.isActivated();
		
		if (authkeyactivated)
			return false;
		else
			return true;
	}
	
	//
	// Settings
	//
	readSettings(session, keys, defaultvalue, callback) {
		var _keys = ['shared', 'client', 'settings'].concat(keys);
		
		var clientAccess = session.getClientStorageAccessInstance();

		return new Promise((resolve, reject) => { 
			clientAccess.readUserJson(_keys, (err, res) => {
				if (err) {
					reject(err); 
				}
				else {
					var ret = (typeof res != 'undefined' ? res : defaultvalue);

					resolve(ret);
				}
			});
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch(err => {
			if (callback)
				callback(null, defaultvalue);
			
			return defaultvalue;
		});
	}
	
	putSettings(session, keys, json, callback) {
		var _keys = ['shared', 'client', 'settings'].concat(keys);
		
		var clientAccess = session.getClientStorageAccessInstance();

		return new Promise((resolve, reject) => { 
			clientAccess.saveUserJson(_keys, json, (err, res) => {
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
	
	//
	// Events
	//
	registerEventListener(eventname, listeneruuid, listener) {
		var global = this.global;
		global.registerEventListener(eventname, listeneruuid, listener);
	}

	unregisterEventListener(eventname, listeneruuid) {
		var global = this.global;
		global.unregisterEventListener(eventname, listeneruuid);
	}

	signalEvent(eventname) {
		var global = this.global;
		console.log('signalEvent called for event ' + eventname);
		
		global.signalEvent(eventname);
	}
	
	//
	// Session
	//
	getCurrentSessionObject() {
		if (this.session)
			return this.session;
		
		this.session = this.createBlankSessionObject();
		
		this.session.CLIENTMODULE = Date.now();
		
		return this.session;
	}
	
	getSessionObject(sessionuuid, callback) {
		// look in our map
		var session = this.sessionmap[sessionuuid];
		
		if (session) {
			if (callback)
				callback(null, session);
			
			return Promise.resolve(session);
		}
		
		// look in global map
		var global = this.global;
		var commonmodule = global.getModuleObject('common');

		session = commonmodule.findSessionObjectFromUUID(sessionuuid);
		
		if (session) {
			console.log('WARNING: retrieving a session that was not created with our interface: ' + sessionuuid);
			this.sessionmap[sessionuuid] = session;
			
			if (callback)
				callback(null, session);
			
			return Promise.resolve(session);
		}
		else {
			if (callback)
				callback('ERR_SESSION_NOT_FOUND', null);
			
			return Promise.reject('ERR_SESSION_NOT_FOUND');
		}
	}
	
	setCurrentSessionObject(session) {
		this.session = session;
	}
	
	createBlankSessionObject(parentsession) {
		var global = this.global;
		var commonmodule = global.getModuleObject('common');

		var session = commonmodule.createBlankSessionObject();
		
		session.CLIENT = this.current_version;
		
		// add to map
		var sessionuuid = session.getSessionUUID();
		
		this.sessionmap[sessionuuid] = session;
		
		if (parentsession) {
			this.attachChildSessionObject(session, parentsession);
		}
		
		return session;
	}
	
	authenticate(session, username, password, callback) {
		var global = this.global;

		if (!session)
		return Promise.reject('no session passed in argument')
		
		var islocalsession = ((!session.authkey_server_access_instance) || (!session.authkey_server_access_instance._isReady()) ? true : false);

		if (islocalsession) {
			// we use vaults local vault
			var vaulttype = 0;

			var commonmodule = global.getModuleObject('common');
		
			return new Promise((resolve, reject) => { 
				commonmodule.openVault(session, username, password, vaulttype, (err, res) => {
					if (err) reject(err); else resolve(res);
				}); //  does not return a promise
			})			
			.then((vault) => {
				// impersonate
				return this.impersonateVaultAsync(session, vault);
			})
			.then((res) => {
				if (callback)
					callback(null, session);
				
				return session;
			})
			.catch(err => {
				if (callback)
					callback('ERR_SESSION_NOT_AUTHENTICATED', null);
			
				throw new Error('ERR_SESSION_NOT_AUTHENTICATED');
			});
	

		}
		else {
			var authkeymodule = global.getModuleObject('authkey');

			if (!authkeymodule.isActivated())
				throw new Error('authkey module is not activated');
			
			return new Promise((resolve, reject) => { 
				authkeymodule._authenticate(session, username, password, (err, res) => {
					if (err) reject(err); else resolve(res);
				})
				.catch(err => {
					reject(err);
				});
			})
			.then((res) => {
				if (callback)
					callback(null, session);
				
				return session;
			})
			.catch(err => {
				if (callback)
					callback('ERR_SESSION_NOT_AUTHENTICATED', null);
			
				throw new Error('ERR_SESSION_NOT_AUTHENTICATED');
			});
		}

	}

	
	openChildSession(session, username, password, network, callback) {
		var global = this.global;
		
		// create a child session
		var childsession = this.createBlankSessionObject(session);
		
		// set it's network
		return this.setSessionNetworkConfig(childsession, network)
		.then((sess) => {
			// authenticate child session
			var authkeymodule = global.getModuleObject('authkey');

			return new Promise((resolve, reject) => { 
				authkeymodule._authenticate(childsession, username, password, (err, res) => {
					if (err) reject(err); else resolve(res);
				})
				.catch(err => {
					reject(err);
				});
			});
		})
		.then((authenticated) => {
			if (callback)
				callback(null, childsession);
			
			return res;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
					
			throw new Error(err);
		});

	}

	
	getChildSessionObjects(session) {
		var childsessionmap = session.getSessionVariable('childsessionmap');
		
		if (!childsessionmap) {
			childsessionmap = Object.create(null);
			session.setSessionVariable('childsessionmap', childsessionmap);
		}
		
		var array = [];
		
		for (var key in childsessionmap) {
		    if (!childsessionmap[key]) continue;
		    
		    array.push(childsessionmap[key]);
		}
		
		return array;
	}
	
	cleanChildSessionObjects(session) {
		var childsessionmap = session.getSessionVariable('childsessionmap');
		
		// empty map
		if (childsessionmap) {
			childsessionmap = Object.create(null);
			session.setSessionVariable('childsessionmap', childsessionmap);
		}
	}
	
	getParentSessionObject(session) {
		var parentsessionuuid = session.setSessionVariable('parentsessionuuid');
		
		if (parentsessionuuid) {
			return this.getSessionObject(parentsessionuuid);
		}
	}
	
	attachChildSessionObject(session, parentsession) {
		if (parentsession) {
			var childsession = session;
			
			// detach from former parent (if any)
			this.detachChildSessionObject(childsession)
			
			// attach to new
			var childsessionmap = parentsession.getSessionVariable('childsessionmap');
			
			if (!childsessionmap) {
				childsessionmap = Object.create(null);
				parentsession.setSessionVariable('childsessionmap', childsessionmap);
			}
			
			// put child session in parent's child session map
			var parentsessionuuid = parentsession.getSessionUUID();
			var childsessionuuid = childsession.getSessionUUID();
			
			childsessionmap[childsessionuuid] = childsession;
			childsession.setSessionVariable('parentsessionuuid', parentsessionuuid);
			
			console.log('attaching child session ' + childsessionuuid  + '  to ' + parentsessionuuid);
		}
	}
	
	detachChildSessionObject(session) {
		// former parent
		var oldparentsession = this.getParentSessionObject(session);
		
		if (oldparentsession) {
			var childsession = session;
			var parentsession = oldparentsession;
			
			var childsessionmap = parentsession.getSessionVariable('childsessionmap');
			
			if (!childsessionmap) {
				childsessionmap = Object.create(null);
				parentsession.setSessionVariable('childsessionmap', childsessionmap);
			}
			
			// remove child session from parent's child session map
			var parentsessionuuid = parentsession.getSessionUUID();
			var childsessionuuid = childsession.getSessionUUID();
			
			delete childsessionmap[childsessionuuid];
			childsession.setSessionVariable('parentsessionuuid', null);
			
			console.log('detaching child session ' + childsessionuuid  + '  to ' + parentsessionuuid);
		}
	}
	
	_resetSessionInstances(session) {
		session.storage_access_instance = null;
		session.ethereum_node_access_instance = null;
		session.authkey_server_access_instance = null;
	}
	
	setSessionNetworkConfig(session, network, callback) {
		var global = this.global;
		
		if (!network) {
			if (callback)
				callback('no network config specified for session ' + session.getSessionUUID(), null);
			
			return Promise.reject('no network config specified for session ' + session.getSessionUUID());
		}
		
		var xtraconfigmodule = global.getModuleObject('xtraconfig');
		
		// reset session access instances
		this._resetSessionInstances(session);
		
		var rest_server_url;
		var rest_server_api_path;

		return new Promise((resolve, reject) => {
			resolve(session);
		})
		.then((session) => {
			// webapp
			var restserver = (network.restserver ? network.restserver : {});
			
			rest_server_url = (restserver.rest_server_url ? restserver.rest_server_url : null);
			rest_server_api_path = (restserver.rest_server_api_path ? restserver.rest_server_api_path : null);
			
			if (restserver.activate) {
				if (!xtraconfigmodule.isActivated())
					throw new Error('webapp module is not activated');

				if (rest_server_url && rest_server_api_path) {
					session.xtraconfig.rest_server_url = rest_server_url
					session.xtraconfig.rest_server_api_path = rest_server_api_path
				}
			}
			else {
				session.overload_storage_access = false;
			}
			
			return session;
		})
		.then((session) => {
			// TODO: should be handled in setSessionNetworkConfig_asynchook of wallet module
			// because this is specific to schemes
			
			// ethnode
			var ethnodemodule = global.getModuleObject('ethnode');

			var ethnodeserver = (network.ethnodeserver ? network.ethnodeserver : {});
			if (ethnodeserver.activate) {

				// set web3 provider for the local session 
				// TODO: (but remote is not authenticated yet)
				if (ethnodeserver.web3_provider_url)
				ethnodemodule.setWeb3ProviderUrl(ethnodeserver.web3_provider_url, session,  (err,res) => {
					if (err) {
						console.log('error setting web3 provider url for session ' + session.getSessionUUID() + ': ' + err);
					}
				});
					
				// !!! we do not overload rest_server_url for the moment
			}
			else {
				session.overload_ethereum_node_access = false;

				// set web3 provider for the local session
				if (ethnodeserver.web3_provider_url)
				ethnodemodule.setWeb3ProviderUrl(ethnodeserver.web3_provider_url, session,  (err,res) => {
					if (err) {
						console.log('error setting web3 provider url for session ' + session.getSessionUUID() + ': ' + err);
					}
				});
			}
			
			return session;
		})
		.then((session) => {
			// authkey interface
			var authkeymodule = global.getModuleObject('authkey');
			
			var authkey_server_access_instance = authkeymodule.getAuthKeyServerAccessInstance(session);
			
			// auth
			var authserver = (network.authserver ? network.authserver : {});
			if (authserver.activate) {
				if (!authkeymodule.isActivated())
					throw new Error('authkey module is not activated');
				
				var auth_rest_server_url = (authserver.rest_server_url ? authserver.rest_server_url : rest_server_url);
				var auth_rest_server_api_path = (authserver.rest_server_api_path ? authserver.rest_server_api_path : rest_server_api_path);
				
				if (auth_rest_server_url && auth_rest_server_api_path) {
					var rest_auth_connection = session.createRestConnection(auth_rest_server_url, auth_rest_server_api_path);
					
					authkey_server_access_instance.setRestAuthConnection(rest_auth_connection);
				}
			}
			else {
				session.activate_authkey_server_access = false;
			}
			
			// key
			var keyserver = (network.keyserver ? network.keyserver : {});
			if (keyserver.activate) {
				if (!authkeymodule.isActivated())
					throw new Error('authkey module is not activated');

				var key_rest_server_url = (keyserver.rest_server_url ? keyserver.rest_server_url : rest_server_url);
				var key_rest_server_api_path = (keyserver.rest_server_api_path ? keyserver.rest_server_api_path : rest_server_api_path);
				
				if (key_rest_server_url && key_rest_server_api_path) {
					var rest_key_connection = session.createRestConnection(key_rest_server_url, key_rest_server_api_path);
					
					authkey_server_access_instance.setRestKeyConnection(rest_key_connection);
				}
			}
			else {
				session.activate_authkey_server_access = false;
			}

			// oauth2
			session.activate_oauth2_server_access = false;

			if (session.activate_authkey_server_access !== false) {
				if (network.authserver && network.authserver.mode && (network.authserver.mode == 'oauth2')) {
					var oauth2module = global.getModuleObject('oauth2');
	
					if (!oauth2module.isActivated())
						throw new Error('oauth2 module is not activated');
	
					session.activate_oauth2_server_access = true;
					
					// fill rest connection
					var oauth2_rest_server_url = network.authserver.rest_server_url;
					var oauth2_rest_server_api_path = network.authserver.rest_server_api_path;
					
					if (oauth2_rest_server_url && oauth2_rest_server_api_path) {
						var oauth2_provider = network.authserver.oauth2.provider;
						var oauth2_server_access_instance = oauth2module.getOAuth2ServerAccessInstance(session, oauth2_provider);
						var rest_oauth2_connection = session.createRestConnection(oauth2_rest_server_url, oauth2_rest_server_api_path);
						
						oauth2_server_access_instance.setRestOAuth2Connection(rest_oauth2_connection);
					}
	
	
				}
			}
				
			return session;
		})
		.then(() => {
			var result = []; 
			var params = [];
			
			params.push(session);
			params.push(network);
			
			// call async hooks to let them create network promises
			return global.invokeAsyncHooks('setSessionNetworkConfig_asynchook', result, params)
		})
		.then(() => {
			if (callback)
				callback(null, session);
			
			return session;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
			
			return session;
		});
	}
	
	invokeAsyncHooks(hookentry, result, inputparams) {
		var global = this.global;

		return global.invokeAsyncHooks(hookentry, result, params);
	}
	
	
	// vaults
	impersonateVault(session, vault) {
		if (!vault)
			return false;
		
		// Note: this does not guarantee accounts are read soon enough
		// call directly impersonateVaultAsync if you need to have it
		this.impersonateVaultAsync(session, vault);

		
		return true;
	}
	
	impersonateVaultAsync(session, vault) {
		if (!vault) {
			if (callback)
				callback('no vault passed in argument', null);
			
			return Promise.reject('no vault passed in argument');
		}
		
		var global = this.global;
		var vaultname = vault.getName();

		var commonmodule = global.getModuleObject('common');

		var cryptokey = vault.getCryptoKeyObject();
		
		// impersonate with vault's name and crypto key uuid
		var user = commonmodule.createBlankUserObject(session);

		user.setUserName(vaultname);
		user.setUserUUID(cryptokey.getKeyUUID());
		
		session.impersonateUser(user);
		
		// re-add vault to session that cleared everything
		session.putVault(vault);
		
		// add crypto key to session and user
		user.addCryptoKeyObject(cryptokey);
		session.addCryptoKeyObject(cryptokey);
		
		// read accounts
		var storagemodule = global.getModuleObject('storage-access');
		var storageaccess = storagemodule.getStorageAccessInstance(session);
		
		return new Promise((resolve, reject) => {
			// we force a refresh to fill the memory cache
			var keys = ['common', 'accounts'];
			var _localstorage = session.getLocalStorageObject();
			
			_localstorage.readLocalJson(keys, true, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		})
		.then(() => {
			return new Promise((resolve, reject) => { 
				storageaccess.account_session_keys( (err, res) => {
					if (res && res['keys']) {
						var keys = res['keys'];
						
						session.readSessionAccountFromKeys(keys);
					}
					
					resolve(true);
				})
				.catch(err => {
					console.log('error in ClientsModule.impersonateVaultAsync: ' + err);
					reject(err);
				});
			})
		

		});
	}
	

	// utils
	isValidEmail(session, emailaddress) {
		if (!emailaddress)
			return false;
		
		var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
		
		if(emailaddress.match(mailformat))
			return true;
		else
			return false;
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
	
	http_get_json(session, configurl) {
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
	

}

if ( typeof GlobalClass !== 'undefined' && GlobalClass ) {
	GlobalClass.getGlobalObject().registerModuleObject(new ClientModules());

	// dependencies
	GlobalClass.getGlobalObject().registerModuleDepency('clientmodules', 'common');	
}
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new ClientModules());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('clientmodules', 'common');	
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new ClientModules());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('clientmodules', 'common');	
}
