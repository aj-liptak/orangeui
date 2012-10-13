(function(Orange) {

  var Controller;
  
  
  /** Dependencies */
  
  var Browser = Orange.Browser;
  var Element = Orange.Element;
  var Queue = Orange.Queue;
    
  
  /** Controller Definition */
  
  /**
   * @class Controller
   */
  Controller = Class.extend({
    
    initialize: function(parent, target, app) {
      
      // mark uninitialized
      this._initialized = false;
      
      // store parent
      this._parent = parent || null;
      
      // store target
      this._target = new Element(target);
      
      // store app
      this._app = app;
      
      // get models
      var models = this.getModels();
      
      // load models
      for (var model in models) {
        this.setModel(model, this._app.createModel(models[model]));
      }
      
      // store source
      this._source = this._target.outerHTML();
      
      // store children
      this._views = this.setupViews();
      this._elems = this.setupElements();
      
      // store attributes
      this._attrs = this.setupAttributes();
      
      // setup events
      this.setupTransitions();
      
      // store states
      this._loaded = false;
      this._visible = false;
      
      // remove target if it exists
      if (typeof this._target === 'object') {
        this._target.addClass('hidden');
      }
      
      // call setup
      this.setup();
      
      // mark initialized
      this._initialized = true;
      
      console.log('Controller "' + this.attr('name') + '" initialized');
      
    },
    
    
    /** Configuration */
    
    getType: function() {
      return 'view';
    },
    
    getBindings: function() {
      return {};
    },
        
    getRoutes: function() {
      return {};
    },
    
    getModels: function() {
      return {};
    },
    
    setup: function() {
    
    },
    
    
    /* Model Management */
    
    setModel: function(name, model) {
      this._models[name] = model;
    },
    
    getModel: function(name) {
      if (this._models.hasOwnProperty(name)) {
        return this._models[name];
      } else {
        throw 'Model Not Found';
      }
    },
    
    
    /** Chainable State Handlers */
      
    load: function() {
      return this.add(this._load);
    },
    
    show: function() {
      return this.add(this._show);
    },
    
    hide: function() {
      return this.add(this._hide);
    },
    
    unload: function() {
      return this.add(this._unload);
    },
    
    remove: function() {
      return this.add(this._remove);
    },
    
    
    /** Private State Handlers */
    
    _load: function() {
      
      // return if already loading
      if (this._loaded) {
        this.next(); // fire the next call in the queue
        return;
      }
            
      // call onWillLoad
      this.onWillLoad();
      
    },
    
    _show: function() {
      
      // return if already visible
      if (this._visible) {
        this.next();
        return;
      } else if (!this._loaded) {
        throw new Error('Invalid Request: Cannot show unloaded Controller');
      }

      // call onWillAppear
      this.onWillAppear();
      
    },
    
    _hide: function() {
      
      // return if already hidden or hiding
      if (!this._visible) {
        this.next();
        return;
      }
      
      // call onWillDisappear
      this.onWillDisappear();
      
    },
    
    _unload: function() {
      
      // return if already unloading
      if (!this._loaded) {
        this.next();
        return;
      } else if (this._visible) {
        throw new Error('Invalid Request: Cannot unload visible Controller');
      }
      
      // call onWillUnload
      this.onWillUnload();
      
    },
    
    
    /** Private State Handlers */
    
    onWillLoad: function() {

      // fire load event
      this.fire('_load');
      
    },
    
    onLoad: function() {
      
      var count = Object.keys(this._views).length;
      
      // load children
      if (count === 0) {
        this.fire('_loaded');
      } else {
        for (var name in this._views) {
          var view = this._views[name];
          view.once('load', proxy(function() {
            count--;
            if (count === 0) {
              this.fire('_loaded');
            }
          }, this));
          view.load();
        }
      }

    },
    
    onDidLoad: function() {
      
      // mark as loaded
      this._loaded = true;
      
      // fire public load event
      this.fire('load');
      
      // run next item
      this.next();
    
    },
    
    onWillUnload: function() {
      
      // fire unload event
      this.fire('_unload');
    
    },
    
    onUnload: function() {
      
      var count = Object.keys(this._views).length;
      
      // unload children
      if (count === 0) {
        this.fire('_unloaded');
      } else {
        for (var name in this._views) {
          var view = this._views[name];
          view.once('unload', proxy(function() {
            count--;
            if (count === 0) {
              this.fire('_unloaded');
            }
          }, this));
          view.unload();
        }
      }
      
    },
    
    onDidUnload: function() {
    
      // mark unloaded
      this._loaded = false;
      
      // fire public unload event
      this.fire('unload');
      
      // call next
      this.next();
    
    },
    
    
    // display transitions
    
    onWillAppear: function() {
            
      // bind events
      var bindings = this.getBindings();
      
      // store replacements
      var replaced;
      var matches;
      
      function applyBindings(pattern, events) {
        
        // parse pattern
        var target = pattern.match(/^([#$\.A-Za-z0-9\-_]+)(?:\(([#$\.A-Z0-9a-z\-_]+)\))?/);
        
        var node = target[1];
        var delegate = target[2];
        
        var touchclick = Browser.touch ? 'touchend' : 'click';
        
        // if $target
        if (node === '$target') {
          node = this._target;
        } else if (node === '$body') {
          node = $('body');
        } else if (this.hasView(node)) {
          node = this.getView(node);
        } else if (this.hasElement(node)) {
          node = this.getElement(node);
        } else {
          return;
        }

        // bind events
        for (var event in events) {
          if (event === 'touchclick') {
            event = touchclick;
          }
          if (typeof events[event] === 'function') {
            if (delegate && node instanceof Element) {
              node.on(event, delegate, events[event], this);
            } else {
              node.on(event, events[event], this);
            }
          }
        }
      
      }
      
      // bind events
      for (var binding in bindings) {
        applyBindings.call(this, binding, bindings[binding]);
      }
      
      // remove hidden class
      this._target.removeClass('hidden');
      
      // fire appear event
      this.fire('_appear');
      
    },
    
    onAppear: function(e) {
                  
      var count = Object.keys(this._views).length;
      
      // show children
      if (count === 0) {
        this.fire('_appeared');
      } else {
        for (var name in this._views) {
          var view = this._views[name];
          view.once('appear', proxy(function() {
            count--;
            if (count === 0) {
              this.fire('_appeared');
            }
          }, this));
          view.show();
        }
      }
      
    },
    
    onDidAppear: function(e) {

      // mark as visible
      this._visible = true;
      
      // fire public appear event
      this.fire('appear');
      
      // call next
      this.next();

    },
    
    onWillDisappear: function() {

      // unbind events
      for (var view in this._views) { this.getView(view).detach(); }
      for (var elem in this._elems) { this.getElement(elem).unbind(); }
      
      // fire disappear event
      this.fire('_disappear');
      
    },
    
    onDisappear: function(e) {
            
      var count = Object.keys(this._views).length;
      
      // hide children
      if (count === 0) {
        this.fire('_disappeared');
      } else {
        for (var name in this._views) {
          var view = this._views[name];
          view.once('disappear', proxy(function() {
            count--;
            if (count === 0) {
              this.fire('_disappeared');
            }
          }, this));
          view.hide();
        }
      }
      
    },
    
    onDidDisappear: function(e) {
      
      // remove hidden class
      this._target.addClass('hidden');
      
      // mark as hidden
      this._visible = false;
      
      // fire public disappear event
      this.fire('disappear');
      
      // call next
      this.next();
    
    },
    
    
    /** Attribute Management */
    
    attr: function() {
      var args = arguments;
      if (args.length === 1) {
        return this._attrs.hasOwnProperty(args[0]) ? this._attrs[args[0]] : false;
      } else if (args.length === 2) {
        this._attrs[args[0]] = args[1];
      }
    },
    
    
    /** Reference Handling */
    
    getView: function(name) {
      if (name instanceof Controller) { return name; }
      else if (typeof this._views[name] !== 'undefined') { return this._views[name]; }
      throw new Error('Invalid Request: View "' + name + '" not found');
    },
    
    getElement: function(name) {
      if (this._elems[name] instanceof Element) { return this._elems[name]; }
      throw new Error('Invalid Request: Element "' + name + '" not found');
    },
    
    
    /** Reference Validation */
  
    hasView: function(name) {
      return typeof this._views[name] !== 'undefined';
    },
    
    hasElement: function(name) {
      return typeof this._elems[name] !== 'undefined';
    },
    
    
    /** Adhoc References */
    
    addView: function(control, name, template) {
      if (this.hasView(name)) {
        throw new Error('Invalid Request: Controller ' + name + ' already exists');
      }
      var c = Controller.get(control);
      var v = View.get(template, control, name);
      if (c) {
        this._views[name] = new c(this, v, this.app);
      }
      this._target.append(this._views[name]._target);
      return this._views[name];
    },
    
    removeView: function(name) {
      if (this.hasView(name)) {
        this._views[name].hide().unload().destroy();
        delete this._views[name];
      }
    },
    
    
    /** Connection Management */
  
    goOnline: function() {
      for (var name in this._views) { this._views[name].goOnline(); }
    },
    
    goOffline: function() {
      for (var name in this._views) { this._views[name].goOffline(); }
    },
    
    
    /** Utilities */
    
    setupAttributes: function() {
          
      if (this._initialized) { return; }
      
      var attrs = this._target.stripAttrs(/data-([A-Za-z\-_]+)/);
            
      if (!attrs.hasOwnProperty('name')) {
        attrs.name = attrs.control;
      }

      this._target.addClass('view');
      if (typeof this.typeList !== 'undefined') {
        this._target.addClass(this.typeList);
      }
            
      this._target.addClass(attrs.name);
      
      return attrs;
      
    },
    
    setupTransitions: function() {
            
      if (this._initialized) { return; }
    
      this.on('_load', this.onLoad, this);
      this.on('_loaded', this.onDidLoad, this);
      this.on('_appear', this.onAppear, this);
      this.on('_appeared', this.onDidAppear, this);
      this.on('_disappear', this.onDisappear, this);
      this.on('_disappeared', this.onDidDisappear, this);
      this.on('_unload', this.onUnload, this);
      this.on('_unloaded', this.onDidUnload, this);
      
    },
    
    setupViews: function() {
      
      if (this._initialized) { return; }
      
      var children = this._target.childrenTo('[data-control]');
      var views = {}, name, type, source, path, c;
            
      for (var i = 0; i < children.length; i++) {
      
        type = children[i].attr('data-control');
        name = children[i].attr('data-name') || type;
        path = children[i].attr('data-template');
  
        if (path && path.length > 0) {
          source = View.get(path, type, name);
          children[i].html(source.html());
          children[i].cloneAttrs(source);
          children[i].removeAttr('data-template');
        }
        
        c = Controller.get(type);
        views[name] = new c(this, children[i], this.app);
        
      }
      
      return views;
      
    },
    
    setupElements: function() {
      
      if (this._initialized) { return; }
      
      var children = this._target.childrenTo('[data-name]:not([data-control])');
      var elements = {}, name;
      
      for (var i = 0; i < children.length; i++) {
        name = children[i].attr('data-name');
        if (name.length > 0) {
          elements[name] = new Element(children[i]);
          children[i].removeAttr('data-name').addClass(name);
        }
      }
      
      return elements;
      
    },
    
    toString: function() {
      return '[' + this.getType() + ' ' + this.attr('name') + ']';
    },
    
    destroy: function() {
            
      // destroy views
      for (var view in this._views) { this._views[view].destroy(); delete this._views[view]; }
      for (var elem in this._elems) { this._elems[elem].destroy(); delete this._elems[elem]; }
          
      // clear references
      delete this._views;
      delete this._elems;
      delete this._target;
      delete this._parent;
      delete this._source;
      delete this._queue;
      
    },
  
  }).include(Events).include(Queue);
  
  
  /** Class Methods */
    
  Controller.views = {
    'view': Controller
  };
  
  Controller.extend = function(def) {
    
    if (!def.hasOwnProperty('getType')) {
      throw ('Missing Implementation: Controller missing "getType" implementation');
    }
    
    var control = Class.extend.call(this, def);
    var type = def.getType();
    
    if (Controller.views.hasOwnProperty(type)) {
      throw ('Duplicate Class: Controller "' + type + '" is already defined');
    }
    
    if (control.prototype.typeList) {
      control.prototype.typeList += ' ' + type;
    } else {
      control.prototype.typeList = type;
    }

    control.extend = Controller.extend;
            
    return Controller.views[type] = control;
    
  };
  
  Controller.get = function(name) {
    if (this.views.hasOwnProperty(name)) {
      return this.views[name];
    }
    throw ('Invalid Resource: Controller "' + name + '" not defined');
  };
  
  
  // Exports
  
  Orange.Controller = Controller;
  

}(Orange));