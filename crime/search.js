// For crime search page.

// Measured between (37.250305, -121.913158) and (37.235818, -121.912993)
const latitude_delta_per_mile = 0.014487;
// Measured between (37.236121, -121.940872) and (37.236185, -121.922646)
const longitude_delta_per_mile = 0.018226;

var auto_refresh_timer = null;

function getLocation() {
  $('#details').hide();
  navigator.geolocation.getCurrentPosition(onHavingLocation);
}

function onHavingLocation(position) {
  DEBUG_position = position;


  distance_factor = $('#distance-factor-input').val();
  from_year = $('#year-input').val();

  from_latitude = position.coords.latitude - latitude_delta_per_mile * distance_factor;
  to_latitude = position.coords.latitude + latitude_delta_per_mile * distance_factor;
  from_longitude = position.coords.longitude - longitude_delta_per_mile * distance_factor;
  to_longitude = position.coords.longitude + longitude_delta_per_mile * distance_factor;

  // Example query (without parameter escape):
  // https://moto.data.socrata.com/resource/wrmr-tdyp.json?$order=incident_datetime desc&$where=(`latitude` > 37.226811399999995 AND `latitude` < 37.2534114 AND `longitude` > -121.93483050000002AND `longitude` < -121.90123050000001 AND `incident_datetime` > '2019-01-01T00:00:00.000' AND (`parent_incident_type` = 'Theft' OR `parent_incident_type` = 'Property Crime' OR `parent_incident_type` = 'Weapons Offense' OR `parent_incident_type` = 'Assault with Deadly Weapon' OR `parent_incident_type` = 'Theft of Vehicle'))
  query_header = 'https://moto.data.socrata.com/resource/wrmr-tdyp.json?$limit=5000&$order=incident_datetime desc&$where=';
  param = "(`latitude` > "+ from_latitude + " AND `latitude` < " + to_latitude + " AND `longitude` > " + from_longitude + "AND `longitude` < " + to_longitude + " AND `incident_datetime` > '" + from_year + "-01-01T00:00:00.000' AND (`parent_incident_type` = 'Theft' OR `parent_incident_type` = 'Property Crime' OR `parent_incident_type` = 'Weapons Offense' OR `parent_incident_type` = 'Assault with Deadly Weapon' OR `parent_incident_type` = 'Breaking & Entering' OR `parent_incident_type` = 'Theft of Vehicle'))";
  query = query_header + escape(param);
  // Example search_results:
  // [{"incident_id":"834060383","case_number":"S180400222","incident_datetime":"2018-02-09T13:41:41.000","incident_type_primary":"BURGLARY (460)","incident_description":"Call Type: 459    <br>Description: BURGLARY (460)<br>Final Disposition: R","clearance_type":"","address_1":"16300 Block LAVENDER LN","city":"SANTA CLARA COUNTY","state":"CA","latitude":"37.238507967223796","longitude":"-121.95510804279245","created_at":"2018-02-12T21:37:35.000","updated_at":"2018-02-16T18:03:16.000","location":{"type":"Point","coordinates":[-121.955108042792,37.2385079672238]},"hour_of_day":"13","day_of_week":"Friday","parent_incident_type":"Breaking & Entering"},]
  $.get(query).done(function(search_results) {
    var safety_score = 0.0;
    var distance_distribution = [];
    var year_distribution = [];
    var info_text = '';
    for (const e of search_results) {
      let distance = Math.sqrt(
        Math.pow(Math.abs(e.latitude - position.coords.latitude) / latitude_delta_per_mile, 2) +
        Math.pow(Math.abs(e.longitude - position.coords.longitude) / longitude_delta_per_mile, 2));
      let year = e.incident_datetime.slice(0, 4);

      let current_year = new Date().getFullYear();
      safety_score -= Math.exp(-(distance + (current_year - year)));

      distance_distribution.push(distance);
      year_distribution.push('Year: ' + year);  // text based histogram looks better.

      info_text += 'date and time: ' + e.incident_datetime + '<br/>';
      info_text += 'day_of_week: ' + e.day_of_week + '<br/>';
      info_text += 'type: ' + e.incident_type_primary + '<br/>';
      info_text += 'address: ' + e.address_1 + '<br/>';
      info_text += 'distance: ' + distance + ' miles<br/>';
      info_text += '<hr/>';
    }

    $('#result').html(
      'Found ' + search_results.length + ' events (capped at 5000).<br/>' +
      '<b>Safty score</b> (best 0): ' + safety_score);
    Plotly.newPlot('distance-plot', [{
        name: 'Distance Distribution',
        x: distance_distribution,
        type: 'histogram',
      }]);
      Plotly.newPlot('year-plot', [{
        name: 'Year Distribution',
        x: year_distribution,
        type: 'histogram',
      }]);
    $('#info').html(info_text);
    $('#details').show();
  });
}

$(document).ready(function() {
  $('#details').hide();

  $('#auto-refresh-checkbox').change(function() {
    if (this.checked) {
      auto_refresh_timer = setInterval(getLocation, 1000 * 30);
    } else {
      if (auto_refresh_timer) {
        clearInterval(auto_refresh_timer);
      }
      auto_refresh_timer = null;
    }
  });
});
