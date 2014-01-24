var isNode = typeof module !== 'undefined' && module.exports
,   should = isNode ? require('chai').should() : window.chai.should()
,   expect = isNode ? require('chai').expect : window.chai.expect
,   Backbone = isNode ? require('backbone') : window.Backbone;

if (isNode) require('../backbone-schema');


describe('Backbone.Model.schema', function () {

  describe('Field types', function () {

    var model;

    beforeEach(function () {
      model = new (Backbone.Model.extend({
        schema: {
          string1: String,
          string3: { type: String },
          noType: {  }
        }
      }))();
    });

    describe('when invalid value', function () {

      it('should not validate when field is a type', function () {
        model.set({ string1: 12345678 }, { silent: true });
        model.isValid().should.be.false;
      });

      it('should not validate when type attribute is a type', function () {
        model.set({ string3: 12345678 }, { silent: true });
        model.isValid().should.be.false;
      });

    });

    describe('when valid value', function () {

      it('should validate when field is a type', function () {
        model.set({ string1: 'foobar' }, { silent: true });
        model.isValid().should.be.true;
      });

      it('should validate when type attribute is a type', function () {
        model.set({ string3: 'foobar' }, { silent: true });
        model.isValid().should.be.true;
      });

      it('should validate when type is not set on all types', function () {
        model.set({ noType: 'foobar' }, { silent: true });
        model.isValid().should.be.true;

        model.set({ noType: 123412 }, { silent: true });
        model.isValid().should.be.true;

        model.set({ noType: null }, { silent: true });
        model.isValid().should.be.true;
      });

    });

    describe('allows for different field types', function() {
      var model;

      beforeEach(function () {
        model = new (Backbone.Model.extend({
          schema: {
            stringType: String,
            numberType: Number,
            dateType: Date,
            booleanType: Boolean,
            ArrayType0: Array,
            ArrayType1: [],
            ArrayStringType: [String]
          }
        }))();
      });

      var typeTests = [
        {
          type: 'String',
          field: 'stringType',
          validValue: 'some string',
          invalidValue: 1234
        }, {
          type: 'Number',
          field: 'numberType',
          validValue: 1234,
          invalidValue: true
        }, {
          type: 'Date',
          field: 'dateType',
          validValue: new Date(),
          invalidValue: 1234
        }, {
          type: 'Boolean',
          field: 'booleanType',
          validValue: false,
          invalidValue: 1234
        }, {
          type: 'Array',
          field: 'ArrayType0',
          validValue: [0, 1, 2, 3],
          invalidValue: 1234
        }, {
          type: 'Array []',
          field: 'ArrayType1',
          validValue: [0, 1, 2, 3],
          invalidValue: 1234
        }, {
          type: 'Array of String',
          field: 'ArrayStringType',
          validValue: ['a', 'b', 'c', null],
          invalidValue: ['d', 0, 1, 2, 3]
        }
      ];

      for (var i = 0; i < typeTests.length; i++) {
        it('should support ' + typeTests[i].type, (function(typeTest) { 
          return function() {
            model.set(typeTest.field, typeTest.validValue);
            model.isValid().should.be.true;

            model.set(typeTest.field, typeTest.invalidValue);
            model.isValid().should.be.false;
          };
        })(typeTests[i]) );
      }

    });

  });

  
  describe('Field options', function() {
    describe('#default', function () {
      
      var model;

      beforeEach(function() {
        model = new (Backbone.Model.extend({
          schema: {
            n: { type: Number, default: 10 },
            non: { type: Number }
          }
        }))();
      });

      it('should appear in the JSON', function () {
        expect(model.toJSON().n).to.be.equal(10);
      });

      it('should be gettable', function () {
        expect(model.get('n')).to.be.equal(10);
      });

      it('should default as null if not sat', function () {
        expect(model.get('non')).to.be.null;
      });

      it('shouldn\'t override values when they\'re set', function () {
        model.set('n', 300);
        expect(model.get('n')).to.be.equal(300);
      });

      it('shouldn\'t override in JSON either', function () {
        model.set('n', 300);
        expect(model.toJSON().n).to.be.equal(300);
      });
    });


    describe('#required', function () {
      beforeEach(function () {
        model = new (Backbone.Model.extend({
          schema: {
            requiredField: { required: true }, 
            notRequiredField: { required: false }, 
            defaultField: {}
          }
        }))();
      });

      it('should not validate when required fields are missing', function () {
        model.set({ notRequiredField: 'testing' }, { silent: true });
        model.isValid().should.be.false;
      });

      it('should validate when no required fields are missing', function () {
        model.set({ requiredField: 'testing' }, { silent: true });
        model.isValid().should.be.true;
      });

      it('should validate when unspecified fields are missing', function () {
        model.set({ requiredField: 'testing' }, { silent: true });
        model.isValid().should.be.true;
      });
    });    

    describe('#get', function () {

      var model;

      beforeEach(function() {
        model = new (Backbone.Model.extend({
          schema: {
            firstName: String,
            lastName: String,
            fullName: { 
              get: function() { 
                return this.get('firstName') + ' ' + this.get('lastName') 
              } 
            },
            balance: { 
              get: function(attr, val) {
                return attr + ': $' 
                  + (val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
              } 
            }
          }
        }))();
      });

      it('should be able to rely on other fields', function () {
        model.set({
          firstName: 'John',
          lastName: 'Doe'
        }, { silent: true });
        expect(model.get('fullName')).to.equal('John Doe');
      });

      it('should be able to use own value and attribute name', function () {
        model.set({ balance: 123456789.42 }, { silent: true });
        expect(model.get('balance')).to.equal('balance: $123,456,789.42');
      });
    });

    describe('#set', function () {
      var model;

      beforeEach(function() {
        model = new (Backbone.Model.extend({
          schema: {
            firstName: String,
            lastName: String,
            fullName: { 
              set: function(attr, val) { 
                var split = val.split(' ');
                this.set({
                  firstName: split[0],
                  lastName: split[1]
                });
              }
            },
            balance: { 
              type: Number, 
              set: function(attr, val) { 
                return +((val + '').replace(',', '')); 
              } 
            }
          }
        }))();
      });

      it('should be able to set itself', function () {
        model.set({ balance: '1,000.92' }, { silent: true });
        expect(model.get('balance')).to.equal(1000.92);
      });

      it('should be able to set other fields', function () {
        model.set({ fullName: 'John Doe' }, { silent: true });
        expect(model.get('firstName')).to.equal('John');
        expect(model.get('lastName')).to.equal('Doe');
      });
    });

    describe('#min and #max', function () {
      var model;

      beforeEach(function() {
        model = new (Backbone.Model.extend({
          schema: {
            firstName: String
          }
        }))();
      });

      it('should validate when value is lower than max', function() {  });
      it('should validate when value is higher than min', function() {  });
      it('should not validate when value is higher than max', function() {  });
      it('should not validate when value is lower than min', function() {  });

    });

    describe('#enforceType', function () {
      var model;

      beforeEach(function() {
        model = new (Backbone.Model.extend({
          schema: {
            firstName: String
          }
        }))();
      });

      it('enforces Number', function() {  });
      it('enforces String', function() {  });
      it('enforces Date', function() {  });
      it('enforces Boolean', function() {  });
      it('enforces Array', function() {  });

    });

    describe('#validate', function () {
      var model;

      beforeEach(function() {
        model = new (Backbone.Model.extend({
          schema: {
            firstName: String
          }
        }))();
      });

      it('', function() {  });

    });


  });
});
