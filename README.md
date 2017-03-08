# here-routing

Isoline calculation with Here maps.
The function ```calculateIsoline()``` calculates the area which can be reached by driving for a 
given time or distance.

## Install
```sh
npm install here-routing
```

## Usage
```js
var routing = new Routing({appId: 'DemoAppId01082013GAL', appCode: 'AJKnXv84fjrb0KIHawS0Tg'});

var start = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [9.9878699,48.39714] // Ulm
    }
};
var distance = 300;

routing.calculateIsoline(start, distance, options).then(function (result) {
  if (result) {
    console.log(result);
  } 
  else {
    console.error('ERROR');
  }
}).catch(function (error) {
  console.error(error);
});
```
## Parameters
- start
    - The start point as a geojson feature type.
- distance
    - The distance in meters or seconds depending on the given range type.
- options
    - see below
    
## Options
- baseUrl
    - The URL to the REST API. Default is set to 'https://isoline.route.cit.api.here.com/routing/7.2/calculateisoline.json'.
    Usually you do not have to change this value.
- mode
    - Describes the type of routing calculation. Default is set to 'fastest;car'.
- rangeType
    - You can choose a 'time' or 'distance' range type. Default is set to 'time'.
    
