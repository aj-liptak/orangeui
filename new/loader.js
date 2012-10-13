(function(Orange) {

  // Loader Definition
  
  var Module = (function() {
  
    function Module(name, fn, requires) {
    
      // type check
      if (typeof fn !== 'function') {
        throw 'Invalid module definition';
      }
    
      // store properties
      this.name = name;
      this.fn = fn;
      this.requires = requires || [];
      
    }
    
    return Module;
    
  }());
  
  var Loader = (function() {
  
    var Loader = {};
    
    var active = {};
    var modules = {};
    
    Loader.add = function(name, fn, requires) {
      
      console.log('Adding Module: ' + name);
      
      // split name
      var parts = name.split('.'), part;
      var cursor = modules;
      
      // create object
      var module = new Module(name, fn, requires);
      
      // build graph
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          if (typeof cursor[part] !== 'object') {
            throw 'Overwriting module, already exists';   
          }
          cursor = cursor[part];
        } else {
          cursor[part] = parts.length === 0 ? module : {}; 
          cursor = cursor[part];             
        }
      }
      
    };
    
    Loader.use = function(name) {
      
      console.log('Using Module: ' + name);
      
      // split name
      var parts = name.split('.'), part;
      var cursor = modules;
      
      // build graph
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          cursor = cursor[part];
        } else {
          throw 'Module not found';  
        }
      }
            
      // load module
      Loader.load(cursor);
      
    };
    
    Loader.load = function(module) {

      if (module instanceof Module) {
        if (Loader.loaded(module.name)) {
          console.log('Duplicate Load', module.name);
          return;
        }
        console.log('Loading Module: ' + module.name);
        for (var i=0; i<module.requires.length; i++) {
          Loader.use(module.requires[i]);
        }
        Orange.export = function(object) {
          Loader.export(module.name, object);
        };
        module.fn.call(this, Orange);
        delete Orange.export;
      } else if (typeof module === 'object') {
        console.log('Loading Module Collection');
        for (var name in module) {
          Loader.load(module[name]);
          console.log('3');
        }
      }
      
    };
    
    Loader.export = function(name, object) {
      
      // split name
      var parts = name.split('.'), part;
      var cursor = active;
      
      // build graph
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          if (typeof cursor[part] !== 'object') {
            throw 'Overwriting module, already exists';   
          }
          cursor = cursor[part];
        } else if (parts.length === 0) {
          cursor[part] = object;
          cursor = cursor[part];
          console.log('Exporting Module: ' + name, active);
        } else {
          cursor[part] = {}; 
          cursor = cursor[part];  
        }
      }
      
    };
    
    Loader.loaded = function(name) {
    
      // split name
      var parts = name.split('.'), part;
      var cursor = active;
            
      // look for module
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          cursor = cursor[part];
        } else {
          return false;
        }
      }
      
      return !!cursor;
      
    };
    
    Loader.require = function(name) {
           
      // split name
      var parts = name.split('.'), part;
      var cursor = active;
      
      console.log('Requiring: ' + name);
       
      // look for module
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          cursor = cursor[part];
        } else {
          throw 'Module not found';
        }
      }
       
      return cursor;
       
    };
  
    return Loader;
  
  }());
    
  Orange.add = function(name, fn, requires) {
    Loader.add(name, fn, requires);
  };
  
  Orange.use = function() {
  
    var requires = Array.prototype.slice.call(arguments);
    var fn = requires.pop();
        
    for (var i=0; i<requires.length; i++) {
      Loader.use(requires[i]);
    }
            
    fn.call(this, Orange);
  
  };
  
  Orange.require = function(name) {
    return Loader.require(name);
  };
  
  // Exports
  
  Orange.Loader = Loader;
  

}(Orange));