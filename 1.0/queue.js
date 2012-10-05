// ------------------------------------------------------------------------------------------------
// Queue Mixin
// ------------------------------------------------------------------------------------------------

/**
 * @module Core
 */
(function(Orange) {

  var Queue;
  
  
  // ------------------------------------------------------------------------------------------------
  // Mixin Definition
  // ------------------------------------------------------------------------------------------------
  
  /**
   * The Queue makes it simple to easily create chainable methods that
   * can be executed synchronously.
   *
   * @class Queue
   * @static
   */
  Queue = {
    
    /**
     * Adds a new function to the queue for execution.
     *
     * @method add
     * @chainable
     * @param {function} fn  The function to execute.
     * @param {array} args  Optional arguments array to pass the function.
     * @param {int} wait  A duration to wait after the callback finishes.
     * @return {*}  A reference to the class using the mixin.
     */
    add: function(fn, args, wait) {
    
      /**
       * An array containing each item in the queue.
       * @property _queue
       * @type {array}
       * @default []
       * @private
       */
      this._queue = [];
      
      /**
       * An boolean if the queue is executing.
       * @property _running
       * @type {bool}
       * @default false
       * @private
       */
      this._running = false;
      
      /**
       * A reference to the currently executing process.
       * @property _process
       * @type {bool}
       * @private
       */
      this._process = null;
      
      
      // add item to queue
      this._queue.push({fn: fn, args: args, wait: wait});
      
      // if not running continue
      if (!this._running) {
        this.next();
      }
      
      // return for chaining
      return this;
    
    },
    
    /**
     * Clears the queue and returns after the currently executing process
     * has finished. Any waits will be immediately terminated.
     *
     * @method stop
     * @chainable
     * @return {*}  A reference to the class using the mixin.
     */
    stop: function() {
    
      // clear queue
      this._queue = [];
      
      if (this._process) {
        clearTimeout(this._process);
        this.next();
      }
      
      // return for chaining
      return this;
      
    },
    
    /**
     * Calls the next process waiting in the queue. This should be called at
     * the end of every queued function to tell the queue to continue. Missing
     * the **next()** call will pause the queue.
     *
     * @method next
     * @chainable
     * @return {*}  A reference to the class using the mixin.
     */
    next: function() {
    
      // mark running
      this._running = true;
      
      // get next item
      var next = this._queue.shift();
      
      if (next) {
        next.fn.apply(this, next.args);
        if (next.wait) {
          this._process = setTimeout(proxy(function() {
            this.next();
          }, this), next.wait);
        }
      } else {
        this._running = false;
      }
    
    }
  
  };
  
  
  // ------------------------------------------------------------------------------------------------
  // Exports
  // ------------------------------------------------------------------------------------------------
  
  Orange.Queue = Queue;
    
  
}(Orange));

