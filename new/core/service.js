(function(Orange) {

  var Service;
  
  
  // Class Definition
  
  Service = Class.extend({
  
    initialize: function(path) {
      
      // set online
      this.isOnline = false;
      
      // set local cache
      this.cache = [];
      
      // store config
      this.path = path || '';
      
    },
    
    getPath: function() {
      return this.path;
    },
    
    goOnline: function() {
      this.isOnline = true;
    },
    
    goOffline: function() {
      this.isOnline = false;
    },
    
    request: function(path, method, params, map, success, failure, context) {
      
      if (!success || !failure) {
        throw 'Invalid Request: Missing callback function';
      }
      
      map = map || function(data) { return data; };
      context = context || this;
      var mapContext = this;
            
      $.ajax({
        url: this.getPath() + path,
        type: method,
        timeout: 60000,
        data: params,
        success: function(data) {
          if (data === null || data === 'null') {
            failure.call(context);
            return;
          }
          try {
            data = JSON.parse(data);
          } catch(e) {
            failure.call(context);
            return;
          }
          var clean;
          try {
            clean = map.call(mapContext, data);
          } catch(ex) {
            failure.call(context, ex);
            throw ex;
            return;
          }
          success.call(context, clean);
        },
        error: function() {
          failure.call(context, true);
        }
      });
      
    },
    
    modelOrId: function(model) {
    
      if (model && typeof model === 'object' && model.hasOwnProperty('id')) {
        model = model.id;
      }
      
      if (!model) {
        return;
      } else {
        return model;
      }
      
    },
    
    mapArray: function(items, entity, map) {
    
      var data = [];
      var item;
      
      if (items instanceof Array) {
        for (var i=0; i<items.length; i++) {
          data.push(this.mapObject(items[i], entity, map));
        }
      }
            
      return data;
    
    },
    
    mapObject: function(item, entity, map) {
      var data = {};
      for (var field in map) {
        if (item.hasOwnProperty(map[field])) {
          data[field] = item[map[field]];
        }
      }
      var ent = new entity(data);
      //console.log('Mapping Object: ', ent);
      return ent;
    }
  
  });
    
  
  // Exports
  
  Orange.Service = Service;
  

}(Orange));