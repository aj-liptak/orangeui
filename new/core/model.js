(function(Orange) {

  var Model;
  
  
  // Class Definition
  
  /**
   * @class Model
   */
  Model = Class.extend({
  
    initialize: function() {},
    
    getServices: function() {
      throw 'Unimplemented Exception';
    },
    
    setService: function(name, service) {
      if (!this._services) {
        this._services = {};
      }
      this._services[name] = service;
    },
    
    getService: function(name) {
      if (this._services.hasOwnProperty(name)) {
        return this._services[name];
      } else {
        throw 'Service Not Found';
      }
    }
  
  });
  
  
  // Exports
  
  Orange.Model = Model;
  

}(Orange));