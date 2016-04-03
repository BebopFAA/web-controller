var Player = require('../../Broadway-master/Player/Player');
var io = require('socket.io-client');

$(function () {
  'use strict';

  var toUint8Array = function (parStr) {
    var raw = atob(parStr);
    var array = new Uint8Array(new ArrayBuffer(raw.length));

    Array.prototype.forEach.call(raw, function (data, index) {
      array[index] = raw.charCodeAt(index);
    });

    // console.log(array);
    return array;
  };

  var player = new Player({
    useWorker: true,
    workerFile: '/js/Decoder.js',
  });

  var videoWindow = document.getElementById('video-stream');

  // document.body.appendChild(player.canvas);
  videoWindow.appendChild(player.canvas);

  var socket = io('http://localhost:8000/');

  socket.on('data', function (data) {
    console.log('receiving video data...');
    player.decode(toUint8Array(data));
  });

  var toTitleCase = require('titlecase');
  var moment = require('moment');
  var _ = require('lodash');
  var MAX_ZOOM = 14.9;
  var ZOOM = MAX_ZOOM;
  var THEME = 'standard';

  var layers = {

    // Airport Airspaces
    airports_recreational: { icon: 'fa fa-plane' },

    // Cautions
    tfrs: { icon: 'fa fa-exclamation-triangle' },
    sua_prohibited: { icon: 'fa fa-user-secret' },
    sua_restricted: { icon: 'fa fa-fighter-jet' },
    noaa: { icon: 'fa fa-ship' },
    national_parks: { icon: 'fa fa-tree' },

    // Advisories
    hospitals: { icon: 'fa fa-ambulance' },
    parcels: { icon: 'fa fa-home' },
    power_plants: { icon: 'fa fa-bolt' },
    heliports: { icon: 'fa fa-h-square' },
    schools: { icon: 'fa fa-graduation-cap' },
  };

  var layerNames = {
    airports_commercial: 'Airports (Commercial Rules)',
    airports_commercial_private: 'Private Airports (Commercial Rules)',
    airports_recreational: 'Airports (Recreational Rules)',
    airports_recreational_private: 'Private Airports (Recreational Rules)',
    class_b: 'Controlled Airspace (Class B)',
    class_c: 'Controlled Airspace (Class C)',
    class_d: 'Controlled Airspace (Class D)',
    class_e0: 'Controlled Airspace (Class E to Ground)',
    heliports: 'Heliports',
    hospitals: 'Hospitals',
    national_parks: 'National Parks',
    noaa: 'NOAA Marine Protection Areas',
    parcels: 'Private Property',
    power_plants: 'Power Plants',
    prisons: 'Prisons',
    schools: 'Schools',
    stadiums: 'Stadiums',
    sua_prohibited: 'Prohibited Special Use Airspace',
    sua_restricted: 'Restricted Special Use Airspace',
    tfrs: 'Temporary Flight Restrictions',
  };

  var advisoryLevels = {
    red: 3,
    yellow: 2,
    green: 1,
  };

  var labelColors = {
    SAFE: 'success',
    CAUTION: 'warning',
    ADVISORY: 'danger',
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

  function buildPopupMarkup(layers) {
    var html = '';
    var grouped = _.groupBy(layers, function (p) {
      return p.type;
    });

    var keys = _.keys(grouped);
    for (var g in keys) {
      var group = keys[g];
      var groupHtml = "<div class='airspace-group-title'><b>" +
        layerNames[group] + '</b></div>';
      for (var i in grouped[group]) {
        var item = grouped[group][i];
        if (item.url) {
          groupHtml += "<div class='airspace-item'><div class='airspace-item-name'><a href='" +
          item.url + "'>" + item.name + '</a></div>';
        } else {
          groupHtml += "<div class='airspace-item'><div class='airspace-item-name'>" +
          item.name + '</div>';
        }

        if (item.phone) {
          groupHtml += "<div class='airspace-item-phone'><a href='tel://" +
          item.phone + "'>" + item.phone + '</a></div>';
        }

        if (item.date_issued) {
          var start = moment(item.date_issued);
          var end = moment(item.date_expire);
          var now = moment();
          if (now.isBefore(start)) {
            groupHtml += "<div class='airspace-item-start'>Starts " + start.fromNow() + '</div>';
          } else {
            groupHtml += "<div class='airspace-item-start'>Started " + start.fromNow() + '</div>';
          }

          if (item.date_expire != '+010000-01-01T00:00:00.000Z') {
            groupHtml += "<div class='airspace-item-end'>Ends " +
              end.format('MMMM Do YYYY, h:mm:ss a') + '</div>';
          }
        }

        groupHtml += '<br/></div>';
      }

      html += groupHtml;
    }

    return html;
  }

  // Code modified from the AirMap SDK
  function sdkHandleClick(data) {
    var map = data.target;
    var features = map.queryRenderedFeatures(data.point);
    var properties = _.map(features, function (feature) {
      return feature.properties;
    });

    properties = _.filter(properties, function (p) {
      return p.type &&
        (_.includes(Object.keys(layerNames), p.type.replace('layer_', '')) || p.type == 'tfrs');
    });

    if (properties.length > 0) {
      var markup = buildPopupMarkup(properties);
      var popups = document.getElementsByClassName('mapboxgl-popup-content');
      if (popups.length > 0) {
        var markupElement = document.createElement('div');
        markupElement.innerHTML = markup;
        popups[0].insertBefore(markupElement, popups[0].firstChild);
      } else {
        var tooltip = new mapboxgl.Popup({
          closeOnClick: true,
        }).setLngLat(data.lngLat).setHTML(markup);
        tooltip.addTo(map);
      }
    }
  }

  map.on('click', sdkHandleClick);

  function clearRegulations() {
    $('#regulations').empty();
  }

  function addRegulation(name, type, color) {
    // console.log(type);
    // console.log(layers[type]);
    var label = 'SAFE';
    if (color == 'red') {
      label = 'ADVISORY';
    } else if (color == 'yellow') {
      label = 'CAUTION';
    }

    var html = '<li class="list-group-item ' + color +
      '-regulation"><i class="' + layers[type].icon + '"></i> ' +
      toTitleCase(name.toLowerCase()) + '<span class="label label-' + labelColors[label] +
      '">' + label + '</span></li>';
    $('#regulations').append(html);
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

  function clearWeather() {
    $('#weather').empty();
  }

  function addWeather(weather, icon, label) {
    var html = '<li class="list-group-item"><i class="' + icon + '"></i> ' +
      weather + '<span class="label label-' + labelColors[label] +
      '">' + label + '</span></li>';
    $('#weather').append(html);
  }

  function getConditionIcon(condition) {
    condition = condition.toLowerCase();
    if (condition.indexOf('snow') > -1) { // Snowy
      return 'wi wi-day-snow';
    } else if (condition.indexOf('rain') > -1 ||
      condition.indexOf('showers') > -1) {
      return 'wi wi-day-rain';
    } else if (condition.indexOf('cloudy') > -1) { // Cloudy
      return 'wi wi-day-cloudy';
    } else { // Sunny
      return 'wi wi-day-sunny';
    }
  }

  function updateWeather(weather) {
    clearWeather();

    // Add each row with the weather report
    var condition = weather.condition;
    var conditionIcon = getConditionIcon(condition);
    var conditionLabel = 'SAFE';
    var conditionLower = condition.toLowerCase();
    if (conditionLower.indexOf('wind') > -1 ||
      conditionLower.indexOf('rain') > -1 ||
      conditionLower.indexOf('snow') > -1 ||
      conditionLower.indexOf('showers') > -1) conditionLabel = 'CAUTION';
    addWeather(condition, conditionIcon, conditionLabel);

    var visibility = weather.visibility * 0.621371;
    var visLabel = (visibility < 2 ? 'ADVISORY' :
      (visibility < 5) ? 'CAUTION' : 'SAFE');
    addWeather((visibility.toFixed(2)) + ' mi', 'fa fa-eye', visLabel);

    var precipitation = weather.precipitation * 100;
    var precLabel = (precipitation > 50 ? 'ADVISORY' :
      (precipitation > 20) ? 'CAUTION' : 'SAFE');
    addWeather((precipitation) + ' %', 'wi wi-raindrop', precLabel);

    var temperature = (weather.temperature * 9 / 5 + 32);
    var tempLabel = (temperature < 10 || temperature > 100 ? 'ADVISORY' :
      (temperature < 20 || temperature > 90) ? 'CAUTION' : 'SAFE');
    addWeather((temperature) + ' °F', 'wi wi-thermometer-exterior', tempLabel);

    var windspeed = weather.wind.speed * 0.621371;
    var speedLabel = (windspeed > 15 ? 'ADVISORY' :
      (windspeed > 10) ? 'CAUTION' : 'SAFE');
    addWeather((windspeed.toFixed(2)) + ' mph', 'wi wi-windy', speedLabel);

    var gusts = weather.wind.gusting * 0.621371;
    var gustsLabel = (gusts > 25 ? 'ADVISORY' :
      (gusts > 15) ? 'CAUTION' : 'SAFE');
    addWeather((gusts.toFixed(2)) + ' mph', 'wi wi-strong-wind', gustsLabel);
  }

  function getDroneAltitude() {
    return 100 + Math.random() * 10;
  }

  function updateAltitudeRegulation() {
    var currentAltitude = getDroneAltitude();
    var label = (currentAltitude >= 400 ? 'ADVISORY' :
      (currentAltitude >= 250 ? 'CAUTION' : 'SAFE'));

    var html = '<li class="list-group-item"><i class="fa fa-arrows-v"></i> ' +
      currentAltitude.toFixed(2) + ' ft<span class="label label-' + labelColors[label] +
      '">' + label + '</span></li>';
    $('#altregulation').empty();
    $('#altregulation').append(html);
  }

  // point = [long, lat]
  function getRegulationsForPoint(point, cb) {
    var longitude = point[0];
    var latitude = point[1];
    var url = 'https://api.airmap.io/data/v1/status?unique_id=drone_regulations' +
      '&latitude=' + latitude + '&longitude=' + longitude + '&weather=true' +
      '&apikey=' + AIRMAP_TOKEN + '&types=' + Object.keys(layers).join();
    $.ajax({
      method: 'GET',
      url: url,
      success: cb,
    });
  }

  // Data to determine what weather conditions are available from the API
  // Here is what I gathered from running it 1000 times:
  // ["Sunny", "Partly Cloudy/Wind", "Mostly Cloudy", "Snow Showers/Wind",
  // "Mostly Cloudy/Wind", "Sunny/Wind", "Cloudy/Wind", "Cloudy", "Showers/Wind",
  //  "Partly Cloudy", "Rain/Snow/Wind", "Light Rain/Wind", "Few Showers/Wind",
  // "Few Snow Showers/Wind", "Mostly Sunny/Wind", "Snow/Wind", "Mostly Sunny",
  // "Snow", "Snow Showers", "Rain/Snow Showers/Wind", "Light Snow/Wind",
  // "Heavy Snow/Wind", "Few Snow Showers", "Rain/Wind"]
  function gatherConditions(n, cb) {
    var conditions = [];
    var returned = 0;
    var regulationCallback = function (response) {
      var condition = response.weather.condition;
      if (conditions.indexOf(condition) == -1) {
        conditions.push(condition);
      }

      returned++;
      if (returned == n) {
        console.log(conditions);
        cb();
      }
    };

    for (var i = 0; i < n; i++) {
      getRegulationsForPoint(
        [
          -73.997087 + 5 - (Math.random() * 10),
          40.728059 + 5 - (Math.random() * 10),
        ], regulationCallback);
    }
  }

  // gatherConditions(1000);

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
      getRegulationsForPoint(location.coordinates, function (response) {
        updateRegulations(response.nearest_advisories);
        updateWeather(response.weather);
        updateAltitudeRegulation();
      });
    }, 1500);
  });

});
