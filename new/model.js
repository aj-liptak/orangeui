(function(Orange) {

  var Model;
  
  
  // Class Definition
  
  /**
   * @class Model
   */
  Model = Class.extend({
  
    initialize: function() {
      this._services = {};
    },
    
    getServices: function() {
      throw 'Unimplemented Exception';
    },
    
    setService: function(name, service) {
      this._services[name] = service;
    },
    
    getService: function(name) {
      if (this._services[name].hasOwnProperty(name)) {
        return this._services[name];
      } else {
        throw 'Service Not Found';
      }
    }
  
  });
  
  
  // Exports
  
  Orange.Model = Model;
  

}(Orange));