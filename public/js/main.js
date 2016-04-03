var Cylon = require('cylon');
var fs = require('fs');
var binjs = require('binaryjs');

$(function () {
  'use strict';

  var MAX_ZOOM = 14.9;
  var ZOOM = MAX_ZOOM;
  var THEME = 'standard';
  var layers = [

    // Airport Airspaces
    'airports_recreational',

    // Cautions
    'tfrs',
    'sua_prohibited',
    'sua_restricted',
    'noaa',
    'national_parks',

    // Advisories
    'hospitals',
    'parcels',
    'power_plants',
    'schools',
  ];

  // var map = new Airmap.Map(AIRMAP_TOKEN, {
  //   container: 'map',
  //   layers: layers,
  // });

  var url = 'https://api.airmap.io/maps/v3/tilejson/' +
    layers.join() + '?apikey=' + AIRMAP_TOKEN +
    '&token=' + AIRMAP_TOKEN +
    '&theme=' + THEME;
  console.log(url);

  // Initialize the Mapbox map with Airmap overlayed on top
  mapboxgl.accessToken = MAPBOX_TOKEN;
  var map = new mapboxgl.Map({
    container: 'map', // container id
    style: url, //stylesheet location
    center: [-73.9957915, 40.7285429], // starting position
    zoom: MAX_ZOOM, // starting zoom
    maxZoom: ZOOM,
  });

  map.addControl(new mapboxgl.Geolocate());
  map.addControl(new mapboxgl.Navigation());

  var radius = 20;

  function getDroneLocation() {
    return {
      type: 'Point',
      coordinates: [-73.997087, 40.728059],
    };
  }

  map.on('load', function () {
    // Add a source and layer displaying a point which will be animated in a circle.
    map.addSource('drone-source', {
      type: 'geojson',
      data: getDroneLocation(),
    });

    map.addLayer({
      id: 'drone',
      source: 'drone-source',
      type: 'circle',
      paint: {
        'circle-radius': 10,
        'circle-color': '#007cbf',
      },
    });

    // Update the drone location
    setInterval(function () {
      map.getSource('drone-source').setData(getDroneLocation());
    }, 500);
  });

  // Add the location of the drone to the map
  // map.on('style.load', function () {
  // map.addSource('image', {
  //   type: 'image',
  //   url: '/images/drone.png',
  //   coordinates: [
  //     [40.7261895, -74.0029852],
  //     [41.7261895, -74.0029852],
  //     [41.7261895, -84.0029852],
  //     [40.7261895, -84.0029852],
  //
  //       // [-80.425, 46.437],
  //       // [-71.516, 46.437],
  //       // [-71.516, 37.936],
  //       // [-80.425, 37.936],
  //   ],
  // });

  // map.addLayer({
  //   id: 'geojson-marker',
  //   type: 'symbol',
  //   source: 'geojson-marker',
  //   layout: {
  //     'icon-image': 'http://www.joomlaworks.net/images/demos/galleries/abstract/7.jpg',
  //     'text-field': '{title}',
  //     'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  //     'text-offset': [0, 0.6],
  //     'text-anchor': 'top',
  //   },
  // });
  // });
});
