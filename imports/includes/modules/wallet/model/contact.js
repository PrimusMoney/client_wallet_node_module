/**
 * 
 */
'use strict';

var Contact = class {
	
	static get CLIENT_CONTACT() { return 0;}
	static get REMOTE_CONTACT() { return 1;}
	
	static get WALLET_CARD_CONTACT() { return 10;}

	constructor(module, session, name, type) {
		this.module = module;
		this.global = module.global;
		
		this.session = session;
		
		this.name = name;
		
		this.contacttype = type;
		
		this.uuid = null;
		this.label = null;
		
		this.address = null;
		this.rsa_public_key = null;
		
		this.email = null;
		this.phone = null;
		
		this.xtra_data = {};
	}
	
	getLocalJson() {
		var json = {};
		
		json.uuid = (this.uuid ? this.uuid : this.getContactUUID());

		json.name = this.name;
		json.type = this.contacttype;
		
		json.label = this.label;
		
		json.address = this.address;
		json.rsa_public_key = this.rsa_public_key;

		json.email = this.email;
		json.phone = this.phone;
		
		json.xtra_data = this.xtra_data;

		return json;
	}
	
	getContactType() {
		return this.contacttype;
	}
	
	getContactUUID() {
		if (this.uuid)
		return this.uuid;
		
		var session = this.session;
		
		if (session)
		this.uuid = session.guid();
		
		return this.uuid;
	}
	
	setContactUUID(uuid) {
		this.uuid = uuid;
	}
	
	getLabel() {
		if (this.label)
			return this.label;
		else
			return this.name;
	}
	
	setLabel(label) {
		this.label = label;
	}
	
	getName() {
		return this.name;
	}
	
	setName(name) {
		this.name = name;
	}
	
	getAddress() {
		return this.address;
	}
	
	setAddress(address) {
		this.address = address;
	}
	
	getRsaPublicKey() {
		return this.rsa_public_key;
	}
	
	setRsaPublicKey(pubkey) {
		this.rsa_public_key = pubkey;
	}
	
	getCryptoKey(session) {
		if (this.cryptokey)
			return this.cryptokey;
		
		this.cryptokey = session.createBlankCryptoKeyObject();
		
		this.cryptokey.setAddress(this.address);
		this.cryptokey.setRsaPublicKey(this.rsa_public_key);
		
		return this.cryptokey;
	}
	
	
	getEmail() {
		return this.email;
	}
	
	setEmail(email) {
		this.email = email;
	}
	
	getPhone() {
		return this.phone;
	}
	
	setPhone(phone) {
		this.phone = phone;
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
	
	_getAccountObject(session) {
		var global = this.global;

		// create account with card address
		var address = this.getAddress();

		var commonmodule = global.getModuleObject('common');
		
		// get account with this address
		var account = session.getAccountObject(address);
		
		return account;
	}
	


	save(callback) {
		// we do an non-atomic save
		var walletmodule = this.module;
		
		return walletmodule._saveContact(this, callback);
	}
	
	
	// static methods
	static readFromJson(walletmodule, session, contactjson) {
		var Contact = walletmodule.Contact;
		
		var name = contactjson.name;
		var type = contactjson.type;
		
		var contact = new Contact(walletmodule, session, name, type);
		
		// set contact's uuid
		if (contactjson.uuid)
			contact.setContactUUID(contactjson.uuid);
		
		contact.setLabel(contactjson.label);
		
		contact.setAddress(contactjson.address);
		contact.setRsaPublicKey(contactjson.rsa_public_key);


		contact.setEmail(contactjson.email);
		contact.setPhone(contactjson.phone);

		contact.xtra_data = (contactjson.xtra_data ? contactjson.xtra_data : {});
		
		return contact;
	}
}


if ( typeof GlobalClass !== 'undefined' && GlobalClass )
	GlobalClass.registerModuleClass('wallet', 'Contact', Contact);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Contact', Contact);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('wallet', 'Contact', Contact);
}
