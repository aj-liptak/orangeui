// ------------------------------------------------------------------------------------------------
// Global Functions
// ------------------------------------------------------------------------------------------------

function noop() {}

function clone(o) {
  var i, newObj = (o instanceof Array) ? [] : {};
  for (i in o) {
    if (i === 'clone') {
      continue;
    }
    if (o[i] && o[i] instanceof Date) {
      newObj[i] = new Date(o[i]);
    } else if (o[i] && typeof o[i] === "object") {
      newObj[i] = clone(o[i]);
    } else {
      newObj[i] = o[i];
    }
  }
  return newObj;
}

function proxy(fn, context) {
  var that = context;
  return function() {
    return fn.apply(that, arguments);
  };
}

jQuery.fn.childrenTo = function(selector) {
  var childList = [];
  var that = this;
  this.find(selector).each(function() {
    var include = false, parent = $(this).parent();
    while (parent.length !== 0 && !include) {
      if ($(parent).not($(that)).length === 0) {
        include = true; break;
      } else if ($(parent).not('[data-control]').length === 0) {
        include = false; break;
      } parent = $(parent).parent();
    }
    if (include) { childList.push($(this)); }
  });
  return childList;
}

jQuery.fn.outerHTML = function(s) {
  return s ? this.before(s).remove() : jQuery('<p>').append(this.eq(0).clone()).html();
};


// ------------------------------------------------------------------------------------------------
// Core Module
// ------------------------------------------------------------------------------------------------

