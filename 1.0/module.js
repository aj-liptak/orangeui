// ------------------------------------------------------------------------------------------------
// Module Class
// ------------------------------------------------------------------------------------------------

/**
 * @module Core
 */
(function(Orange) {

  var Module;
  
  
  // ------------------------------------------------------------------------------------------------
  // Dependencies
  // ------------------------------------------------------------------------------------------------
  
  var Events   = Orange.Events;
  
  
  // ------------------------------------------------------------------------------------------------
  // Class Definition
  // ------------------------------------------------------------------------------------------------
  
  /**
   * The Module class adds class key registration and the Event mixin to
   * the generic class object.
   *
   * @class Module
   * @uses Events
   */
  Module = Class.extend({
    
    /**
     * When implemented, it should return a unique string name to match the
     * class. This allows classes to be looked up by name.
     *
     * @method getType
     * @return {string}  The unique type name of the class.
     */
    getType: function() {
      throw 'Not Implemented Exception: Missing method getType()';
    }
  
  }).includes(Events);
  
  
  /**
   * Allows the lookup of a class by the value of its getType() string.
   *
   * @method find
   * @static
   * @param {string} type  The type string to lookup
   */
  Module.find = function(type) {
  
    if (this._registry.hasOwnProperty(type)) {
      return this._registry[type];
    }
    
    throw 'Module Not Found: Module of type "' + type + '" not found';
  
  };
  
  /**
   * Overrides the default extend method to handle implementation
   * requirements. The module will check to be sure any subclasses
   * implement required methods.
   *
   * @method extend
   * @static
   * @param {object} def  An object of functions and properties.
   * @param {Array} impl  An array of method names that are required.
   * @return {Module}  The newly created module object.
   */
  Module.extend = function(def, impl) {  
    
    // store implementation
    impl = impl || [];
    
    // validate methods
    for (var i=0; i<impl.length; i++) {
      if (!def.hasOwnProperty(impl[i])) {
        throw 'Not Implemented Exception: Missing method ' + impl[i] + '()';
      }
    }
        
    // check for getType() method
    if (!def.hasOwnProperty('getType')) {
      throw 'Not Implemented Exception: Missing method getType()';
    }
    
    // check for duplicates
    if (this._registry.hasOwnProperty(def.getType())) {
      throw 'Duplicate Class: Module ' + type + ' is already defined';
    }
    
    // extend module
    var module = Class.extend.call(this, def);
    
    // store function reference
    module.extend = Module.extend;
    
    // store to registry
    return this._registry[def.getType()] = module;
    
  };
  
  // define registry
  Module._registry = [];
  
  
  // ------------------------------------------------------------------------------------------------
  // Exports
  // ------------------------------------------------------------------------------------------------
  
  Orange.Module = Module;
    
  
}(Orange));

