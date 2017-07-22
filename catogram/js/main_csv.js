 // hide the form if the browser doesn't do SVG,
 // (then just let everything else fail)
 if (!document.createElementNS) {
     document.getElementsByTagName("form")[0].style.display = "none";
 }

 var current = 0;

 $(document).ready(function() {  //JQuery Library is ready to use
     var countrybtn_1 = $("#country_btn_1");
     var countrybtn_2 = $("#country_btn_2");

     function changeField(num) {
         svg.selectAll("*").remove();
         url = urls[num];
         year = years[0];
         field = fields[0];
         projection = projections[num];
     }

     //Define functions for when the button is clicked.
     countrybtn_1.on({
         click: function() {
             document.getElementById("USA").style.display = "block";
             document.getElementById("korea").style.display = "none";
             document.getElementById("explanation").style.display = "block";
             document.getElementById("input_USA").style.display = "block";
             svg.selectAll("*").remove();
             current = 0;
             changeField(current);
             document.getElementById("map-container").style.display = "none";

         }
     });

     countrybtn_2.on({
         click: function() {
             document.getElementById("USA").style.display = "none";
             document.getElementById("korea").style.display = "block";
             document.getElementById("explanation_2").style.display = "block";
             document.getElementById("input_korea").style.display = "block";
             document.getElementById("map-container").style.display = "none";
             svg.selectAll("*").remove();

             current = 1;
             changeField(current);
         }
     });
 });

 var year_timer = false,
     carto_timer = false,
     idx = 0,
     field_selected = 0;

 function year_iter() {
     if (year_timer) {
         clearTimeout(year_timer);
         year_timer = false;
         document.getElementById("year_button").value = "year iteration";

     } else {
         year_timer = setInterval(year_iteration, 600);
         document.getElementById("year_button").value = "Stop";
     }
 }

 function year_iteration() {
     year = years[idx];
     location.hash = "#" + [field.id, year].join("/");
     parseHash();
     idx += 1;
     if (idx == years.length) {
         idx = 0;
     }
 }

 function carto_animation() {
     if (carto_timer) {
         clearTimeout(carto_timer);
         carto_timer = false;
         document.getElementById("animation_button").value = "cartogram animation";
     } else {
         field_selected = document.getElementById("field").selectedIndex
         carto_timer = setInterval(carto_animation_iteration, 1000);
         document.getElementById("animation_button").value = "Stop";
     }
 }

 function carto_animation_iteration() {
     if (document.getElementById("field").selectedIndex == 0) {
         field = fields[field_selected];
     } else {
         field = fields[0];
     }

     console.log(field_selected);
     location.hash = "#" + [field.id, year].join("/");
     parseHash();
 }
 // field definitions from:
 // <http://www.census.gov/popest/data/national/totals/2011/files/NST-EST2011-alldata.pdf>
 var percent = (function() {
         var fmt = d3.format(".2f");
         return function(n) {
             return fmt(n) + "%";
         };
     })(),

     //definition for the array of fields in the dropdown menu.
     fields = [
         { name: "(no scale)", id: "none" },
         { name: "My Data", id: "mydata", key: "DATA%d" }
     ],
     years = [2012, 2013, 2014, 2015, 2016, 2017],

     fieldsById = d3.nest()
     .key(function(d) {
         return d.id;
     })
     .rollup(function(d) {
         return d[0];
     })
     .map(fields),

     field = fields[0],
     year = years[0],
     colors = colorbrewer.RdYlBu[3]
     .reverse()
     .map(function(rgb) {
         return d3.hsl(rgb);
     });

 var fieldSelect, yearSelect;

 var body = d3.select("body"),
     stat = d3.select("#status");

 var map = d3.select("#map"),
     zoom = d3.behavior.zoom()
     .translate([-38, 32])
     .scale(.94)
     .scaleExtent([0.5, 10.0])
     .on("zoom", updateZoom),
     layer = map.append("g")
     .attr("id", "layer"),
     states = layer.append("g")
     .attr("id", "states")
     .selectAll("path"),
     csv_file,
     text_csv_file;

 if (window.File && window.FileReader && window.FileList && window.Blob) {
     // Great success! All the File APIs are supported.
 } else {
     alert('The File APIs are not fully supported in this browser.');
 }

 var inputElement = document.getElementById("input_USA");
 inputElement.addEventListener("change", handleFiles, false);
 var inputElement_2 = document.getElementById("input_korea");
 inputElement_2.addEventListener("change", handleFiles_2, false);

 //This function handles the uploaded csv file by the user, for the map USA and Korea respectively.
 function handleFiles() {
     var fileList = this.files;
     if (fileList == undefined) {
         return;
     }
     inputElement.style.display = "none";
     document.getElementById("explanation").style.display = "none";
     document.getElementById("map-container").style.display = "block";
     csv_file = fileList[0];

     parse_csv(csv_file, parse_json);
 }

 function handleFiles_2() {
     var fileList = this.files;
     if (fileList == undefined) {
         return;
     }
     inputElement_2.style.display = "none";
     document.getElementById("explanation_2").style.display = "none";
     document.getElementById("map-container").style.display = "block";
     csv_file = fileList[0];

     parse_csv(csv_file, parse_json);
 }

 //This function takes the text of csv file and passes it to the parse json function.
 function parse_csv(csv_file, callback) {
     if (csv_file) {
         var reader = new FileReader();
         reader.readAsText(csv_file, "UTF-8");

         reader.onload = function(evt) {
             text_csv_file = evt.target.result;
         }
         reader.onloadend = function(evt) {
             // file is loaded
             callback(text_csv_file);

         };
     }

 }
 // map.call(zoom);
 updateZoom();

 function updateZoom() {
     var scale = zoom.scale();
     layer.attr("transform",
         "translate(" + zoom.translate() + ") " +
         "scale(" + [scale, scale] + ")");
 }
 var width = 700,
     height = 500,
     initialScale = 50,
     initialX = width / 2,
     initialY = height / 2,
     centered,
     labels;


 //The projection method used is mercator, where the perspective is
 //moved to the provided longitude and latitude and then viewed from above.
 //This coordinate is specified with .center()
 //A higher scale() will zoom in.
 //.translate is horizontal and vertical shift. A value is put in to center the screen on the map.

