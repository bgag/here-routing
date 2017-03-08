/**
 * Created by caliskan on 05.12.16.
 */

var assert = require('assert');
var Routing = require('../hereRouting');

var config = {
  appId: 'DemoAppId01082013GAL',
  appCode: 'AJKnXv84fjrb0KIHawS0Tg'
};

describe('hereRouting', function () {
  describe('.findClosestRoutingPoint', function () {
    it('should return a point', function () {
      var routing = new Routing({
        appId: config.appId,
        appCode: config.appCode
      });

      var start = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [9.9878699, 48.39714] // Ulm
        }
      };

      var result = routing.findClosestRoutingPoint(start);
      return result.then(function (result) {
        assert.ok(result.type);
        assert.equal(result.type, 'Feature');
        assert.equal(result.geometry.type, 'Point');
        assert.ok(result.geometry.coordinates);
        assert.equal(result.geometry.coordinates.length, 2);
        assert.equal(result.geometry.coordinates[0], 9.9878705);
        assert.equal(result.geometry.coordinates[1], 48.3971424);
      });
    });
  });

  describe('.calculateIsoline', function () {
    it('should return a polygon', function () {
      var routing = new Routing({
        appId: config.appId,
        appCode: config.appCode
      });

      var start = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [13.3778, 52.5160] // Berlin
        }
      };
      var distance = 300;

      var result = routing.calculateIsoline(start, distance);
      return result.then(function (result) {
        assert.ok(result.type);
        assert.equal(result.type, 'Feature');
        assert.equal(result.geometry.type, 'Polygon');
        assert.ok(result.geometry.coordinates);
        assert.ok(result.geometry.coordinates.length > 0);
      });
    });

    it('should throw an error', function (done) {
      var routing = new Routing({
        appId: config.appId,
        appCode: config.appCode
      });

      var start = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [13.3778, 52.5160] // Berlin
        }
      };
      var distance = 300;

      var options = {
        rangeType: 'tim'
      };

      routing.calculateIsoline(start, distance, options).then(function () {
        done(new Error('Did not throw Error'));
      }).catch(function () {
        done();
      });
    });
  });
});
