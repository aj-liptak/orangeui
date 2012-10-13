(function(Orange) {

  // Loader Definition
  
  var Loader = (function() {
  
    var Loader = {};
    
    var loaded = {};
    var modules = {};
    var active = {};
    
    Loader.add = function(name, module, requires) {
      
      // split name
      var parts = name.split('.');
      var part;
      var cursor = modules;
      
      // reserved names
      var reserved = [
        'Loader',
        'Events',
        'Class',
        'Model',
        'Location',
        'Application',
        'Binding',
        'Cache',
        'Collection',
        'Controller',
        'View',
        'ViewController',
        'Storage',
        'Form',
        'Service',
        'Log',
        'Deferred',
        'Ajax',
        'Promise',
        'Element'
      ];
      
      // check name
      if (parts.length === 0) {
        throw 'Invalid module name';
      }
      
      // check reserved names
      for (var i=0; i<reserved.length; i++) {
        if (reserved[i] === parts[0]) {
          throw 'Reserved keyword in module name';
        }
      }
      
      // create object
      var module = { name: name, fn: module, requires: requires };
      
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
    
    Loader.register = function(name, value) {
    
      // split name
      var parts = name.split('.');
      var part;
      var cursor = active;
      
      // build graph
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          if (typeof cursor[part] !== 'object') {
            throw 'Overwriting module, already exists';   
          }
          cursor = cursor[part];
        } else {
          cursor[part] = parts.length === 0 ? value : {}; 
          cursor = cursor[part];             
        }
      }
    
    };
    
    Loader.load = function(name) {
    
      // split name
      var parts = name.split('.');
      var part;
      var cursor = modules;
      var requires = {};
      var fn;
      
      // look for module
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          cursor = cursor[part];
        } else {
          throw 'Module not found';  
        }
      }
            
      // load requires
      if (cursor.hasOwnProperty('requires')) {
        Loader.setup(cursor);
      } else if (typeof cursor === 'object') {
        Loader.setupMultiple(cursor);
      }
      
      // load module
      Loader.loadModule(cursor);
      
      // return module
      return cursor;
    
    };
    
    Loader.loadModule = function(module) {
      if (module.hasOwnProperty('fn')) {
        Orange.export = function(object) {
          Loader.register(module.name, object);
        };
        module.fn.call(this, Orange);
        delete Orange.export;
      } else {
        for (var name in module) {
          Loader.loadModule(module[name]);
        }
      }
    }
    
    Loader.isLoaded = function(name) {
    
      // split name
      var parts = name.split('.');
      var part;
      var cursor = loaded;
      
      // look for module
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          cursor = cursor[part];
        } else {
          return false;
        }
        return !!cursor;
      }
      
    };
    
    Loader.markLoaded = function(name) {
      
      // split name
      var parts = name.split('.');
      var part;
      var cursor = loaded;
      
      // look for module
      while (part = parts.shift()) {
        if (cursor.hasOwnProperty(part)) {
          cursor = cursor[part];
        } else {
          cursor[part] = parts.length === 0 ? true : {}; 
          cursor = cursor[part];             
        }
      }
      
    };
    
    Loader.setupMultiple = function(modules) {
      if (!modules) { return; }
      for (var module in modules) {
        if (modules[module].hasOwnProperty('requires')) {
          Loader.setup(modules[module]);
        } else {
          Loader.setupMultiple(modules[module]);
        }
      }
    };
    
    Loader.setup = function(module) {
            
      // get requires
      var requires = module.requires;
      
      // load requires
      for (var i=0; i<requires.length; i++) {
        if (!Loader.isLoaded(requires[i])) {
          Loader.setup(requires[i]);
          Loader.markLoaded(module.name);
        }
      }
      
    };
    
    Loader.require = function(name) {
      
      // split name
      var parts = name.split('.');
      var part;
      var cursor = active;
      
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
      Loader.load(requires[i]);
    }
            
    fn.call(this, Orange);
  
  };
  
  Orange.require = function(name) {
    return Loader.require(name);
  };
  
  // Exports
  
  Orange.Loader = Loader;
  

}(Orange));