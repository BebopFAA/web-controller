/**
 * GET /
 * Home page.
 */
var config = require('../config');

exports.index = function (req, res) {
  res.render('home', {
    title: 'Home',
    MAPBOX_TOKEN: config.MAPBOX,
    AIRMAP_TOKEN: config.AIRMAP,
  });
};
