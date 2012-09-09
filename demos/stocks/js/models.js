// ------------------------------------------------------------------------------------------------
// TickerType Models
// ------------------------------------------------------------------------------------------------

Orange.add('tickertype-models', function(exports) {

  var Account;
  var Portfolio;
  var Position;
  var PositionLine;
  var Symbol;
  
  
  // ------------------------------------------------------------------------------------------------
  // Dependencies
  // ------------------------------------------------------------------------------------------------
  
  var Field      = Orange.Model.Field;
  var Model      = Orange.Model;
  
  
  // ------------------------------------------------------------------------------------------------
  // Model Definitions
  // ------------------------------------------------------------------------------------------------
    
  Account = Model.extend({
    
    getType: function() {
      return 'account';
    },
    
    getFields: function() {
      return {
        id:          { type: Field.KEY, numeric: true },
        username:    { type: Field.TEXT },
        firstName:   { type: Field.TEXT },
        lastName:    { type: Field.TEXT },
        createDate:  { type: Field.DATE },
        loginDate:   { type: Field.DATE }
      };
    }
    
  });
  
  Portfolio = Model.extend({
    
    getType: function() {
      return 'portfolio';
    },
    
    getFields: function() {
      return {
        id:          { type: Field.KEY },
        name:        { type: Field.TEXT },
        shortRate:   { type: Field.PERCENT, precision: 0 },
        longRate:    { type: Field.PERCENT, precision: 0 },
        carryLoss:   { type: Field.MONEY, currency: 'USD' }
      };
    }
    
  });
  
  Position = Model.extend({
    
    getType: function() {
      return 'position';
    },
    
    getFields: function() {
      return {
        id:              { type: Field.KEY },
        symbol:          { type: Field.MODEL, model: 'symbol' },
        quantity:        { type: Field.NUMBER },
        cost:            { type: Field.MONEY, currency: 'USD' }
      };
    }
    
  });
  
  PositionLine = Model.extend({
    
    getType: function() {
      return 'position-line';
    },
    
    getFields: function() {
      return {
        id:          { type: Field.KEY },
        symbol:      { type: Field.MODEL, model: 'symbol' },
        tradeDate:   { type: Field.DATE },
        quantity:    { type: Field.NUMBER },
        cost:        { type: Field.MONEY, currency: 'USD' }
      };
    }
    
  });
  
  Symbol = Model.extend({
    
    getType: function() {
      return 'symbol';
    },
    
    getFields: function() {
      return {
        id:            { type: Field.KEY },
        symbol:        { type: Field.TEXT },
        price:         { type: Field.MONEY, currency: 'USD' },
        priceChange:   { type: Field.MONEY, currency: 'USD' },
        percentChange: { type: Field.PERCENT, precision: 2 },
        marketCap:     { type: Field.NUMBER },
        peRatio:       { type: Field.NUMBER },
        lastTradeDate: { type: Field.DATE },
        volume:        { type: Field.NUMBER }
      };
    }
    
  });
  
  
  // ------------------------------------------------------------------------------------------------
  // Exports
  // ------------------------------------------------------------------------------------------------
  
  exports.Account = Account;
  exports.Portfolio = Portfolio;
  exports.Position = Position;
  exports.PositionLine = PositionLine;
  exports.Symbol = Symbol;
    
    
}, []);