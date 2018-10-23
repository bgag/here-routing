/**
 * Created by caliskan on 02.12.16.
 */

const fetch = require('node-fetch');
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

HereRouting.prototype.calculateMatrix = function (start, destination) {
  // no options...only distances for one startpoint to multiple endpoints with mode "fastest;car" supported
  // more options might follow
  //   https://developer.here.com/documentation/routing/topics/resource-calculate-matrix.html
  //
  // start:       feature with geometry point
  // destination: featureCollection with features of geometry point
  // returns:     "destination" with new property "distance" on each feature

  if (!start || !start.geometry || start.geometry.type !== 'Point'){
    return Promise.reject(new Error('start parameter is missing or not a feature with geometry of type point'));
  }
  if (!destination || !destination.features){
    return Promise.reject(new Error('destination parameter is missing or not a featureCollection'));
  }

  // divide destinations in chunks of hundred, since HereRouting allows only for 100 destinations per request
  let numberChunks = Math.ceil(destination.features.length / 100)
  let querys       = []
  let startParam   = start.geometry.coordinates.slice().reverse().join(',')
  for (let chunk = 0; chunk < numberChunks; chunk++){
    let queryParams = {
      app_id: this.appId,
      app_code: this.appCode,
      mode: 'fastest;car',
      summaryAttributes: 'distance',
      start0: startParam
    }
    let numberFeatures = (chunk < numberChunks-1) ? 100 : destination.features.length - (numberChunks - 1) * 100

    for (let i = 0; i < numberFeatures; i++){
      queryParams['destination'+i] = destination.features[i+(100*chunk)].geometry.coordinates.slice().reverse().join(',')
    }
    let url = HereRouting.defaults.baseUrlMatrix+'?'+querystring.stringify(queryParams)
    // collect fetches to let them run parallel in Promise.all
    querys.push(
      fetch(url)
        .then(result => {
          return result.json()
        })
        .then(json => {
          json = json.response || json
          if (json.type && json.type.endsWith('Error')) {
            return Promise.reject(new Error(json.subtype + ': ' + json.details))
          }
          json.matrixEntry.forEach((entry) => {
            if (!entry.summary){
              entry.summary = {}
            }
            if (!entry.summary.distance && entry.summary.distance !== 0){
              entry.summary.distance = -1
            }
            destination.features[(chunk*100)+entry.destinationIndex].properties.distance = entry.summary.distance
          })
          return 1
        })
        .catch(err=>{
          return err
        })
    )
  }
  return Promise.all(querys)
    .then(() => { return destination })
    .catch(err => { return Promise.reject(err) })
}

HereRouting.prototype.calculateIsoline = function (start, distance, options) {
  options = options || {}

  if (!start) {
    return Promise.reject(new Error('start parameter is missing'))
  }

  if (!distance) {
    return Promise.reject(new Error('distance parameter is missing'))
  }

  let queryParams = {
    mode: options.mode || this.mode || HereRouting.defaults.mode,
    start: start.geometry.coordinates.slice().reverse().join(','),
    rangetype: options.rangeType || HereRouting.defaults.rangeType,
    range: distance,
    app_id: this.appId,
    app_code: this.appCode
  }

  let url = HereRouting.defaults.baseUrlIsoline + '?' + querystring.stringify(queryParams)

  return fetch(url).then(function (result) {
    return result.json()
  }).then(function (json) {
    json = json.response || json

    if (json.type && json.type.endsWith('Error')) {
      return Promise.reject(new Error(json.subtype + ': ' + json.details))
    }

    let points = []
    if (json.isoline[0].component.length > 0) {
      points = json.isoline[0].component[0].shape.map(function (item) {
        /* split each points string to two string points, e.g. "52.5139618,13.3354282" -> "52.5139618","13.3354282"
         * then parse each string to float
         */
        return item.split(',').reverse().map(function (item) {
          return parseFloat(item)
        })
      })
    }

    let polygon = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ points ]
      }
    }

    /* if withStart flag is given, a feature collection is returned,
     * which includes the mapped start position as the second feature
     * in features array.
     */
    if (options.withStart) {
      let startPoint = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [json.start.mappedPosition.longitude, json.start.mappedPosition.latitude]
        }
      }

      polygon = {
        type: 'FeatureCollection',
        features: [
          polygon,
          startPoint
        ]
      }
    }

    return polygon
  })
}

HereRouting.defaults = {
  baseUrlIsoline: 'https://isoline.route.cit.api.here.com/routing/7.2/calculateisoline.json',
  baseUrlMatrix: 'https://matrix.route.cit.api.here.com/routing/7.2/calculatematrix.json',
  mode: 'fastest;car',
  rangeType: 'time'
}

module.exports = HereRouting;
