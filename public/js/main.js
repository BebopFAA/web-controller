var Player = require('../../Broadway-master/Player/Player');
var io = require('socket.io-client');


$(function () {
  'use strict';

  var toUint8Array = function (parStr) {
    var raw = atob(parStr);
    var array = new Uint8Array(new ArrayBuffer(raw.length));

    Array.prototype.forEach.call(raw, function (data, index) {
      array[index] = raw.charCodeAt(index);
    })

    // console.log(array);
    return array;
  };

  var player = new Player({
    useWorker: true,
    workerFile: '/js/Decoder.js'
  });

  document.body.appendChild(player.canvas);

  var socket = io('http://localhost:8000/');
  
  socket.on('data', function (data) {
    console.log('receiving video data...')
    player.decode(toUint8Array(data));
  });

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

  var advisoryLevels = {
    red: 3,
    yellow: 2,
    green: 1,
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
    var label = 'SAFE';
    var labelColor = 'success';
    if (color == 'red') {
      label = 'ADVISORY';
      labelColor = 'danger';
    } else if (color == 'yellow') {
      label = 'CAUTION';
      labelColor = 'warning';
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
    var sortedRegulations = regulations.sort(function (a, b) {
      if (a.advisory_level != b.advisory_level) {
        return (advisoryLevels[a.advisory_level] >
          advisoryLevels[b.advisory_level] ? -1 : 1);
      } else {
        if (a.name == b.name) return 0;
        return (a.name < b.name ? -1 : 1);
      }
    });

    sortedRegulations.forEach(function (regulation) {
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
      '&apikey=' + AIRMAP_TOKEN + '&types=' + Object.keys(layers).join();
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
