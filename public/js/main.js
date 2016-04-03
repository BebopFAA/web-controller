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

  var url = 'https://api.airmap.io/maps/v3/tilejson/' +
    layers.join() + '?apikey=' + AIRMAP_TOKEN +
    '&token=' + AIRMAP_TOKEN +
    '&theme=' + THEME;

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

  // point = [long, lat]
  function getRegulationsForPoint(point) {
    var longitude = point[0];
    var latitude = point[1];
    var url = 'https://api.airmap.io/data/v1/status?unique_id=drone_regulations' +
      '&latitude=' + latitude + '&longitude=' + longitude + '&weather=true' +
      '&apikey=' + AIRMAP_TOKEN;
    $.ajax({
      method: 'GET',
      url: url,
      success: function (response) {
        console.log(response);
      },
    });
  }

  function getDroneLocation() {
    return {
      type: 'Point',
      coordinates: [-73.997087 + Math.random() * 0.01, 40.728059 + Math.random() * 0.01],
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
      var location = getDroneLocation();
      map.getSource('drone-source').setData(location);
      getRegulationsForPoint(location.coordinates);
    }, 1500);
  });
});
