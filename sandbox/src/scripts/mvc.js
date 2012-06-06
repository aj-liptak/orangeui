/**
 * mvc.js | OrangeUI 0.2
 * @date 12.21.2011
 * @author Kevin Kinnebrew
 * @dependencies commons, jquery-1.7.2
 * @description base mvc model, view, and controllers
 */

Orange.add('mvc', function(O) {
	
	O.App = (function() {
	
		var _apps = {},
				_active = null,
				keyFilterRegex = /[^A-Za-z0-9_\[\]]/g;
		
		return {
		
			register: function(name, config) {
				
				// store app config in dictionary
				_apps[name.replace(keyFilterRegex)] = config;
				
				window.onload = function() {
					
					O.App.init(name); // initialize app
				
				}
				
			},
			
			init: function(name) {
								
				var config = {}, 
						name = name.replace(keyFilterRegex);
			
				// look up configuration
				if(typeof _apps[name] !== 'undefined') {
					config = _apps[name];
				} else throw 'Invalid application configuration';
				
				// load required modules
				for(var i = 0, len = config.required.length; i < len; i++) {
					O.Loader.loadModule(config.required[i]);
				}
			
				// bind event listeners
				O.Cache.on('statusChange', function(e) {
					if(e.data == 1) {
						O.Location.goOnline();
						O.Storage.goOnline();
						if(config.location) O.Location.getLocation(function() {});
						O.Log.info("Application went online");
					} else {
						O.Log.info("Application went offline");
						O.Location.goOffline();
						O.Storage.goOffline();
					}
				});
				
				// start modules
				O.Cache.init(config.poll);
				O.Storage.init();
				
				// set active application
				_active = name;
				
				// fetch root view
				var root = $('[data-root="true"]'),
				type = root.attr('data-control');
				
				// remove root attribute
				root.removeAttr('data-root');
				
				// load view
				var c = O.View.load(type);
				var controller = new c(null, root);
				controller.onLoad();
									
			},
			
			config: function() {
			
				if (_active != null) {
					return _apps[_active];
				} else throw 'Invalid application configuration';
			
			}
		
		};
	
	})();
	
	O.View = (function() {
	
		var _views = {};
		
		return {
		
			define: function(def) {
				var c = O.extend(O.ViewController, def), type = def.getType();
				c.prototype.typeList = type;
				if(typeof type === 'undefined') throw "Error: View not named";
				return _views[type] = c;
			},
			
			extend: function(base, def) {
				var c = O.extend(base, def), type = def.getType();
				c.prototype.typeList += ' ' + type;
				if(typeof type === 'undefined') throw "Error: View not named";
				return _views[type] = c;
			},
			
			load: function(name) {
				var view;
				if (name === 'view') {
					return O.ViewController;
				} else if (typeof (view = _views[name]) !== 'undefined') {
					return view;
				} else throw "Error: View '" + name + "' not found";
			}
		
		};
	
	})();
	
	O.Controller = O.define({
		
		initialize: function() {},
		
		destroy: function() {}
		
	});

	O.ViewController = O.extend(O.Controller, {
	
		initialize: function(parent, target) {
		
			// set vars
			var that = this, views = [], forms = [], elements = [];
			
			// setup instance vars
			this.views = {};
			this.forms = {};
			this.elements = {};
			this.data = {};
			this.eventTarget = new O.EventTarget(parent, this);
			
			// validate target
			if (typeof target !== 'undefined') {
				this.target = $(target);
				var _target = $(target).get(0);
			} else throw 'Invalid target';
			
			// check if parent
			this.parent = (typeof parent !== 'undefined') ? parent : null;
			if (this.parent === null) this.target.removeAttr('data-root');
						
			// validate arguments
			for (var i = 0, len = _target.attributes.length; i < len; i++) {
				if (_target.attributes[i].name.match(/data-/)) {
					this.data[_target.attributes[i].name.replace(/data-/, '')] = _target.attributes[i].value;
				}
			}
			
			// finds immediate descendant children
			var childFunc = function(selector) {
				var childList = [];
				this.target.find(selector).each(function() {
					var include = false, parent = $(this).parent();
					while (parent.length !== 0 && !include) {
						if ($(parent).not($(that.target)).length === 0) {
							include = true; break;
						} else if ($(parent).not('[data-control]').length === 0) {
							include = false; break;
						} parent = $(parent).parent();
					}
					if (include) childList.push(this);
				});
				return childList;
			}
			
			// populate child views
			views = childFunc.call(this, '[data-control]');
			forms = childFunc.call(this, 'form');
			elements = childFunc.call(this, '[data-name]:not([data-control])');
			
			// process views
			for (var i = 0, len = views.length; i < len; i++) {
				var view = $(views[i]), name = view.attr('data-name'),
						type = view.attr('data-control'), path = view.attr('data-template'),
						isRemote = (typeof path !== 'undefined' && path.length > 0);
				
				if (isRemote) {
					var source = O.TemplateManager.loadView(path);
					view.html($(source).html());
					cloneAttributes(source, view);
					view.removeAttr('data-template');
				}
				
				var c = O.View.load(type);
				this.views[name] = new c(this, view);
			}
			
			// process forms
			for (var i = 0, len = forms.length; i < len; i++) {
				var form = $(forms[i]), name = form.attr('name'), child = new O.Form(form);
				this.forms[name] = child;
			}
			
			// process elements
			for (var i = 0, len = elements.length; i < len; i++) {
				var el = $(elements[i]), name = el.attr('data-name');
				if (typeof name !== 'undefined' && name.length > 0) this.elements[name] = el.removeAttr('data-name');
			}
			
			// process types
			this.target.addClass(this.getClasses());
			this.target.removeAttr('data-control').removeAttr('data-name');
			
			// store for debugging
			this.type = this.getType();
			this.name = this.data.name;
							
		},
		
		getType: function() {
			return 'ui-view';
		},
		
		getClasses: function() {
			var classes = typeof this.typeList !== 'undefined' ? this.typeList : '';
			return classes + ' ' + this.data.name;
		},

		getTriggers: function() {
			return [];
		},
		
		getBindings: function() {
			return {};
		},
		
		
		onWillLoad: function() {},
		
		onDidLoad: function() {},
		
		onLoad: function() {
			
			this.onWillLoad();
			
			for (var name in this.views) {
				this.views[name].onLoad();
			}
			
			// get events
			var views = this.getBindings();
			
			// bind events
			for (var view in views) {
				var events = views[view];
				for (var event in events) {
					var func = (typeof events[event] === 'function') ? events[event] : null;
					if (func === null) {
						var name = event.charAt(0).toUpperCase() + event.slice(1);
						func = (events[event] === true && typeof this['on' + name] === 'function') ? this['on' + name] : null;
					}
					if (func !== null) this.getView(view).on(event, $.proxy(func,  this));
				}
			}
			
			this.onDidLoad();
		
		},
		
		onWillUnload: function() {},
		
		onDidUnload: function() {},
		
		onUnload: function() {
		
			this.onWillUnload();

			// unbind view events
			for (var view in this.views) {
				this.getView(view).detach();
			}
			
			// unbind form events
			for (var form in this.forms) {
				this.getForm(form).detach();
			}
			
			// unbind element events
			for (var el in this.elements) {
				this.getElement(el).unbind(); // jQuery dependency
			}
			
			// unload children
			for (var name in this.views) {
				this.views[name].onUnload();
			}
			
			this.onDidUnload();
		
		},
		
		getView: function(name) {
			if (name instanceof O.UIView) return name;
			else if (typeof this.views[name] !== 'undefined') return this.views[name];
			throw 'Error: View "' + name + '" not found';
		},
		
		getForm: function(name) {
			if (this.forms[name] instanceof O.Form) return this.forms[name];
			throw 'Error: Form "' + name + '" not found';
		},

		getElement: function(name) {
			if (typeof this.elements[name] !== 'undefined') return this.elements[name];
			throw 'Error: Element "' + name + '" not found';
		},				
		
		
		hasView: function(name) {
			return typeof this._views[name] !== 'undefined';
		},
		
		hasElement: function(name) {
			return typeof this._elements[name] !== 'undefined';
		},
		
		hasForm: function(name) {
			return typeof this._forms[name] !== 'undefined';
		},
		

		on: function(event, callback, context) {
			var proxy = (typeof context !== 'undefined') ? function() { callback.apply(context, arguments); } : callback;
			return this.eventTarget.on.call(this.eventTarget, event, proxy);
		},
		
		detach: function(event, callback) {
			return this.eventTarget.detach.apply(this.eventTarget, arguments);
		},
		
		fire: function(event, data) {
			return this.eventTarget.fire.apply(this.eventTarget, arguments);
		},
		
		
		bindData: function(item, live) {
			O.Binding.bindData(this.target, item);
			if (live && item instanceof O.Item) {
				var id = item.getId(),  model = item.getModel();
				model.on('datachange', function(d) {
					item.mergeChanges(d);
					if (item.isChanged) O.Binding.bindData(this.target, item);
				}, this);
			}
		},
		
		toString: function() {
			return '[' + this.getType() + ' ' + this.data.name + ']';
		},
				
		destroy: function() {
			for (var name in this._views) {
				this.views[name].destroy();
			}
			for (var name in this._forms) {
				this.forms[name].destroy();
			}
			for (var name in this._elements) {
				delete this.elements[name];
			}
			delete this.target;
			delete this.parent;
			delete this._eventTarget;
		}
	
	});
	
	O.Binding = (function() {
		
		return {
		
			bindData: function(node, item) {
			
				// check for the data format
				if (item instanceof O.Item) {
					var id = item.id(), data = item.toObject();
				} else if (typeof item === 'object') {
					var id = null, data = item;
				}
				else throw 'Invalid data item';
				
				if (id !== null) node.attr('itemid', id);
				
				// parse all the data fields
				for (var field in data) {
					var el = node.find('[itemprop="' + field + '"]');
					var childList = [];
					node.find('[itemprop="' + field + '"]').each(function() {
						var include = false, parent = $(this).parent();
						while (parent.length !== 0 && !include) {
							if ($(parent).not(node).length === 0) {
								include = true; break;
							} else if ($(parent).not('[itemscope]').length === 0) {
								include = false; break;
							} parent = $(parent).parent();
						}
						if (include) childList.push($(this));
					});
																							
					if (childList.length > 0) {
						for(var i = 0, len = childList.length; i < len; i++) {
							if (data[field] instanceof Array || data[field] instanceof O.Collection) {
								O.Binding.bindList(childList[i], data[field]);
							} else if (typeof data[field] === 'object' || data[field] instanceof O.Item) {
								O.Binding.bindData(childList[i], data[field]);
							} else childList[i].text(data[field]);
						}
					}
				}
			},
			
			bindList: function(node, list) {
						
				// check for the data format
				if (list instanceof O.Collection) {
					var data = list.toArray();
				} else if (list instanceof Array) {
					var data = list;
				}
				else throw 'Invalid data collection';
			
				var template = node.find('[itemscope]');
				var itemscope = $(template).attr('itemscope');
				
				// validate attribute exists
				if (typeof itemscope !== 'undefined' && itemscope !== false) {
					node.html('');
					for(var i=0, len = data.length; i < len; i++) {
						var instance = template.clone();
						O.Binding.bindData(instance, data[i]);
						node.append(instance);
					}
				}
			}
		}
	
	})();
	
	O.UIView = O.View.define({
		
		getType: function() {
			return 'ui-view';
		}
		
	});

	O.Form = O.define({
	
		initialize: function(target) {
			
			// set vars
			var that = this, name = $(target).attr('name');
			
			// set instance vars
			this.fields = {};
			this.target = target;

			// find all form fields
			$(target).find('input, select, textarea, button .ui-input').each(function() {
				var fieldName = $(this).attr('name');
				that.fields[fieldName] = $(this);
			});
			
		},
		
		getField: function(name) {
			if (typeof this.fields[name] !== 'undefined') {
				return this.fields[name];
			} else {
				throw "Error: Form field '" + name + "' not found";
			}
		},
		
		setField: function(name, value) {
			try {
				this.getField(name).val(value);
			} catch(e) {
				console.log('[WARN] Field "' + name +'" could not be fetched');
			}
		},
		
		getData: function() {
			var data = {};
			for (var field in this.fields) {
				var val = this.fields[field].val(), type = this.fields[field].attr('type');
				if (typeof val !== undefined && val !== null && type !== 'submit' && type !== 'button') {
					data[field] = val;
				}
			}
			return data;
		},
		
		setData: function(item) {
			var data = item;
			if (item instanceof O.Item) data = item.toObject();
			for (var field in this.fields) {
				if (typeof data[field] !== undefined && data[field] !== null) {
					this.fields[field].val(data[field]);
				}
			}
		},
		
		detach: function() {
			for (var name in this.fields) {
				this.fields[name].detach();
			}
		},
		
		destroy: function() {
			for (var name in this.fields) {
				delete this.fields[name];
			}
		}
		
	});
	
	O.DB = (function() {
	
		var _sources = {},
				_active = {},
				_registered = {
					'cache': { type: 'local', path: '' },
					'create': { type: 'local', path: '' },
					'update': { type: 'local', path: '' },
					'delete': { type: 'local', path: '' },
					'pending': { type: 'local', path: '' }
				};
		
		return {
		
			define: function(def) {
				var c = Class.extend(def), type = def.getType();
				if(typeof type === 'undefined') throw "Error: Data source not named";
				return _sources[type] = c;
			},
			
			extend: function(base, def) {
				var c = O.extend(base, def), type = def.getType();
				if(typeof type === 'undefined') throw "Error: Data source not named";
				return _sources[type] = c;
			},
			
			register: function(name, config) {
				_registered[name] = config;
			},
			
			load: function(name) {
				var source;
				if (_registered.hasOwnProperty(name)) {
					var reg = _registered[name];
					if (!_active.hasOwnProperty(name)) {
						if (typeof _sources[reg.type] !== 'undefined') _active[name] = new _sources[reg.type](name, reg);
					}
					if (_active.hasOwnProperty(name)) {
						return _active[name];
					} else throw "Error: Data source '" + name + "' could not be loaded";
				}
				else throw "Error: Data source '" + name + "' not found";
			}
		
		};
	
	})();
		
		
	O.Model = (function() {
	
		var _models = {};
				
		return {
		
			define: function(def) {
				var c = O.extend(O.ModelDefinition, def), type = def.type;
				if(typeof type === 'undefined') throw "Error: Model not named";
				return _views[type] = c;
			},
		
			register: function(name, config) {
				if (undefined == config || config.hasOwnProperty('type')) throw "Error: Model definition invalid";
				if (typeof (model = _models[config.type]) !== 'undefined') {
					var c = new model(config);
				}
				else var c = new O.ModelDefinition(name, config);
				return _models[name] = c;
			},
			
			get: function(name) {
				var model;
				if (typeof (model = _models[name]) !== 'undefined') {
					return model;
				} else throw "Error: Model '" + name + "' not found";
			}
		
		};
	
	})();

	O.DataSource = O.DB.define({
	
		getType: function() {
			return 'ajax';
		},
		
		supportsModels: function() {
			return false;
		},
		
		isPersistent: function() {
			return false;
		},
	
		initialize: function(name, config) {
			this.name = name;
			this.path = (config.path.charAt(config.path.length-1) == '/') ? config.path : config.path + '/'; // path with ending slash
		},
		
		request: function(config) {
				
			if (O.Cache.isActive() && !O.Cache.isOnline()) {
				O.Log.warn('Could not connect to server');
				return;
			}
		
			var success = (typeof config.success === 'function') ? config.success : null;
			var error = (typeof config.error === 'function') ? config.error : null;
		
			if (typeof config.context !== 'undefined') {
				if (success) success = function() { success.apply(context, arguments); };
				if (error) error = function() { error.apply(context, arguments); }
			}
			
			var req = {
				url: config.url,
				type: config.type
			};
			
			if (config.hasOwnProperty('async')) req.async = config.async;
			if (config.hasOwnProperty('data')) req.data = config.data;
			if (config.hasOwnProperty('contentType')) req.contentType = config.contentType;
			if (success) req.success = success;
			if (error) req.error = error;
			
			req.complete = function(t) {
				O.Log.info('HTTP ' + t.status);
			};
			
			return $.ajax(req).responseText;
		
		}
	
	});
	
	O.RestDataSource = O.DB.extend(O.DataSource, {
	
		getType: function() {
			return 'rest';
		},
		
		supportsModels: function() {
			return true;
		},
		
		isPersistent: function() {
			return false;
		},
		
		request: function(config) {
			this._super(config);
		},
				
		getAll: function(type, success, failure) {
			
			var successFunc = function(data) {
				data = this._processItems(type, data);
				success.call(this, data);
			}
						
			this.request({
				url: this.path + type,
				contentType: 'text/json',
				type: 'GET',
				success: $.proxy(successFunc, this),
				error: failure
			});
		
		},
		
		get: function(type, id, success, failure) {
					
			var successFunc = function(data) {
				data = this.processItem(type, data);
				success.call(this, data);
			}
			
			path = this.path + type;
						
			this.request({
				url: (path.charAt(path.length-1) == '/') ? path + id : path + '/' + id,
				contentType: 'text/json',
				type: 'GET',
				success: $.proxy(successFunc, this),
				error: failure
			});
		
		},
		
		set: function(type, object, id, success, failure) {
		
			var successFunc = function(data) {
				data = this.processItem(type, data);
				success.call(this, data);
			}
			
			var path = (!id) ? this.path + type : (path.charAt(path.length-1) == '/') ? path + id : path + '/' + id;
									
			this.request({
				url: path,
				data: object,
				type: (!id) ? 'POST' : 'PUT',
				dataType: 'text/json',
				success: $.proxy(successFunc, this),
				error: failure
			});
		
		},
		
		remove: function(type, id, success, failure) {
			
			path = this.path + type;
			
			this.request({
				url: (path.charAt(path.length-1) == '/') ? path + id : path + '/' + id,
				type: 'DELETE',
				success: success,
				error: failure
			});
		
		},
		
		processItem: function(path, data) {
			return $.parseJSON(data);
		},
		
		processItems: function(path, data) {
			return $.parseJSON(data);
		},
		
		_processItems: function(path, data) {
			data = this.processItems(path, data);
			var output = [];
			for(var i = 0, len = data.length; i < len; i++) {
				output.push(this.processItem(path, data[i]));
			}
			return output;
		}
	
	});

	O.LocalDataSource = O.DB.extend(O.DataSource, {
	
		initialize: function(name, config) {
			this.name = name;
		},
	
		getType: function() {
			return 'local';
		},
		
		isPersistent: function() {
			return true;
		},
		
		supportsModels: function() {
			return true;
		},
		
		request: function() {},
		
		getAll: function(type, success, failure) {
			try {
				var data = O.Storage.get(this.name + ':' + 'model:' + type);
				if (data == undefined) return {};
				success(data);
				return data;
			} catch(e) {
				failure();
				return false;
			}
		},
		
		get: function(type, id, success, failure) {
			var data = O.Storage.get(this.name + ':' + 'model:' + type);
			if (typeof data[id] !== 'undefined') {
				success(data[id]);
				return data[id];
			}
			else {
				failure();
				return false;
			}
		},
		
		set: function(type, object, id, success, failure) {
			try {
				if (id === null) id = this.nextKey(type);
				var data = O.Storage.get(this.name + ':' + 'model:' + type);
				if (data == undefined) data = {};
				data[id] = object;
				O.Storage.set(this.name + ':' + 'model:' + type, data);
				success(object);
				return object;
			} catch(e) {
				failure();
				return false;
			}
		},
		
		setAll: function(type, data, success, failure) {
			try {
				O.Storage.set(this.name + ':' + 'model:' + type, data);
				success();
				return true;
			} catch(e) {
				failure();
				return false;
			}		
		},
		
		remove: function(type, id, success, failure) {
			try {
				var data = O.Storage.get(this.name + ':' + 'model:' + type);
				delete data[id];
				O.Storage.set(this.name + ':' + 'model:' + type, data);
				success(id);
				return id;
			} catch(e) {
				failure();
				return false;
			}
		},
		
		nextKey: function(type) {
			var size = 0, key, keys = [];
			var obj = O.Storage.get(this.name + ':' + 'model:' + type);
			for (key in obj) {
				if (obj.hasOwnProperty(key) && !isNaN(key)) keys.push(parseInt(key, 10));
			} 
			return (keys.length > 0) ? Math.max.apply(Math, keys) + 1 : 1;
		}
	
	});

	O.ModelDefinition = O.define({
	
		initialize: function(name, config) {
		
			this.id = config.id;
			this.name = name;
			this.fields = config.fields;
			
			this.liveDS = O.DB.load(config.source);
			this.cacheDS = O.DB.load('cache');
			
			this.createDS = O.DB.load('create');
			this.updateDS = O.DB.load('update');
			this.deleteDS = O.DB.load('delete');
			this.pendingDS = O.DB.load('pending');
			
			this.isSyncing = false;
			
			this.eventTarget = new O.EventTarget(null, this);
			this.proxy = $.proxy(this.onStatusChange, this);
			this.isLive = !(O.Cache.isActive() && !O.Cache.isOnline());
			
			for(var field in this.fields) {
				if (this.fields[field].name == this.id) this.key = field;
			}
			
			if (this.key === null) throw "Missing id field in model '" + this.name + "'";
			
			O.Cache.on('statusChange', this.proxy);
			
		},
		
		destroy: function() {
			O.Cache.detach('statusChange', this.proxy);
			this.eventTarget.destroy();
		},
		
		getAll: function(success, error) {
					
			var offlineFunc = function(data) {
						
				// get pending data
				var creates = this.createDS.getAll(),
						updates = this.updateDS.getAll(),
						deletes = this.deleteDS.getAll(),
						pending = this.pendingDS.getAll();
						
			
				// merge creates
				for (var key in creates) {
					data[key] = creates[key];
				}
				
				// merge updates
				for (var key in updates) {
					data[key] = updates[key];
				}
				
				// merge deletes
				for (var key in deletes) {
					delete data[key];
				}
								
				// merge pending
				if (this.isSyncing) {
					for (var key in pending) {
						data[pending[this.id]] = pending[key];
					}
				}
								
				// process data set
				var mappedData = this.mapItems(data);
								
				// call success
				success.call(this, new O.Collection(this, mappedData));
			
			},
			
			onlineFunc = function(data) {
								
				// call offline func
				offlineFunc.call(this, data);
							
				// store back to local storage
				this.cacheDS.setAll(this.name, data);
			
			};
		
			// get all data
			if (!this.isLive) {
				this.cacheDS.getAll(this.name, $.proxy(offlineFunc, this), error);
			} else {
				this.liveDS.getAll(this.name, $.proxy(onlineFunc, this), error);
			}
		
		},
		
		get: function(id, success, error) {
		
			var offlineFunc = function(data) {
				
				// process data set
				var mappedData = this.mapItem(data);
				
				// call success
				success.call(this, new O.Item(this, mappedData));
			
			},
			
			onlineFunc = function(data) {
			
				// call offline func
				offlineFunc.call(this, data);
			
				// store back to local storage
				this.cacheDS.set(this.name, id, data);
			
			};
		
			// get item
			if (!this.isLive) {
				
				var data = null;
				
				// get pending data
				var creates = this.createDS.getAll(),
						updates = this.updateDS.getAll(),
						deletes = this.deleteDS.getAll(),
						pending = this.pendingDS.getAll();
			
				// merge pending
				if (this.isSyncing) {
					for (var i in pending) {
						if (typeof pending[i][this.id] !== 'undefined' && pending[i][this.id] == id) {
							data = pending[i];
						}
					}
				}
			
				// merge changes
				if (typeof creates[id] !== 'undefined') {
					data = creates[id];
				} else if (typeof updates[id] !== 'undefined' && data == null) {
					data = updates[id];
				} else if (typeof deletes[id] !== 'undefined') {
					throw "Cannot fetch deleted item";
				}

				// fetch data if not pending
				if (!data) this.cacheDS.get(this.name, id, $.proxy(offlineFunc, this), error);
				
				// otherwise use pending data
				offlineFunc.call(this, data);
				
			} else {
				this.liveDS.get(this.name, id, $.proxy(onlineFunc, this), error);
			}
		
		},
		
		set: function(object, success, error) {
		
			var id = object.hasOwnProperty(this.key) ? object[this.key] : null,
					mappedObject = this.unmapItem(object);
		
			var offlineFunc = function(data, unsaved) {
				
				// process data set
				var mappedData = this.mapItem(data);
				
				// call success
				var item = new O.Item(this, mappedData);
				if (unsaved) item.markUnsaved();
				else item.markSaved();
				
				// call success
				success.call(this, item);
				
				// fire changed event
				this.fire('datachange', [
					{ type: 'set', data: item }
				]);
			
			},
			
			onlineFunc = function(data) {
			
				// call offline func
				offlineFunc.call(this, data);
			
				// store back to local storage
				this.cacheDS.set(this.name, data[this.key], data);
			
			};
		
			// set item
			if (!this.isLive) {
				
				var func = function(data) {
					offlineFunc.call(this, data, true);
				};
				
				if (!id) {
				
					// store to pending creates
					this.createDS.set(this.name, mappedObject, null, func, error);
				
				} else if (this.isSyncing) {
				
					// get deletes
					var deletes = this.deleteDS.getAll();
				
					if (typeof deletes[id] !== 'undefined') {
						throw 'Cannot update already removed item';
					} else {
						this.pendingDS.set(this.name, mappedObject, null, func, error); // set unkeyed object
					} 
								
				} else {
				
					var data = null;
						
					// get pending data
					var creates = this.createDS.getAll(),
							deletes = this.deleteDS.getAll();
				
					// merge changes
					if (typeof creates[id] !== 'undefined') {
						this.createDS.set(this.name, mappedObject, id, func, error);
					} else if (typeof deletes[id] !== 'undefined') {
						throw 'Cannot update already removed item';
					} else {
						this.updateDS.set(this.name, mappedObject, id, func, error);
					} 
					
				}
				
			} else {
				this.liveDS.set(this.name, mappedObject, (!id ? null : id), $.proxy(onlineFunc, this), error);						
			}
		
		},
		
		remove: function(key, success, error) {
		
			var id = (key !== 'object' && object.hasOwnProperty(this.key)) ? object[this.key] : key;
		
			var offlineFunc = function(data) {
			
				// call success function	
				success.call(this, true);			
			
				// fire changed event
				this.fire('datachange', [
					{ type: 'remove', data: id }
				]);
			
			},
			
			onlineFunc = function(data) {
			
				// call offline func
				offlineFunc.call(this, data);
			
				// store back to local storage
				this.cacheDS.remove(this.name, id);
			
			};
		
			if (!this.isLive) {
				
				var creates = this.createDS.getAll(),
						updates = this.updateDS.getAll(),
						deletes = this.deleteDS.getAll();
			
				// merge changes
				if (typeof creates[id] !== 'undefined') {
					this.createDS.remove(this.name, id);
				} else if (typeof updates[id] !== 'undefined') {
					this.updateDS.remove(this.name, id);
				}
				
				if (typeof deletes[id] !== 'undefined') {
					throw 'Cannot delete already removed item';
				} else {
					this.deleteDS.set(this.name, {}, id);
				}
				
				offlineFunc.call(this, true);
				
			} else {
			
				// update live source
				this.liveDS.remove(this.name, id, $.proxy(onlineFunc, this), error);
			
			}
		
		},
		
		mapItem: function(data) {
		
			// create output object
			var model = {};
												
			// map to our model
			for(var field in this.fields) {
			
				// get source field name
				var source = this.fields[field].name;
				var value = (data.hasOwnProperty(source)) ? data[source] : undefined;
			
				// continue if field is not defined
				if (value === undefined) {
					console.warn("[WARN] Could not parse JSON field '" + field + "' for " + this.name);
					continue;
				}
			
				// set field on output
				model[field] = value;
			}
			
			// return model
			return model;
		
		},
		
		mapItems: function(data) {
		
			// setup output
			var models = [];
						
			// map individual items			
			for (var i = 0, len = data.length; i < len; i++) {
				var model = this.mapItem(data[i]);
				if (typeof model === 'object') {
					models.push(model);
				}
			}
		
			// return models
			return models;
		
		},
		
		unmapItem: function(data) {
		
			// create output object
			var data = {};
												
			// map to our model
			for (var field in this.fields) {
			
				// skip id if null
				if (this.key == field && !object.hasOwnProperty(this.key)) {
					continue;
				}
			
				// get source field name
				var source = this.fields[field].name;
				var value = (typeof object[field] !== 'undefined') ? object[field] : undefined;
						
				// continue if field is not defined
				if (value === undefined && !this.fields[field].nullable) {
					console.warn("[WARN] Could missing data for field '" + field + "' for " + this.name);
					continue;
				}
			
				// set field on output
				data[source] = value;
			}
									
			// return model
			return data;
		
		},
		
		onStatusChange: function(e) {
	
			if (e.data == 1 && !this.isSyncing) {				
				this.onSync();				
			} else {
				if (this.isSyncing) {
					this.onSyncFailure.call(this);
				} else {
					this.isLive = !(O.Cache.isActive() && !O.Cache.isOnline());
				}
			}
		
		},
		
		onSync: function() {
		
			var deltas = [];
			
			this.isSyncing = true;
		
			var createSuccessFunc = function(data, id) {
						
				// process data set
				var mappedData = this.mapItem(data);
				
				// create item
				var item = new O.Item(this, mappedData);
				
				// remove from pending
				this.createDS.remove(this.name, id);
				
				// store back to local storage
				this.cacheDS.set(this.name, data, item.getId());
				
				// set sync delta
				deltas.push({ type: 'sync', data: item, originalId: id, newId: item.getId() });
				
				// check status
				this.syncCount--;
				this.checkSyncStatus();
			
			};
			
			var updateSuccessFunc = function(data) {
			
				// process data set
				var mappedData = this.mapItem(data);
				
				// create item
				var item = new O.Item(this, mappedData);
				
				// remove from pending
				this.updateDS.remove(this.name, item.getId());
				
				// store back to local storage
				this.cacheDS.set(this.name, data, item.getId());
				
				// set sync delta
				setDeltas.push({ type: 'set', data: item });
				
				// check status
				this.syncCount--;
				this.checkSyncStatus();
			
			};
			
			var deleteSuccessFunc = function(id) {
				
				// remove from pending
				this.deleteDS.remove(this.name, id);
				
				// store back to local storage
				this.cacheDS.remove(this.name, id);
				
				// set sync delta
				setDeltas.push({ type: 'remove', id: id });
				
				// check status
				this.syncCount--;
				this.checkSyncStatus();
			
			};
		
			var creates = this.createDS.getAll(),
					updates = this.updateDS.getAll(),
					deletes = this.deleteDS.getAll();
		
			this.syncCount = creates.length + updates.length + deletes.length;
				
			for (var id in creates) {
				this.liveDS.set(this.name, creates[id], null, $.proxy(function(data) {				
					var key = id;
					createSuccessFunc.call(this, data, key);				
				}, this), this.onSyncFailure);			
			}
			
			for (var id in updates) {
				this.liveDS.set(this.name, updates[id], null, $.proxy(function(data) {				
					var key = id;
					updateSuccessFunc.call(this, data, key);				
				}, this), this.onSyncFailure);		
			}
			
			for (var id in deletes) {
				this.liveDS.remove(this.name, id, null, $.proxy(function(data) {				
					var key = id;
					deleteSuccessFunc.call(this, key);				
				}, this), this.onSyncFailure);	
			}			
		
		},
		
		onSyncSuccess: function(e) {
		
			this.isSyncing = false;
			this.isLive = !(O.Cache.isActive() && !O.Cache.isOnline());
		
			// push all pending data to server
			OrangeUI.Log.info("Unsaved data pushed to server.");
		
		},
		
		onSyncFailure: function(e) {
		
			// push all pending data to server
			OrangeUI.Log.info("Could not push data to server. Retry?");
					
		},
		
		checkSyncStatus: function(e) {
		
			// if all items are synced
			if (this.syncCount == 0) {
				
				// get pending entries
				var pending = this.pendingDS.getAll();
				
				// if there are pending items
				if (pending.length > 0) {
				
					// push pending to the cache
					for(var i in pending) {
						
						if (pending.hasOwnProperty(this.id)) var id = pending[this.id];
						else throw "Pending item missing id";
						
						// push pending to update queue
						this.updateDS.set(this.name, pending, id);
						
						// remove from pending queue
						this.pendingDS.remove(this.name, id);
					}
					
					// resync changes
					this.onSync();
					
				} else {
					this.onSyncSuccess.call(this);
				}
				
			}
		
		},
		
		on: function() {
			return this.eventTarget.on.apply(this.eventTarget, arguments);
		},
		
		detach: function() {
			return this.eventTarget.detach.apply(this.eventTarget, arguments);
		},
		
		fire: function() {
			return this.eventTarget.fire.apply(this.eventTarget, arguments);
		}
	
	});
	
	
	O.Collection = O.define({
	
		initialize: function(model, data) {
		
			// set values
			this.model = model;
			this.data = data; // list keyed by id
			this.isChanged = false;
		
		},
		
		destroy: function() {
			this.data = {};
			delete this.model;
			delete this.data;
		},
		
		getModel: function() {
			return this.model;
		},
		
		count: function() {
			return this.data.length;
		},
		
		mergeChanges: function(deltas) {
		
			this.isChanged = false;
			
			// merge deltas
			for(var i = 0, len = deltas.length; i < len; i++) {
				
				// for syncs
				if (deltas[i].type == 'sync') {
					if (typeof this.data[deltas[i].originalId] === 'undefined') continue;
					delete this.data[deltas[i].originalId];
					this.data[deltas[i].newId] = deltas[i].item;
				} else if (deltas[i].type == 'set') {
					if (typeof this.data[deltas[i].item.getId()] === 'undefined') continue;
					this.data[deltas[i].item.getId()] = deltas[i].item;
				} else if (deltas[i].type == 'remove') {
					if (typeof this.data[deltas[i].id] === 'undefined') continue;
					delete this.data[deltas[i].id];
				}
				
				this.isChanged = true;
			}
		
		},
		
		toObject: function() {
			return this.data;
		},
		
		toArray: function() {
			var items = [];
			for (var key in this.data) {
				items.push(this.data[key]);
			}
			return items;
		},
		
		get: function(id) {
			return (this.data.hasOwnProperty(id)) ? this.data[id] : false; 
		},
		
		markUpdated: function() {
			this.isChanged = false;
		}
	
	});
	
	O.Item = O.define({
	
		initialize: function(model, data) {
		
			// set values
			this.model = model;
			this.data = data;
			this.isUnsaved = false;
			this.isChanged = false;
		
		},
		
		destroy: function() {
			delete this.model;
			this.data = {};
			delete this.data;
		},
		
		getId: function() {
			return this.data[this.model.key];
		},
		
		getModel: function(da) {
			return this.model;
		},
		
		mergeChanges: function(item) {
			for(var field in this.model.fields) {
				if (item.get(field) != this.data[field]) {
					this.isChanged = true;
					break;
				}
			}
		},
		
		isUnsaved: function() {
			return this.isUnsaved;
		},
		
		markUnsaved: function() {
			this.isUnsaved = true;
		},
		
		markSaved: function() {
			this.isUnsaved = false;
		},
		
		toObject: function() {
			return this.data;
		},
		
		get: function(field) {
			return this.data[field];
		},
		
		set: function(field, value) {
			this.data[field] = value;
		},
		
		clear: function(field) {
			delete this.data[field];
		},
		
		markUpdated: function() {
			this.isChanged = false;
		}
	
	});
	
	O.Browser = (function() {
	
		var BrowserDetect = {
		
			init: function () {
				this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
				this.version = this.searchVersion(navigator.userAgent)
					|| this.searchVersion(navigator.appVersion)
					|| "an unknown version";
				this.OS = this.searchString(this.dataOS) || "an unknown OS";
				
				// check if mobile
				var useragent = navigator.userAgent.toLowerCase();
				if( useragent.search("iphone") > 0)
				    this.isMobile = true; // iphone
				else if( useragent.search("ipod") > 0)
				    this.isMobile = true; // ipod
				else if( useragent.search("android") > 0)
				    this.isMobile = true; // android
				else if( useragent.search("ipad") > 0)
				    this.isMobile = true; // android
				else this.isMobile = false;
				
			},
			
			searchString: function (data) {
				for (var i=0;i<data.length;i++)	{
					var dataString = data[i].string;
					var dataProp = data[i].prop;
					this.versionSearchString = data[i].versionSearch || data[i].identity;
					if (dataString) {
						if (dataString.indexOf(data[i].subString) != -1)
							return data[i].identity;
					}
					else if (dataProp)
						return data[i].identity;
				}
			},
			
			searchVersion: function (dataString) {
				var index = dataString.indexOf(this.versionSearchString);
				if (index == -1) return;
				return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
			},
			
			dataBrowser: [
				{
					string: navigator.userAgent,
					subString: "Chrome",
					identity: "Chrome"
				},
				{ 	string: navigator.userAgent,
					subString: "OmniWeb",
					versionSearch: "OmniWeb/",
					identity: "OmniWeb"
				},
				{
					string: navigator.vendor,
					subString: "Apple",
					identity: "Safari",
					versionSearch: "Version"
				},
				{
					prop: window.opera,
					identity: "Opera",
					versionSearch: "Version"
				},
				{
					string: navigator.vendor,
					subString: "iCab",
					identity: "iCab"
				},
				{
					string: navigator.vendor,
					subString: "KDE",
					identity: "Konqueror"
				},
				{
					string: navigator.userAgent,
					subString: "Firefox",
					identity: "Firefox"
				},
				{
					string: navigator.vendor,
					subString: "Camino",
					identity: "Camino"
				},
				{		// for newer Netscapes (6+)
					string: navigator.userAgent,
					subString: "Netscape",
					identity: "Netscape"
				},
				{
					string: navigator.userAgent,
					subString: "MSIE",
					identity: "Explorer",
					versionSearch: "MSIE"
				},
				{
					string: navigator.userAgent,
					subString: "Gecko",
					identity: "Mozilla",
					versionSearch: "rv"
				},
				{ 		// for older Netscapes (4-)
					string: navigator.userAgent,
					subString: "Mozilla",
					identity: "Netscape",
					versionSearch: "Mozilla"
				}
			],
			dataOS : [
				{
					string: navigator.platform,
					subString: "Win",
					identity: "Windows"
				},
				{
					string: navigator.platform,
					subString: "Mac",
					identity: "Mac"
				},
				{
					   string: navigator.userAgent,
					   subString: "iPhone",
					   identity: "iPhone/iPod"
			    },
				{
					string: navigator.platform,
					subString: "Linux",
					identity: "Linux"
				}
			]
		
		};
		
		BrowserDetect.init();
		
		return {
			browser: BrowserDetect.browser,
			version: BrowserDetect.version,
			os: BrowserDetect.OS,
			isMobile: BrowserDetect.isMobile
		}
	
	})();

}, [], '0.2');