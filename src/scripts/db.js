/**
 * db.js | OrangeUI DB 0.1
 * @date 12.21.2011
 * @author Kevin Kinnebrew
 * @dependencies commons
 * @description handles data requests and persistence
 */
 
Orange.add('db', function(O) {


	/* abstract data access */
	
	O.ModelDefinition = O.define({
	
		type: 'model',
	
		initialize: function(config) {
		
			this.id = config.id;
			this.name = config.name;
			this.fields = config.fields;
			this.path = config.path;
			this.mapItem = config.mapItem;
			this.mapItems = config.mapItems;
			
			// setup event target
			this._eventTarget = new O.EventTarget(null, this);
		
		},
		
		get: function() {
				
			var args = arguments,
					id = (typeof args[0] !== 'function') ? args[0] : null,
					success = (!id) ? args[0] : args[1],
					failure = (!id) ? args[1] : args[2];
			
			// call map function if it exists
			var successItemFunc = function(data) {
			
				// process return data
				data = this._processData($.parseJSON(data));
				
				// call success function
				success.call(this, new O.Item(this, data));
				
				// fire changed event
				this.fire('get', {
					action: action,
					ids: [id],
					data: data
				});
				
			};
			
			// call map function if it exists
			var successItemsFunc = function(data) {
										
				// process return data
				data = this._processItems($.parseJSON(data));
							
				// call success function
				success.call(this, new O.Collection(this, data));
				
				// fire changed event
				this.fire('datachange', {
					action: 'get',
					ids: data.ids,
					data: {}
				});
				
			};
						
			// fetch data
			$.ajax({
			  url: (!id) ? this.path : this.path + id,
			  contentType: 'text/json',
			  type: 'GET',
			  success: (!id) ? $.proxy(successItemsFunc, this) : $.proxy(successItemFunc, this),
			  error: failure
			});
		
		},
		
		save: function(object, success, failure) {
		
			// calculation action
			var action = (object[this.id ? this.id : 'id'] !== null) ? 'update' : 'create';
		
			// call map function if it exists
			var successFunc = function(data) {
			
				// process data
				data = this._processData($.parseJSON(data));
				
				// call success function
				success.call(this, data);
				
				// get id
				var id = data[this.id ? this.id : 'id'];
				
				// fire changed event
				this.fire('datachange', {
					action: action,
					id: id,
					data: data
				});
				
			};
			
			// check if object has been saved
			if (action === 'update') {
			
				$.ajax({
				  url: (!id) ? this.path : this.path + id,
				  contentType: 'text/json',
				  type: 'PUT',
				  data: object,
			  	success: $.proxy(successFunc, this),
				  error: failure
				});
			
			} else {
			
				$.ajax({
				  url: this.path,
				  contentType: 'text/json',
				  type: 'POST',
				  data: object,
				  success: $.proxy(successFunc, this),
				  error: failure
				});

			}
		
		},
		
		delete: function(object, success, failure) {
		
			var key = data[this.id ? this.id : 'id'],
					id = (typeof object === 'object') ? object[key] : object;
			
			// call map function if it exists
			var successFunc = function(data) {
				
				// parse response
				data = $.parseJSON(data);
				
				// clear from local storage
				O.Storage.remove(this.name + '[' + id + ']');
				
				// call success function
				success.call(this, data);
				
				// fire changed event
				this.fire('datachange', {
					action: 'delete',
					id: id,
					data: {}
				});
				
			};
			
			$.ajax({
			  url: (!id) ? this.path : this.path + id,
			  contentType: 'text/json',
			  type: 'DELETE',
			  data: object,
				success: $.proxy(successFunc, this),
			  error: failure
			});
		
		},
		
		_processItems: function(data) {
		
			// map the data if applicable
			if (typeof this.mapItems === 'function') data = this.mapItems(data);
						
			// setup output
			var models = [];
			var ids = [];
			
			// get the id field
			var id = this.id ? this.id : 'id';
						
			// map individual items			
			for (var i = 0, len = data.length; i < len; i++) {
				var model = this._processData(data[i]);
				if (typeof model === 'object') {
					ids.push(model[id]);
					models.push(model);
				}
			}
		
			// return models
			return {
				ids: ids,
				models: models
			};
			
		},
		
		validate: function(data) {
		
			// compare data to our model
			for(var field in this.fields) {
			
				// get source field name
				var source = this.fields[field].name;
				var nullable = (typeof this.fields[field].nullable !== undefined) ? this.fields[field].nullable : true;
				var isNull = (typeof data[source] === 'undefined' || data[source] === '');
			
				// continue if field is not defined
				if (isNull && !nullable) return false;
			} 
		
		},
		
		_processData: function(data) {
		
			// map the data if applicable
			if (typeof this.mapItem === 'function') data = this.mapItem(data);
			
			// create output object
			var model = {};
												
			// map to our model
			for(var field in this.fields) {
			
				// get source field name
				var source = this.fields[field].name;
				var value = (typeof data[source] !== 'undefined') ? data[source] : undefined;
			
				// continue if field is not defined
				if (value === undefined) {
					console.warn("[WARN] Could not parse JSON field '" + field + "' for " + this.name);
					continue;
				}
			
				// set field on output
				model[field] = value;
			}
									
			// get the id of the return
			var id = data[this.id];
			if(id === undefined) throw 'Invalid ID field for ' + this.name;
									
			// push to local storage
			O.Storage.set(this.name + '[' + id + ']', model);
			
			// return model
			return model;
		
		},
		
		on: function() {
			return this._eventTarget.on.apply(this._eventTarget, arguments);
		},
		
		detach: function() {
			return this._eventTarget.detach.apply(this._eventTarget, arguments);
		},
		
		fire: function() {
			return this._eventTarget.fire.apply(this._eventTarget, arguments);
		},
	
	});
	
	O.Model = (function() {
	
		var _models = {};
				
		return {
		
			define: function(def) {
				var c = O.extend(O.ModelDefinition, def), type = def.type;
				if(typeof type === 'undefined') throw "Error: Class not named";
				return _views[type] = c;
			},
		
			register: function(config) {
				if (typeof config === 'undefined' || typeof config.name === 'undefined') throw "Error: Model definition invalid";
				if (typeof config.type !== 'undefined' && typeof (model = _models[config.type]) !== 'undefined') {
					var c = new model(config);
				}
				else var c = new O.ModelDefinition(config);
				return _models[config.name] = c;
			},
			
			get: function(name) {
				var model;
				if (typeof (model = _models[name]) !== 'undefined') {
					return model;
				} else throw "Error: Model '" + name + "' not found";
			}
		
		};
	
	})();


	/* data containers */

	O.Collection = O.define({
		
		model: null,
		data: [],
		
		initialize: function(model, data) {
		
			// set attributes
			this.model = model;
			this.data = data.models;
			this.ids = data.ids;
		
		},
		
		get: function(id) {
		
			var key = this.model.id;
			var finalKey = _.find(this.model.fields, function(data) { return data.name == key });
			return _.find(this.data, function(data) { return data[key] == id });
		
		},
		
		intersect: function(array) {
			var int = _.intersection(this.ids, array);
			return int.length;
		},
		
		destroy: function() {
		
		}
			
	});
		
	O.Item = O.define({
	
		model: null,
		item: {},
	
		initialize: function(model, data) {
		
			// set attributes
			this.model = model;
			this.item = data;
		
		},
		
		destroy: function() {
		
		}
	
	});
	
}, [], '0.1');