 // hide the form if the browser doesn't do SVG,
 // (then just let everything else fail)
 if (!document.createElementNS) {
     document.getElementsByTagName("form")[0].style.display = "none";
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

 var body = d3.select("body"),
     stat = d3.select("#status");

 var fieldSelect = d3.select("#field")
     .on("change", function(e) {
         field = fields[this.selectedIndex];
         location.hash = "#" + [field.id, year].join("/");
     });

 //when you change field
 fieldSelect.selectAll("option")
     .data(fields)
     .enter()
     .append("option")
     .attr("value", function(d) {
         return d.id;
     })
     .text(function(d) {
         return d.name;
     });

 var yearSelect = d3.select("#year")
     .on("change", function(e) {
         year = years[this.selectedIndex];
         location.hash = "#" + [field.id, year].join("/");
     });

 yearSelect.selectAll("option")
     .data(years)
     .enter()
     .append("option")
     .attr("value", function(y) {
         return y;
     })
     .text(function(y) {
         return y;
     })

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

 var inputElement = document.getElementById("input");
 inputElement.addEventListener("change", handleFiles, false);

 //This function handles the uploaded csv file by the user, for the map Korea.
 function handleFiles() {
     var fileList = this.files;
     if (fileList == undefined) {
         return;
     }
     inputElement.style.display = "none";
     document.getElementById("explanation").style.display ="none";
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
 var width = 960,
     height = 600,
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
 //
 var projection = d3.geo.mercator()
     .center([128, 36]) //latitude and longitude
     .scale(4000)
     .translate([width / 2, height / 2]);

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
 var url = "data/korea.json"

 var path = d3.geo.path()
     .projection(projection);



 //parse_json takes in the entire text string of the csv file
 function parse_json(str) {

     svg.selectAll("*").remove(); //make new map by removing previous information

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
