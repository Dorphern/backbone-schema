/**
 * Schema types: String, Number, Date, Boolean, Array
 *
 * Field Options:
 *   type: Schema Type
 *   enforceType: Boolean
 *   required: Boolean
 *   default: *Same as schema type*
 *   min: Number
 *   max: Number
 *   get: Function
 *   set: Function
 *   validate: [Function]
 *   (unique): Boolean
 */


(function () {

  var isNode    = typeof module !== 'undefined' && module.exports,
      _         = isNode ? require('underscore') : this._,
      Backbone  = isNode ? require('backbone') : this.Backbone;


  function typeCheck(type, value) {
    var typeName  = ( _.isArray(type) ? Array : type.prototype.constructor.name),
        valueType = value.constructor,
        success   = true;

    if (_.isArray(type)) {
      if (valueType !== Array) {
        success = false;
      } else if (type.length === 1) {
        for (var i = 0; i < value.length; i++)
          if (_.isUndefined(value[i]) || (value[i] !== null && value[i].constructor !== type[0])) {
            success = false;
            break;
          }
      }
      typeName = !_.isUndefined(type[0]) ? '['+ type[0].prototype.constructor.name +']' : 'Array';
    } else if (_.isFunction(type) && valueType !== type) {
      success = false;
    }

    return {
      success: success,
      typeName: typeName
    };
  }

  function isDefined(value) {
    return !(_.isUndefined(value) || _.isNull(value) || _.isNaN(value));
  }

  var OriginalBackboneModel = Backbone.Model;



  Backbone.Model = OriginalBackboneModel.extend({

    _original: OriginalBackboneModel,

    constructor: function() {

      this._original.apply(this, arguments);
    },

    /* Validate Schema */
    validateSchema: function() {
      var schema = this.schema || {},
          attrs = this.attributes;

      for (var key in schema) {
        var value = attrs[key],
            field = schema[key],
            type = typeof field === 'object' && !_.isArray(field) ? field.type : field;

        if (field.required && !isDefined(value)) {
          return '"' + key + '" is required.';
        }

        if (_.isUndefined(value)) continue;

        /* Type checking */
        if (type) {
          var typeCheckResult = typeCheck(type, value);
          if (!typeCheckResult.success)
            return '"' + key + '" must be of type ' + typeCheckResult.typeName;
        }

        /* Field has options */
        if (typeof field === 'object') {
          /* Min checking */
          if (field.min && field.min > value) {
            return '"' + value + '" is lower than ' + field.min + ' for field "' + key + '"';
          }

          /* Max checking */
          if (field.max && field.max < value) {
            return '"' + value + '" is higher than ' + field.max + ' for field "' + key + '"';
          }
        }
      }
    },

    /* Default validation */
    validate: function(attrs) {
      return this.validateSchema();
    },

    get: _.wrap(Backbone.Model.prototype.get, function (fn, attribute) {

      var value   = fn.call(this, attribute),
          field   = this.schema && this.schema[attribute],
          getter  = field && field.get;

      return getter && getter.call(this, attribute, value) || value || field && (field.default || null);

    }),


    set: _.wrap(Backbone.Model.prototype.set, function (fn, key, value, options) {

      var attributes;

      if (!key || _.isObject(key)) {
          attributes = key;
          options = value;
      } else {
          (attributes = {})[key] = value;
      }

      var values  = {},
          schema  = this.schema,
          _this   = this;

      _.each(attributes, function(value, attribute, attrs) {
        var field   = schema && schema[attribute],
            setter  = field && field.set,
            result  = setter && setter.call(_this, attribute, value) || value;

        if (!_.isUndefined(result))
          values[attribute] = result;
      });

      fn.call(this, values, options);
      return this;

    }),


    toJSON: _.wrap(Backbone.Model.prototype.toJSON, function(fn, options) {

      var json = fn.call(this, options);
      json.cid = this.cid;

      for (var key in this.schema) {
        json[key] = this.get(key);
      }

      return json;

    })
  });

}.call(this));


