 // hide the form if the browser doesn't do SVG,
 // (then just let everything else fail)

 if (!document.createElementNS) {
     document.getElementsByTagName("form")[0].style.display = "none";
 }
 var svg = d3.select("svg");

 $(document).ready(function() {
     var dropbtn_1 = $('#dropbtn_1');
     var dropbtn_2 = $('#dropbtn_2');
     var drop_content = $('.dropdown-content');
     var left_btn = $('#left_btn');
     var right_btn = $('#right_btn');
     var fieldbtn = $('.fieldbtn');
     var current = 0;

     function changeField(num) {
         svg.selectAll("*").remove();
         url = urls[num];
         csv = csvs[num];
         years = years_list[num];
         fields = fields_list[num];
         year = years[0];
         field = fields[0];
         proj = projections[num];

         location.hash = "#" + [field.id, year].join("/");
         parseHash();

         make_json();
     }

     fieldbtn.on({
         click: function() {
             current = $(this).index();
             changeField(current);
         }
     });

     left_btn.on({
         mouseover: function() {
             $(this).css("background-color", "rgba(255,255,255,0.4)");
         },
         mouseout: function() {
             $(this).css("background-color", "rgba(255,255,255,0)");
         },
         click: function() {
             current--;
             if (current < 0) { current = fields_list.length - 1; }
             changeField(current);
         }
     });

     right_btn.on({
         mouseover: function() {
             $(this).css("background-color", "rgba(255,255,255,0.4)");
         },
         mouseout: function() {
             $(this).css("background-color", "rgba(255,255,255,0)");
         },
         click: function() {
             current++;
             if (current == fields_list.length) { current = 0; }
             changeField(current);
         }
     });


     dropbtn_1.on({
         mouseover: function() {
             $(this).find("button").css("background-color", "#039be5");
             drop_content.css("display", "block");
         },
         mouseout: function() {
             $(this).find("button").css("background-color", "#4fc3f7");
             drop_content.css("display", "none");
         }
     });

     drop_content.find("a").on({
         mouseover: function() {
             $(this).css("background-color", "#b3e5fc");
         },
         mouseout: function() {
             $(this).css("background-color", "#e1f5fe");
         }
     });

     dropbtn_2.on({
         mouseover: function() {
             $(this).find("button").css("background-color", "#039be5");
         },
         mouseout: function() {
             $(this).find("button").css("background-color", "#4fc3f7");
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
         year_timer = setInterval(year_iteration, 500);
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
         carto_timer = setInterval(carto_animation_iteration, 800);
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
         return function(n) { return fmt(n) + "%"; };
     })(),

     usa = [ //this data get into dropdown list.
         { name: "(no scale)", id: "none" },
         // {name: "Census Population", id: "censuspop", key: "CENSUS%dPOP", years: [2010]},
         // {name: "Estimate Base", id: "censuspop", key: "ESTIMATESBASE%d", years: [2010]},
         { name: "Population Estimate", id: "popest", key: "POPESTIMATE%d" },
         { name: "Population Change", id: "popchange", key: "NPOPCHG_%d", format: "+," },
         { name: "Births", id: "births", key: "BIRTHS%d" },
         { name: "Deaths", id: "deaths", key: "DEATHS%d" },
         { name: "Natural Increase", id: "natinc", key: "NATURALINC%d", format: "+," },
         { name: "Int'l Migration", id: "intlmig", key: "INTERNATIONALMIG%d", format: "+," },
         { name: "Domestic Migration", id: "domesticmig", key: "DOMESTICMIG%d", format: "+," },
         { name: "Net Migration", id: "netmig", key: "NETMIG%d", format: "+," },
         { name: "Residual", id: "residual", key: "RESIDUAL%d", format: "+," },
         { name: "Birth Rate", id: "birthrate", key: "RBIRTH%d", years: [2011], format: percent },
         { name: "Death Rate", id: "deathrate", key: "RDEATH%d", years: [2011], format: percent },
         { name: "Natural Increase Rate", id: "natincrate", key: "RNATURALINC%d", years: [2011], format: percent },
         { name: "Int'l Migration Rate", id: "intlmigrate", key: "RINTERNATIONALMIG%d", years: [2011], format: percent },
         { name: "Net Domestic Migration Rate", id: "domesticmigrate", key: "RDOMESTICMIG%d", years: [2011], format: percent },
         { name: "Net Migration Rate", id: "netmigrate", key: "RNETMIG%d", years: [2011], format: percent },
     ],
     korea = [
         { name: "(no scale)", id: "none" },
         { name: "Population Estimate", id: "popest", key: "POP%d" }
     ],
     china = [
         { name: "(no scale)", id: "none" },
         { name: "Population Estimate", id: "popest", key: "POP%d" }
     ],
     urls = ["data/us-states.topojson", "data/korea.json", "data/china.json"],
     fields_list = [
         usa,korea,china
     ],
     csvs = ["data/nst_2011.csv", "data/korea.csv","data/china.csv"],
     years_usa = [2010, 2011],
     years_korea = [2012, 2013, 2014, 2015, 2016],
     years_china = [2001,2002,2003,2004],
     years_list = [years_usa, years_korea,years_china],
     years = years_list[0],
     fields = fields_list[0],
     fieldsById = d3.nest()
     .key(function(d) { return d.id; })
     .rollup(function(d) { return d[0]; })
     .map(fields),
     field = fields[0],
     year = years[0],
     colors = colorbrewer.RdYlBu[3]
     .reverse()
     .map(function(rgb) { return d3.hsl(rgb); });

 var body = d3.select("body");

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
     .attr("value", function(d) { return d.id; })
     .text(function(d) { return d.name; });

 var yearSelect = d3.select("#year")
     .on("change", function(e) {
         year = years[this.selectedIndex];
         location.hash = "#" + [field.id, year].join("/");
     });

 yearSelect.selectAll("option")
     .data(years)
     .enter()
     .append("option")
     .attr("value", function(y) { return y; })
     .text(function(y) { return y; })

 var map = d3.select("#map"),
     zoom = d3.behavior.zoom()
     .translate([-38, 32])
     .scale(.80)
     .scaleExtent([0.5, 10.0])
     .on("zoom", updateZoom),
     layer = map.append("g")
     .attr("id", "layer"),
     states = layer.append("g")
     .attr("id", "states")
     .selectAll("path");

 // map.call(zoom);
 updateZoom();

 function updateZoom() {
     var scale = zoom.scale();
     layer.attr("transform",
         "translate(" + zoom.translate() + ") " +
         "scale(" + [scale, scale] + ")");
 }
 var width = 726,
     height = 500;

 var projections = [d3.geo.albersUsa().scale(900).translate([width / 2, height / 2]),
                    d3.geo.mercator().center([128, 36]).scale(4000).translate([width / 2, height / 2]),
                    d3.geo.mercator().center([105,38]).scale(500).translate([width/2,height/2])];
 var proj = projections[0], //set projection of cartogram, topojson
     topology,
     geometries,
     rawData,
     dataById = {},
     carto = d3.cartogram() //cartogram starts.
     .projection(proj)
     .properties(function(d) {
         return dataById[d.id];
     })
     .value(function(d) {
         return +d.properties[field];
     });


 //when hash changes
 window.onhashchange = function() {
     parseHash();
 };

 var url = "data/us-states.topojson";
 var csv = "data/nst_2011.csv";

 function make_json() {
     d3.json(url, function(topo) { //take topo json file
         topology = topo;
         geometries = topology.objects.states.geometries;

         d3.csv(csv, function(data) { //take csv file.
             rawData = data;
             dataById = d3.nest()
                 .key(function(d) { return d.NAME; })
                 .rollup(function(d) { return d[0]; })
                 .map(data);
             init();
         });
     });
 }

 make_json();

 function init() {

     var features = carto.features(topology, geometries),
         path = d3.geo.path()
         .projection(proj);

     carto = d3.cartogram() //cartogram starts.
         .projection(proj)
         .properties(function(d) {
             return dataById[d.id];
         })
         .value(function(d) {
             return +d.properties[field];
         });

     fieldSelect.selectAll("option").remove();
     yearSelect.selectAll("option").remove();
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
     body.classed("updating", false);

     var features = carto.features(topology, geometries),
         path = d3.geo.path()
         .projection(proj);

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
         fmt = (typeof field.format === "function") ?
         field.format :
         d3.format(field.format || ","),
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

     body.classed("updating", false);
 }

 var deferredUpdate = (function() {
     var timeout;
     return function() {
         var args = arguments;
         clearTimeout(timeout);
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