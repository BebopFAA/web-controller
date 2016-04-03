$(function () {
  'use strict';

  var toTitleCase = require('titlecase');
  console.log(toTitleCase);
  var MAX_ZOOM = 14.9;
  var ZOOM = MAX_ZOOM;
  var THEME = 'standard';

  var layers = {

    // Airport Airspaces
    airports_recreational: { icon: 'plane' },

    // Cautions
    tfrs: { icon: 'exclamation-triangle' },
    sua_prohibited: { icon: 'user-secret' },
    sua_restricted: { icon: 'fighter-jet' },
    noaa: { icon: 'ship' },
    national_parks: { icon: 'bicycle' },

    // Advisories
    hospitals: { icon: 'ambulance' },
    parcels: { icon: 'home' },
    power_plants: { icon: 'bolt' },
    heliports: { icon: 'h-square' },
    schools: { icon: 'graduation-cap' },
  };

  var url = 'https://api.airmap.io/maps/v3/tilejson/' +
    Object.keys(layers).join() + '?apikey=' + AIRMAP_TOKEN +
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

  var icons = {
    school: 'graduation-cap',
  };

  function clearRegulations() {
    $('#regulations .list-group').empty();
  }

  function addRegulation(name, type, color) {
    // console.log(type);
    // console.log(layers[type]);
    var label = 'CAUTION';
    var labelColor = 'warning';
    if (color == 'red') {
      label = 'ADVISORY';
      labelColor = 'danger';
    }

    var html = '<li class="list-group-item ' + color +
      '-regulation"><i class="fa fa-' + layers[type].icon + '"></i> ' +
      toTitleCase(name.toLowerCase()) + '<span class="label label-' + labelColor +
      '">' + label + '</span></li>';
    $('#regulations .list-group').append(html);
  }

  function updateRegulations(regulations) {
    clearRegulations();

    // Sort the regulations first

    regulations.forEach(function (regulation) {
      var color = regulation.advisory_level;
      var type = regulation.type;
      var name = regulation.name;
      addRegulation(name, type, color);
    });
  }

  function updateWeather(weather) {
    console.log(weather);
  }

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
        updateRegulations(response.nearest_advisories);
        updateWeather(response.weather);
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
