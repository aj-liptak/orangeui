(function(Orange) {

  var Controller;
  
  
  /** Dependencies */
  
  var Browser = Orange.Browser;
  var Element = Orange.Element;
  var Queue = Orange.Queue;
  var View = Orange.View;


  function cloneAttributes(source, destination) {
    destination = $(destination).eq(0);
    source = $(source).get(0);
    for (var i = 0; i < source.attributes.length; i++) {
      var a = source.attributes[i];
      destination.attr(a.name, a.value);
    }
  }
  
  function stripAttributes(obj, match) {
    var target = $(obj).get(0), attrs = {}, names = [];
    for (var i = 0, len = target.attributes.length; i < len; i++) {
      if (target.attributes[i].name.match(match)) {
        attrs[target.attributes[i].name.replace(match, '')] = target.attributes[i].value;
        names.push(target.attributes[i].name);
      }
    }
    for (var j = 0; j < names.length; j++) {
      $(obj).removeAttr(names[j]);
    }
    return attrs;
  }
  
  
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
      this._target = $(target);
      
      // store app
      this._app = app;
      
      // store params
      this._params = {};
      
      // get models
      var models = this.getModels();
      
      // load models
      for (var model in models) {
        this.setModel(model, this._app.createModel(models[model]));
      } 
      
      if (!this._target || this._target.length === 0 && typeof this.getDefaultView === 'function') {
        this._target = View.get(this.getDefaultView());
      }
      
      // store source
      this._source = this._target.outerHTML();
      
      // prevent bubbling
      this._ignoreEvents = ['load', 'appear', 'disappear', 'unload'];
            
      // store attributes
      this._attrs = this.setupAttributes();
      
      // store children
      this._views = this.setupViews();
      this._elems = this.setupElements();
      
      // store states
      this._loaded = false;
      this._visible = false;
      this._running = false;
      
      // event queue
      this._loadEvts = [];
      this._unloadEvts = [];
      this._showEvts = [];
      this._hideEvts = [];
      
      // queue
      this._queue = [];
      this._state;
      
      // remove target if it exists
      if (typeof this._target === 'object') {
        this._target.addClass('hidden');
      }
      
      // call setup
      this.setup();
      
      // mark initialized
      this._initialized = true;
      
      //console.log('Controller Initialized: "' + this.attr('name'));
      
    },
    
    
    /** Route Management */
    
    getRoutes: function() {
      return {};
    },
    
    getDefaultRoute: function() {
      return null;
    },
    
    getDefaultView: function() {
      return null;
    },
    
    setRoute: function(states) {
      var first = false;
      if (!states || states.length === 0) {
        if (this.getDefaultRoute()) {
          states = [this.getDefaultRoute()];
        } else {
          states = [];
        }
      }
      var original = states.slice(0);
      var state = states.shift();
      var statesArray = states.slice(0);
      var current = this.state || this.getDefaultRoute();
      var callbacks = this.getRoutes();
      if (Object.keys(callbacks).length === 0) {
        for (var i in this.views) {
          this.getView(i).setRoute(original.slice(0));
        }
        return;
      }
      if (callbacks.hasOwnProperty(state)) {
        console.log('Setting Route: "/' + state + (current ? ('" from "' + current) : '') + '" for "' + this.attr('name') + '"'); 
        callbacks[state].call(this, current, statesArray);
      }
      this.state = state;
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
      if (!this._models) {
        this._models = {};
      }
      this._models[name] = model;
    },
    
    getModel: function(name) {
      if (this._models.hasOwnProperty(name)) {
        return this._models[name];
      } else {
        throw 'Model Not Found';
      }
    },
    
    
    /** Queuing */
    
    add: function(fn, args, wait) {
      this._queue.push({fn: fn, args: args, wait: wait});
      if (!this._running) { this.next(); }
      return this;
    },

    next: function() {
      this._running = true;
      var next = this._queue.shift();
      if (next) {
        next.fn.apply(this, next.args);
        if (next.fn === this._setState || next.fn === this._clearState) {
          this._process = setTimeout(proxy(function() {
            this.next();
          }, this), next.wait);
        }
      } else {
        this._running = false;
      }
    },
    
    stop: function() {
      this._queue = [];
      if (this._process) {
        clearTimeout(this._process);
        this.next();
      }
      return this;
    },
    
    
    /** State Management */
    
    setState: function(state, wait) {
      return this.add(this._setState, [state], wait || 0);
    },
    
    clearState: function(wait) {
      return this.add(this._clearState, [], wait || 0);
    },
    
    _setState: function(state, force) {
      if ((this.hasState(state) || !this._loaded) && !force) {
        return;
      }
      this._target.removeClass(this._stateName);
      this._target.addClass(state);
      this._stateName = state;
    },
    
    _clearState: function() {
      this._target.removeClass(this._stateName);
      this._stateName = null;
    },
    
    hasState: function(state) {
      return this._stateName === state;
    },
    
    
    /* CSS Properties */

    addClass: function() {
      this._target.addClass.apply(this._target, arguments);
    },
    
    removeClass: function() {
      this._target.removeClass.apply(this._target, arguments);
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
    
    appendTo: function(target) {
      return this.add(this._appendTo, [target]);
    },
    
    append: function(target) {
      return this.add(this._append, [target]);
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
      
      this._loadEvts.push(this.on("_load", this.onLoad, this));
      this._loadEvts.push(this.on("_loaded", this.onDidLoad, this));
            
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
      
      this._showEvts.push(this.on("_appear", this.onAppear, this));
      this._showEvts.push(this.on("_appeared", this.onDidAppear, this));
      
      // call onWillAppear
      this.onWillAppear();
      
    },
    
    _hide: function() {
      
      // return if already hidden or hiding
      if (!this._visible) {
        this.next();
        return;
      }
      
      this._hideEvts.push(this.on("_disappear", this.onDisappear, this));
      this._hideEvts.push(this.on("_disappeared", this.onDidDisappear, this));
      
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
      
      this._unloadEvts.push(this.on("_unload", this.onUnload, this));
      this._unloadEvts.push(this.on("_unloaded", this.onDidUnload, this));
      
      // call onWillUnload
      this.onWillUnload();
      
    },
    
    _appendTo: function(target) {
      if (target instanceof Controller) {
        target._target.append(this._target);
      } else {
        target.append(this._target);
      }
      this.next();
    },
    
    _append: function(target) {
      if (target instanceof Controller) {
        this._target.append(target._target);
      } else {
        this._target.append(target);
      }
      this.next();
    },
    
    _remove: function() {
      this._target.remove();
      this.next();
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
      
      // unbind events
      for (var i = 0, len = this._loadEvts.length; i < len; i++) {
        this._loadEvts[i].detach();
      }
      
      this._loadEvts = [];
            
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
      
      // unbind events
      for (var i = 0, len = this._unloadEvts.length; i < len; i++) {
        this._unloadEvts[i].detach();
      }
      
      this._unloadEvts = [];
      
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
        var eventName;
        
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
            eventName = touchclick;
          } else {
            eventName = event;
          }
          if (typeof events[event] === 'function') {
            if (delegate && node instanceof Element) {
              node.on(eventName, delegate, proxy(events[event], this));
            } else if (node instanceof Controller) {
              node.on(eventName, events[event], this);
            } else {
              node.on(eventName, proxy(events[event], this));
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
  
      // unbind events
      for (var i = 0, len = this._showEvts.length; i < len; i++) {
        this._showEvts[i].detach();
      }
      
      this._showEvts = [];
      
      // fire public appear event
      this.fire('appear');
      
      // call next
      this.next();

    },
    
    onWillDisappear: function() {
            
      // unbind events
      for (var view in this._views) { this.getView(view).detach(); }
      for (var elem in this._elems) { this.getElement(elem).off(); }
            
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
      
      // unbind events
      for (var i = 0, len = this._hideEvts.length; i < len; i++) {
        this._hideEvts[i].detach();
      }
      
      this._hideEvts = [];
      
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
    
    find: function() {
      return this._target.find.apply(this._target, arguments);
    },
    
    
    /** Reference Handling */
    
    getView: function(name) {
      if (name instanceof Controller) { return name; }
      else if (typeof this._views[name] !== 'undefined') { return this._views[name]; }
      throw new Error('Invalid Request: View "' + name + '" not found');
    },
    
    getElement: function(name) {
      if (typeof this._elems[name] !== 'undefined') { return this._elems[name]; }
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
    
    addView: function(c, control, name, template, location) {
      if (this.hasView(name)) {
        throw new Error('Invalid Request: Controller ' + name + ' already exists');
      }
      if (!c) {
        throw 'Invalid Controller';
      }
      var v = View.get(template, control, name);
      this._views[name] = new c(this, v, this.app);
      if (location === 'body') {
        $('body').append(this._views[name]._target);
      } else {
        this._target.append(this._views[name]._target);
      }
    },
    
    removeView: function(name) {
      if (this.hasView(name)) {
        this._views[name].hide().unload().destroy();
        delete this._views[name];
      }
    },
    
    
    /** Parameters */
    
    setParam: function(name, value) {
      this._params[name] = value;
    },
    
    getParam: function(name) {
      return this._params[name];
    },
    
    clearParam: function(name) {
      delete this._params[name];
    },
    
    bindData: function(name, entity, multi) {
      var target = (name === '$target') ? this._target : this.getElement(name);
      var children = target.childrenTo('[itemprop]');
      var prop;
      var data = {};
      if (entity instanceof Orange.Entity) {
        data = entity.toObject();
      } else {
        data = entity;
      }
      for (var i=0; i<children.length; i++) {
        prop = children[i].attr('itemprop');
        if (prop) {
          if (children[i].get(0).tagName === 'IMG') {
            if (data.hasOwnProperty(prop)) {
              children[i].attr('src', data[prop]);
            }
          } else if (children[i].get(0).tagName === 'SELECT' || children[i].get(0).tagName === 'INPUT') {
            if (data.hasOwnProperty(prop)) {
              children[i].val(data[prop]);
            }
          } else {
            if (data.hasOwnProperty(prop)) { children[i].text(data[prop]);
            } else if (!multi) { children[i].text(''); }
          }
        }
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
      
      var attrs = stripAttributes(this._target, /data-/);
            
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
    
    setupViews: function() {
      
      if (this._initialized) { return; }
      
      var children = this._target.childrenTo('[data-control]');
      var views = {}, name, type, source, path, c;
      
      for (var i = 0; i < children.length; i++) {
      
        type = children[i].attr('data-control');
        name = children[i].attr('data-name');
        path = children[i].attr('data-template');
                    
        if (path && path.length > 0) {
          source = View.get(path, type, name);
          children[i].html(source.html());
          cloneAttributes(source, children[i]);
          children[i].removeAttr('data-template');
        }
        
        name = name || type;
        
        c = Controller.get(type);
        views[name] = new c(this, children[i], this._app);
        
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
          elements[name] = children[i];
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
  
  }).include(Events);
  
  
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