(function() {

  var Browser;
  var Class;
  var Deferred;
  var Events;
  var EventTarget;
  var EventHandle;
  var Loader;
  var Log;
  var Orange = {};
  
  var keyFilterRegex = /[^A-Za-z:0-9_\[\]]/g;
  var modFilterRegex = /[^A-Za-z\-_]/g;
  
  
  // ------------------------------------------------------------------------------------------------
  // Class Object
  // ------------------------------------------------------------------------------------------------
  
  Class = (function() {
  
    var initializing = false;
    var fnTest = /\b_super\b/;
  
    function ObjectClass() {}
  
    ObjectClass.extend = function(def) {
  
      var prototype;
      var name;
      var _super = this.prototype;
      
      initializing = true;
      prototype = new this();
      initializing = false;
      
      for (name in def) {
        prototype[name] = typeof def[name] === "function" && typeof _super[name] === "function" && fnTest.test(def[name]) ? (function(name, fn) {
          return function() {
            var tmp = this._super;
            this._super = _super[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
          };
        }(name, def[name])) : def[name];
      }
      
      function Class() {
        if (!initializing && this.initialize) {
          this.initialize.apply(this, arguments);
        }
      }
  
      Class.prototype = prototype;
      Class.prototype.constructor = Class;
      
      Class.extend = ObjectClass.extend;
      Class.include = ObjectClass.include;
  
      return Class;
  
    };
  
    ObjectClass.include = function(def) {
    
      var key;
      var value;
      var ref;
      
      if (!def) {
        throw 'Missing definition';
      }
      
      for (key in def) {
        value = def[key];
        if (Array.prototype.indexOf.call(['extend', 'include'], key) < 0) {
          this.prototype[key] = value;
        }
      }
        
      return this;
      
    };
  
    return ObjectClass;
  
  }());
  
  
  // ------------------------------------------------------------------------------------------------
  // EventTarget Object
  // ------------------------------------------------------------------------------------------------
  
  EventTarget = (function() {
  
    function EventTarget(type, currentTarget, target, data) {
    
      this.bubbles         = true;
      this.currentTarget   = currentTarget;
      this.data            = data;
      this.target          = target;
      this.type            = type;
      
    }
    
    EventTarget.prototype.stopPropagation = function() {
      this.bubbles = false;
    };
    
    return EventTarget;
  
  }());
  
  
  // ------------------------------------------------------------------------------------------------
  // EventHandle Object
  // ------------------------------------------------------------------------------------------------
  
  EventHandle = (function() {
  
    function EventHandle(target, ev, call) {
    
      this.call      = call;
      this.ev        = ev;
      this.target    = target;
      
    }
    
    EventHandle.prototype.detach = function() {
    
      this.target.detach(this.ev, this.call);
      
      delete this.target;
      delete this.ev;
      delete this.call;
      
    };
    
    return EventHandle;
  
  }());
  
  
  // ------------------------------------------------------------------------------------------------
  // Events Mixin
  // ------------------------------------------------------------------------------------------------
  
  Events = {
  
    on: function(ev, call, context) {
      
      var fn = typeof context !== 'undefined' ? proxy(call, context) : call;
      
      if (!this._listeners) { this._listeners = {}; }
      if (!this._listeners.hasOwnProperty(ev)) { this._listeners[ev] = []; }
      this._listeners[ev].push(fn);
      
      return new EventHandle(this, ev, fn);
      
    },
    
    once: function(ev, call, context) {
    
      var fn = typeof context !== 'undefined' ? proxy(call, context) : call;
    
      var wrap = function() {
        call.apply(this, arguments);
        this.detach(ev, fn);
      };
      
      this.on(ev, wrap);
      
    },
    
    fire: function(ev, data) {
    
      var parent = this._parent || null;
      var evName = ev;
      
      if (typeof ev === 'string') {
        ev = new EventTarget(ev, this, this, data);
      }
      
      if (typeof ev.type !== 'string') {
        throw "Error: Invalid 'type' when firing event";
      }
      
      if (!this._listeners) { this._listeners = {}; }
      if (this._listeners[ev.type] instanceof Array) {
        var listeners = this._listeners[ev.type];
        for (var i = 0, len = listeners.length; i < len; i++) {
          listeners[i].call(this, ev, data);
        }
      }
      
      var ignore = false;
      
      if (this._ignoreEvents instanceof Array) {
        for (var i=0; i<this._ignoreEvents.length; i++) {
          if (this._ignoreEvents[i] === evName) {
            ignore = true;
          }
        }
      }
      
      if (parent != null && !ignore && ev.bubbles && evName[0] !== '_') {
        ev.currentTarget = this._parent;
        parent.fire.call(parent, ev, data);
      }
      
    },
    
    detach: function(ev, fn) {
        
      var listeners = [];
    
      if (!this._listeners) {
        this._listeners = {};
      }
      
      if (typeof ev === 'undefined') {
        this._listeners = {};
      } else if (this._listeners[ev] instanceof Array) {
        if (typeof fn !== 'undefined') {
          listeners = this._listeners[ev];
          for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i] === fn) {
              listeners.splice(i, 1);
              break;
            }
          }
        } else {
          this._listeners[ev] = [];
        }
      }
      
    }
    
  };
  
  
  // ------------------------------------------------------------------------------------------------
  // Log Object
  // ------------------------------------------------------------------------------------------------
  
  Log = (function() {
  
    var levels = ['OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
    
    function logMessage(type, msg, ex) {
    
      if (this.level > type) {
        this.fire('msg', { message: msg, ex: ex });
        if (ex) {
          console.log('[' + levels[type] + ']', msg, ex); }
        else {
          console.log('[' + levels[type] + ']', msg);
        }
      }
      
    }
  
    function Log() {
      this.level = 1;
    }
    
    for (var i in Events) {
      Log[i] = Events[i];
    }
    
    Log.prototype.setLevel = function(level) {
      
      if (level in levels) {
        switch (level) {
          case 'DEBUG':
            level = 4; break;
          case 'INFO':
            level = 3; break;
          case 'WARN':
            level = 2; break;
          case 'ERROR':
            level = 1; break;
          default:
            level = 0;
        }
      }
      
    };
    
    Log.prototype.debug = function(msg, ex) {
      logMessage.call(this, 4, msg, ex);
    };
    
    Log.prototype.info = function(msg, ex) {
      logMessage.call(this, 3, msg, ex);
    };
    
    Log.prototype.warn = function(msg, ex) {
      logMessage.call(this, 2, msg, ex);
    };

    Log.prototype.error = function(msg, ex) {
      logMessage.call(this, 1, msg, ex);
    };
    
    return Log;
  
  }());
  
  
  // ------------------------------------------------------------------------------------------------
  // Deferred Object
  // ------------------------------------------------------------------------------------------------
  
  Deferred = (function() {
  
    function Deferred(context) {
      this.context = context;
      this.resolved = false;
      this.bindings = [];
    }
    
    Deferred.prototype.resolve = function() {
      this.resolved = true;
      for (var i=0; i<this.bindings.length; i++) {
        this.bindings[i].fn.apply(this.context, this.bindings[i].args);
      }
      this.bindings = [];
    };
    
    Deferred.prototype.then = function(fn, args) {
      if (this.resolved) {
        fn.apply(this.context, args || []);
      } else {
        this.bindings.push({ fn: fn, args: args || [] });
      }
    };
  
    return Deferred;
  
  }());
  
  function when() {
  
    var deferred = new Deferred(this);
    var count = arguments.length;
      
    function resolve() {
      if (--count === 0) {
        deferred.resolve();
      }
    }
    
    for (var i=0; i<arguments.length; i++) {
      arguments[i].then(resolve);
    }
    
    return deferred;
  
  }
  
  
  // ------------------------------------------------------------------------------------------------
  // Browser Object
  // ------------------------------------------------------------------------------------------------
  
  Browser = {
    touch: ('ontouchstart' in window) || (window.hasOwnProperty('DocumentTouch') && document instanceof DocumentTouch),
    location: 'geolocation' in navigator
  };
  
  
  // ------------------------------------------------------------------------------------------------
  // Module Functions
  // ------------------------------------------------------------------------------------------------
  
  function include(name) {
    if (typeof Orange.modules[name] !== undefined) {
      return Orange.modules[name];
    } else {
      throw 'Could not require module';
    }
  }
  
  function config(config) {
    if (config) {
      new Orange.Application(config);
    }
  }
  
  // ------------------------------------------------------------------------------------------------
  // Exports
  // ------------------------------------------------------------------------------------------------
  
  Orange              = this.Orange = { modules: {} };
  Orange.version      = '0.6.0';
  
  Orange.include      = this.include = include;
  Orange.config       = config;
  Orange.when         = when;
  
  Orange.Browser      = Browser = Browser;
  Orange.Class        = this.Class = Class;
  Orange.Deferred     = Deferred;
  Orange.Events       = this.Events = Events;
  Orange.EventHandle  = EventHandle;
  Orange.Log          = this.Log = new Log();
    
  
}.call(this));


// ------------------------------------------------------------------------------------------------
// Array Extensions
// ------------------------------------------------------------------------------------------------

Array.prototype.clone = function() { return this.slice(0); };

Array.prototype.indexOf = [].indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) { return i; }
  }
  return -1;
};

Array.prototype.first = [].first || function() {
  return this.length ? this[0] : null;
};

Array.prototype.last = [].last || function() {
  return this.length ? this[this.length-1] : null;
};