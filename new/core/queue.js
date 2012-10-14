(function(Orange) {

  var Queue;
  
  
  // Mixin Definition
  
  Queue = {
  
    add: function(fn, args, wait) {
      if (!this._queue) {
        this._queue = [];
      }
      this._queue.push({fn: fn, args: args, wait: wait});
      if (!this._running) { this.next(); }
      return this;
    },
    
    next: function() {
      if (!this._queue) {
        this._queue = [];
      }
      this._running = true;
      var next = this._queue.shift();
      if (next) {
        next.fn.apply(this, next.args);
        if (next.wait !== undefined) {
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
    }
    
  };
  
  
  // Exports
  
  Orange.Queue = Queue;
  

}(Orange));