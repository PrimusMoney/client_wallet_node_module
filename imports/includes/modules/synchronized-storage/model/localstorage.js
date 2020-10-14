'use strict';

var StorageLocks = class {
	constructor() {
		this.map = Object.create(null); // use a simple object to implement the map
	}
	
	lock(key) {
		if (!key) return;
		var keystring= key.toString();
		this.map[keystring] = true;
	}
	
	
	unlock(key) {
		if (!key) return;
		var keystring= key.toString();
		this.map[keystring] = false;
	}
	
	islocked(key) {
		if (!key) return true;
		var keystring= key.toString();
		return (this.map[keystring] && this.map[keystring] === true ? true : false);
	}

}

var LocalStorage = class {

	constructor(session) {
		this.session = session;
		this.global = session.getGlobalObject();
		
		var syncstoragemodule = this.global.getModuleObject('synchronized-storage')
		
		var LocalStorage = syncstoragemodule.CommonLocalStorage;
		
		this.localStorage = new LocalStorage(session);
		this.clientStorage = session.getClientStorageAccessInstance();
		
		this.storagelocks = new StorageLocks();
	}
	
	getStorageAccessInstance() {
		return this.localStorage.getStorageAccessInstance();
	}
	

	empty() {
		return this.localStorage.empty();
	}
	
	isValidKey(key) {
		return this.localStorage.isValidKey(key);
	}
	
	keystostring(keys) {
		return this.localStorage.keystostring(keys);
	}
	
	getLocalJsonLeaf(keys, uuid, uuidfieldname) {
		return this.localStorage.getLocalJsonLeaf(keys, uuid, uuidfieldname);
	}
	
	updateLocalJsonLeaf(keys, uuid, json, uuidfieldname) {
		return this.localStorage.updateLocalJsonLeaf(keys, uuid, json, uuidfieldname);
	}
	
	removeLocalJsonLeaf(keys, uuid, uuidfieldname) {
		return this.localStorage.removeLocalJsonLeaf(keys, uuid, uuidfieldname);
	}
	
	insertLocalJsonLeaf(keys, parentuuid, collectionname, json, uuidfieldname) {
		return this.localStorage.insertLocalJsonLeaf(keys, parentuuid, collectionname, json, uuidfieldname);
	}
	
	
	// read and save
	// (async methods)
	_getUrlRootKey(url) {
		var result;
		try {
			if (url.startsWith('https://'))
				result = url.substring(8);
			else if (url.startsWith('http://'))
				result = url.substring(7);
			else
				result = url.split('://')[1];
			
			result = result.split('/')[0];

			result = result.replace(/-/g, '.');
		}
		catch(e) {
			result = '';
		}
		
		
		return result;
	}
	
	readLocalJson(keys, bForceRefresh, callback) {
		if (!bForceRefresh)
		return this.localStorage.readLocalJson(keys, bForceRefresh, callback);
		
		var session = this.session;
		
		// no overload for local sessions
		if (!session.xtraconfig.rest_server_url)
		return this.localStorage.readLocalJson(keys, bForceRefresh, callback);
		
		//var user = session.getSessionUserObject();
		//var useruuid = (user ? user.getUserUUID() : 'shared');

		var rootkey = this._getUrlRootKey(session.xtraconfig.rest_server_url);
		var _ckeys = ['remote.storage', rootkey].concat(keys); // to separate for different domains (like browser does, just on domain, not full url)
		
		// we spawn a promise to read from localStorage with refresh
		var localpromise = new Promise((resolve, reject) => {
			this.localStorage.readLocalJson(keys, true, (err, res) => {
				if (err) reject(err); else resolve(res);
			});
		});
		
		// we fork a save of the result in our client
		localpromise
		.then((json) => {
			if ( (json) && (!this.storagelocks.islocked(_ckeys)))
				return this.clientStorage.saveClientSideJson(_ckeys, json);
		})
		.catch(err => {
			console.log('error saving synchronized content: ' + err);
		});

		// we read in our client storage
		return new Promise((resolve, reject) => {
			this.clientStorage.readClientSideJson(_ckeys, (err, res) => {
				if (err) resolve(null); else resolve(res);
			});
		})
		.then((json) => {
			// and link with local read if we don't find anything
			if (json)
				return json;
			else
				return localpromise;
		})
		.then((json) => {
			if (callback)
				callback(null, json);
			
			return json;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
		});
	}
	
	saveLocalJson(keys, json, callback) {
		var session = this.session;
		
		// no overload for local sessions
		if (!session.xtraconfig.rest_server_url)
			return this.localStorage.saveLocalJson(keys, json, callback); 

		// otherwise
		var rootkey = this._getUrlRootKey(session.xtraconfig.rest_server_url);
		var _ckeys = ['remote.storage', rootkey].concat(keys); // to separate for different domains (like browser does, just on domain, not full url)
		
		return new Promise((resolve, reject) => {
			// we save in our client storage
			this.storagelocks.lock(_ckeys);
			
			this.clientStorage.saveClientSideJson(_ckeys, json, (err, res) => {
				if (err) resolve(null); else resolve(res);
			});
		})
		.then(() => {
			// then in normal local storage
			return new Promise((resolve, reject) => {
				this.localStorage.saveLocalJson(keys, json, (err, res) => {
					if (err) reject(err); else resolve(res);
				});
			});
		})
		.then((json) => {
			this.storagelocks.unlock(_ckeys);

			if (callback)
				callback(null, json);
			
			return json;
		})
		.catch(err => {
			this.storagelocks.unlock(_ckeys);
			
			if (callback)
				callback(err, null);
		});

	}

}

if ( typeof GlobalClass !== 'undefined' && GlobalClass ) {
	GlobalClass.registerModuleClass('synchronized-storage', 'LocalStorage', LocalStorage);
}
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('synchronized-storage', 'LocalStorage', LocalStorage);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('synchronized-storage', 'LocalStorage', LocalStorage);
}