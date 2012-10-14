Orange.add('UI.Controllers.MultiView', function(O) {
  
  // Definitions
  
  var MultiViewController = O.Controller.extend({
    
    // @region Configuration
    
    getType: function() {
      return 'multi-view';
    },
    
    setup: function() {
      
      var view = this._target.attr('data-default');
      if (this.hasView(view)) {
        this.activeView = this.getView(view);
        this.activeName = view;
        this._target.removeAttr('data-default');
      }
      
      this._super();
      
    },
    
    
    // @region Public Methods
    
    activateView: function(name, ttl) {
  
      if (!this.hasView(name)) {
        throw 'View does not exist';
      }
              
      if (this.activeView === this.getView(name) && this.activeView) {
        return;
      }
      
      this.activeName = name;
  
      function swapViews() {
  
        // hide old view
        this.activeView.hide();
        this.activeView.unload();
  
        this.activeView = this.getView(name);
  
        // show new view
        this.activeView.load();
        this.activeView.show();
  
      }
  
      if (ttl) {
        setTimeout(proxy(function() {
          swapViews.call(this);
        }, this), ttl);
      } else {
        swapViews.call(this);
      }
  
    },
  
  
    // @region State Handlers
  
    onLoad: function() {
      this.activeView.load();
      this.fire("_loaded");
    },
  
    onAppear: function() {
      this.activeView.show();
      this._target.removeClass("hidden");
      this.fire("_appeared");
    },
  
    onDisappear: function() {
      this.activeView.hide();
      this.fire("_disappeared");
    },
  
    onUnload: function() {
      this.activeView.unload();
      this.fire("_unloaded");
    }
  
  });
  

  // Exports
  
  O.export(MultiViewController);

}, []);