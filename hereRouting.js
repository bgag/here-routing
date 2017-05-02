/**
 * Created by caliskan on 02.12.16.
 */

var fetch = require('node-fetch');
const querystring = require('querystring');

function HereRouting (options) {
  this.appId = options.appId;
  this.appCode = options.appCode;
}

HereRouting.prototype.findClosestRoutingPoint = function (point) {
  var closest = this.calculateIsoline(point, 60, {withStart: true});
  return closest.then(function (result) {
    return result.features[1];
  });
};

HereRouting.prototype.calculateIsoline = function (start, distance, options) {
  options = options || {};

  if (!start) {
    return Promise.reject(new Error('start parameter is missing'));
  }

  if (!distance) {
    return Promise.reject(new Error('distance parameter is missing'));
  }

  var queryParams = {
    mode: options.mode || this.mode || HereRouting.defaults.mode,
    start: start.geometry.coordinates.reverse().join(','),
    rangetype: options.rangeType || HereRouting.defaults.rangeType,
    range: distance,
    app_id: this.appId,
    app_code: this.appCode
  };

  var url = HereRouting.defaults.baseUrl + '?' + querystring.stringify(queryParams);

  return fetch(url).then(function (result) {
    return result.json();
  }).then(function (json) {
    json = json.response || json;

    if (json.type && json.type.endsWith('Error')) {
      return Promise.reject(new Error(json.subtype + ': ' + json.details));
    }

    var points = [];
    if (json.isoline[0].component.length > 0) {
      points = json.isoline[0].component[0].shape.map(function (item) {
        /* split each points string to two string points, e.g. "52.5139618,13.3354282" -> "52.5139618","13.3354282"
         * then parse each string to float
         */
        return item.split(',').reverse().map(function (item) {
          return parseFloat(item);
        });
      });
    }

    var polygon = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ points ]
      }
    };

    /* if withStart flag is given, a feature collection is returned,
     * which includes the mapped start position as the second feature
     * in features array.
     */
    if (options.withStart) {
      var startPoint = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [json.start.mappedPosition.longitude, json.start.mappedPosition.latitude]
        }
      };

      polygon = {
        type: 'FeatureCollection',
        features: [
          polygon,
          startPoint
        ]
      };
    }

    return polygon;
  });
};

HereRouting.defaults = {
  baseUrl: 'https://isoline.route.cit.api.here.com/routing/7.2/calculateisoline.json',
  mode: 'fastest;car',
  rangeType: 'time'
};

module.exports = HereRouting;