console.log(width);
console.log(height);
 var projections = [d3.geo.albersUsa().scale(900).translate([width / 2, height / 2]), d3.geo.mercator()
     .center([128, 36]) //latitude and longitude
     .scale(4000)
     .translate([width / 2, height / 2])
 ];

 var projection = projections[0];

 var topology,
     geometries,
     rawData,
     dataById = {},
     carto = d3.cartogram() //cartogram starts.
     .projection(projection)
     .properties(function(d) {
         return dataById[d.id];
     })
     .value(function(d) {
         return +d.properties[field];
     });

 var svg = d3.select("svg");


 //This url specifies a (relative) path to the json file that describes the map/shape of south korea.
 //The json file consists of an id string for each region and the arcs that makes it up.
 //
 var urls = ["data/us-states.topojson", "data/korea.json"];
 var url = urls[0];

 var path = d3.geo.path()
     .projection(projection);



 //parse_json takes in the entire text string of the csv file
 function parse_json(str) {
     //make new map by removing previous information

     if (str == undefined) {} else {


         d3.json(url, function(error, kor) {
             topology = kor,
                 geometries = topology.objects.states.geometries;

             var data = d3.csv.parseRows(str); //built-in function that splits the rows
             rawData = data;
             var parsed_data = new Array();
             var division = data[0];
             for (var i = 1; i < data.length; i++) {
                 var temp_Object = new Object();

                 for (var j = 0; j < division.length; j++) {
                     temp_Object[division[j]] = data[i][j];
                 }
                 parsed_data.push(temp_Object);
             }
             years = [];
             var years_parsed = Object.keys(parsed_data[0]);
             for (var i = 0; i < years_parsed.length; i++) {
                 if (years_parsed[i] == "NAME") {
                     continue;
                 } else {
                     years.push(parseInt(years_parsed[i].substr(4, 15)));
                 }
             }
             dataById = d3.nest()
                 .key(function(d) {
                     return d.NAME;
                 })
                 .rollup(function(d) {
                     return d[0];
                 })
                 .map(parsed_data);

             init();
         });
     }
 }

 //when hash changes
 window.onhashchange = function() {
     parseHash();
 };


 function init() {

     var features = carto.features(topology, geometries),
         path = d3.geo.path()
         .projection(projection);

     carto = d3.cartogram() //cartogram starts.
         .projection(projection)
         .properties(function(d) {
             return dataById[d.id];
         })
         .value(function(d) {
             return +d.properties[field];
         });
     fieldSelect = d3.select("#field")
         .on("change", function(e) {
             field = fields[this.selectedIndex];
             location.hash = "#" + [field.id, year].join("/");
         });
     fieldsById = d3.nest()
         .key(function(d) { return d.id; })
         .rollup(function(d) { return d[0]; })
         .map(fields);


     fieldSelect.selectAll("option")
         .data(fields)
         .enter()
         .append("option")
         .attr("value", function(d) { return d.id; })
         .text(function(d) { return d.name; });
     yearSelect = d3.select("#year")
         .on("change", function(e) {
             year = years[this.selectedIndex];
             location.hash = "#" + [field.id, year].join("/");
         });
     yearSelect.selectAll("option")
         .data(years)
         .enter()
         .append("option")
         .attr("value", function(y) { return y; })
         .text(function(y) { return y; });

     map = d3.select("#map");

     layer = map.append("g")
         .attr("id", "layer");

     states = layer.append("g")
         .attr("id", "states")
         .selectAll("path");
     states = states.data(features)
         .enter()
         .append("path")
         .attr("class", "state")
         .attr("id", function(d) {
             return d.properties.NAME;
         })
         .attr("fill", "#fafafa")
         .attr("d", path);

     states.append("title");
     parseHash();
 }

 function reset() {
     stat.text("");
     body.classed("updating", false);

     var features = carto.features(topology, geometries),
         path = d3.geo.path()
         .projection(projection);

     states.data(features)
         .transition()
         .duration(750)
         .ease("linear")
         .attr("fill", "#fafafa")
         .attr("d", path);

     states.select("title")
         .text(function(d) {
             return d.properties.NAME;
         });
 }

 function update() {
     var start = Date.now();
     body.classed("updating", true);

     var key = field.key.replace("%d", year),
         fmt = (typeof field.format === "function") ? field.format : d3.format(field.format || ","),
         value = function(d) {
             return +d.properties[key];
         },
         values = states.data()
         .map(value)
         .filter(function(n) {
             return !isNaN(n);
         })
         .sort(d3.ascending),
         lo = values[0],
         hi = values[values.length - 1];

     var color = d3.scale.linear()
         .range(colors)
         .domain(lo < 0 ? [lo, 0, hi] : [lo, d3.mean(values), hi]);

     // normalize the scale to positive numbers
     var scale = d3.scale.linear()
         .domain([lo, hi])
         .range([1, 1000]);

     // tell the cartogram to use the scaled values
     carto.value(function(d) {
         return scale(value(d));
     });

     // generate the new features, pre-projected
     var features = carto(topology, geometries).features;

     // update the data
     states.data(features)
         .select("title")
         .text(function(d) {
             return [d.properties.NAME, fmt(value(d))].join(": ");
         });

     states.transition()
         .duration(750)
         .ease("linear")
         .attr("fill", function(d) {
             return color(value(d));
         })
         .attr("d", carto.path);

     var delta = (Date.now() - start) / 1000;
     stat.text(["calculated in", delta.toFixed(1), "seconds"].join(" "));
     body.classed("updating", false);
 }

 var deferredUpdate = (function() {
     var timeout;
     return function() {
         var args = arguments;
         clearTimeout(timeout);
         stat.text("calculating...");
         return timeout = setTimeout(function() {
             update.apply(null, arguments);
         }, 10);
     };
 })();

 var hashish = d3.selectAll("a.hashish")
     .datum(function() {
         return this.href;
     });

 function parseHash() {
     var parts = location.hash.substr(1).split("/"),
         desiredFieldId = parts[0],
         desiredYear = +parts[1];

     field = fieldsById[desiredFieldId] || fields[0];
     year = (years.indexOf(desiredYear) > -1) ? desiredYear : years[0];

     fieldSelect.property("selectedIndex", fields.indexOf(field));

     if (field.id === "none") {

         yearSelect.attr("disabled", "disabled");
         reset();

     } else {

         if (field.years) {
             if (field.years.indexOf(year) === -1) {
                 year = field.years[0];
             }
             yearSelect.selectAll("option")
                 .attr("disabled", function(y) {
                     return (field.years.indexOf(y) === -1) ? "disabled" : null;
                 });
         } else {
             yearSelect.selectAll("option")
                 .attr("disabled", null);
         }

         yearSelect
             .property("selectedIndex", years.indexOf(year))
             .attr("disabled", null);

         deferredUpdate();
         location.replace("#" + [field.id, year].join("/"));

         hashish.attr("href", function(href) {
             return href + location.hash;
         });
     }
 }
