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
      return '';
    },
    
    goOnline: function() {
      this.isOnline = true;
    },
    
    goOffline: function() {
      this.isOnline = false;
    },
    
    request: function(path, method, params, map, success, failure, context) {
      
      if (!success || !failure) {
        throw { type: 'Invalid Request', message: 'Missing callback function' };
      }
      
      map = map || function(data) { return data; };
      context = context || this;
      
      $.ajax({
        url: this.getPrefix() + path,
        type: method,
        timeout: 60000,
        data: params,
        success: function(data) {
          if (data === null) {
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
            clean = map.call(context, data);
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
  
  });
    
  
  // Exports
  
  Orange.Service = Service;
  

}(Orange));