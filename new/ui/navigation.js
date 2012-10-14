Orange.add('UI.Controllers.Navigation', function(O) {

  // Definitions
  
  var NavigationController = O.Controller.extend({
      
    // @region Configuration
    
    getType: function() {
      return 'navigation-view';
    },
  
    
    // @region Public Methods
    
    popView: function(duration, callback, context) {
      
      // return if animating
      if (this.animating || this.viewStack.length < 2) {
        return;
      }
      
      // mark animating
      this.animating = true;
      
      // pop from view stack
      var current = this.activeView;
      
      // unload active view
      current._target.addClass('preload').removeClass('active');
      
      // pop from view stack
      this.viewStack.pop();
      
      // get prior view
      var prior = this.viewStack.last();
      
      // load prior view
      prior._target.addClass('active').removeClass('unload');
      prior.show();
      
      // set new active view
      this.activeView = this.viewStack.last();

      // mark not animating
      setTimeout(proxy(function() {
        current.hide().unload();
        this.animating = false;
        if (callback) {
          callback.call(context || this);
        }
      }, this), (duration !== undefined ? (duration+200) : (400+200)));
          
    },
    
    pushView: function(view, duration, callback, context) {
      
      // return if animating
      if (this.animating) {
        return;
      }
            
      // mark animating
      this.animating = true;
      
      // get active view
      var active = this.activeView;
      
      // animate in
      this.getView(view).load().show();
      setTimeout(proxy(function() {
        this.getView(view)._target.addClass('active').removeClass('preload');
        active._target.addClass('unload').removeClass('active');
      }, this), 50);

      // set new active view
      this.activeView = this.getView(view);
      
      // push on view stack
      this.viewStack.push(this.getView(view));
      
      // stop animating
      setTimeout(proxy(function() {
        
        // hide children
        active.hide();
        
        // mark not animating
        this.animating = false;
        
        // execute callback
        if (callback) {
          callback.call(context || this);
        }
        
      }, this), (duration !== undefined ? (duration === 0 ? duration : (duration + 1000)) : (400 + 1000)));
      
    },
    
    popToRootView: function(duration, callback, context) {
            
      // return if animating
      if (this.animating || this.viewStack.length < 2) {
        return;
      }
            
      // mark animating
      this.animating = true;

      // clear the view stack
      for (var i = 1; i < this.viewStack.length-1; i++) {
        this.viewStack[i].unload();
        this.viewStack[i]._target.removeClass('unload').addClass('preload');
      }
      
      // pop from view stack
      var current = this.activeView;
      
      // unload active view
      current._target.addClass('preload').removeClass('active');
      
      // get prior view
      var prior = this.viewStack[0];
      
      // load prior view
      prior._target.addClass('active').removeClass('unload');
      prior.show();
      
      // set new active view
      this.activeView = prior;
      
      // update view stack
      this.viewStack = [this.activeView];

      // mark not animating
      setTimeout(proxy(function() {
        current.hide().unload();
        this.animating = false;
        if (callback) {
          callback.call(context || this);
        }
      }, this), (duration !== undefined ? (duration+200) : (400+200)));
    
    },
    
    
    // @region State Handlers
    
    onLoad: function() {
      
      // setup vars
      this.activeView = null;
      this.viewStack = [];
      
      // load specific views
      var view = this.attr('default');
      
      if (!this.hasView(view)) {
        throw 'Default View Not Found for "' + this.attr('name') + '"';
      }
      
      // load view      
      for (var i in this._views) {
        if (this._views[i].attr('name') === view) {
          this.getView(view)._target.addClass('active');
          this.getView(view).load();
          this.activeView = this.getView(view);
          this.viewStack = [this.activeView];
        } else {
          this._views[i]._target.removeClass('hidden').addClass('preload');
        }
      }
      
      // call super
      this.fire('_loaded');
      
    },

    onAppear: function() {
        
      // get default view
      var view = this.attr('default');

      // show view
      this.activeView.show();
      
      // remove animating class
      setTimeout(proxy(function() {
        this._target.addClass('animated');
      }, this), 1000);
            
      // call super
      this.fire('_appeared');
    
    },
    
    onDisappear: function() {
      
      // hide views
      for (var i = 0; i < this.viewStack.length; i++) {
        this.viewStack[i].hide();
      }
      
      this._target.addClass("hidden");
      
      // fire appeared event
      this.fire('_disappeared');
    
    },
    
    onUnload: function() {
    
      // unload stack
      for (var i = 0; i < this.viewStack.length; i++) {
        this.viewStack[i].unload();
      }
      
      // fire unload
      this.fire('_unloaded');
    
    }
    
  });

  // Exports
  
  O.export(NavigationController);

}, []);