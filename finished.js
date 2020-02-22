'use strict';


const COL = {
    NAME: 'Name',
    TYPE1: 'Type 1',
    TYPE2: 'Type 2',
    TOTAL: 'Total',
    SP_DEF: 'Sp. Def',
    GEN: 'Generation',
    LGD: 'Legendary',
};

const FILTERS = {
    LGD: ['True', 'False'],
    GEN: 0,
};

  let colors2 = {
    "Bug": "#4E79A7",
    "Dark": "#A0CBE8",
    "Electric": "#F28E2B",
    "Fairy": "#FFBE7D",
    "Fighting": "#59A14F",
    "Fire": "#8CD17D",
    "Ghost": "#B6992D",
    "Grass": "#499894",
    "Ground": "#86BCB6",
    "Ice": "#FABFD2",
    "Normal": "#E15759",
    "Poison": "#FF9D9A",
    "Psychic": "#79706E",
    "Steel": "#BAB0AC",
    "Water": "#D37295",
    "Dragon" : "#4B0082",
}
  let data = "no data";
  let svgContainer = ""; 
 
  function visualize(data) {
    svgContainer = d3.select('#graph')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    
      makeScatterPlot(data);

      let legendaryDropDown = createLegendaryFilter(['All', 'True', 'False']);
      legendaryDropDown.on('change', function() {
          FILTERS.LGD = (this.value == 'All') ? ['True', 'False'] : [this.value];
          showCircles(svgContainer, data);
      });
  
      let generationDropdown = createGenerationFilter(data);
      generationDropdown.on('change', function() {
          FILTERS.GEN = parseInt(this.value);
          showCircles(svgContainer, data);
      });

      createType1Legend(data);
      showCircles(svgContainer, data);
  }

  function makeScatterPlot(csvData) {
    data = csvData 
    let df_data = data.map((row) => parseFloat(row["Sp. Def"]));
    let total_data = data.map((row) => parseFloat(row["Total"]));
    let axesLimits = findMinMax(df_data, total_data);
    let mapFunctions = drawAxes(axesLimits, "Sp. Def", "Total");
    plotData(mapFunctions);
    makeLabels();;
  };


function createLegendaryFilter(choices) {
  let dropdown = d3.select('#legendary-filter')
      .append('select')
      .attr('name', 'legendary');

  let options = dropdown.selectAll('option')
      .data(choices)
      .enter()
      .append('option')
      .text(d => d)
      .attr('value', d => d);
  
  options.filter(val => val == choices[0]).attr('selected', true);
  return dropdown;
};

function createGenerationFilter(data) {
  let dropdown = d3.select('#generation-filter')
      .append('select')
      .attr('name', 'generation');

  let distinctGens = [0, ...new Set(data.map(d => d[COL.GEN]))];

  let options = dropdown.selectAll('option')
      .data(distinctGens)
      .enter()
      .append('option')
      .text(d => d)
      .attr('value', d => d);
  
  options.filter(val => val == data[0]).attr('selected', true);
  return dropdown;
};

function createType1Legend(data) {
  let types = Object.keys(colors2);
  types = types.map(t => {
      return {
          name: t,
          color: colors2[t],
      };
  });

  const typeDivs = d3.select('#type1-legend')
      .selectAll('div')
      .data(types)
      .enter()
      .append('div')
      .attr('id', t => `${t.name}-type`);

  typeDivs.append('div')
      .style('background-color', t => t.color)
      .attr('class', 'type-legend-color');

  typeDivs.append('span')
      .text(t => t.name);
};

function showCircles (svgContainer, data) {
  const isValid = d => {
      if (FILTERS.GEN && d[COL.GEN] != FILTERS.GEN) 
      return false;
      return FILTERS.LGD.includes(d[COL.LGD]);
  };

  svgContainer.selectAll('.circles')
      .data(data)
      .filter(d => !isValid(d))
      .attr('display', 'none');

  svgContainer.selectAll('.circles')
      .data(data)
      .filter(d => isValid(d))
      .attr('display', 'inline');
};

  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 15)
      .style('font-size', '14pt')
      .text("Pokemon Visuazliation");

    svgContainer.append('text')
      .attr('x', 252.5)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Sp. Def');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 252)rotate(-90)')
      .style('font-size', '10pt')
      .text('Total');
  }

  function plotData(map) {
    let total_data = data.map((row) => + row["Total"]);
    let total_limits = d3.extent(total_data);
    let total_map_func = d3.scaleLinear()
      .domain([total_limits[0], total_limits[1]])
      .range([3, 8]);
    let xMap = map.x;
    let yMap = map.y;
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")

    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => total_map_func(d["Total"]))
        .attr('fill', function (d) {
          let type1 = d["Type 1"]
          let hexcode = colors2[type1]
          return hexcode
        })
        .on("mouseover", (d) => {
          div.transition()
            .duration(100)
            .style("opacity", .9);
          div.html(d["Name"] + "<br/>" + d["Type 1"] +"<br/>"+ d["Type 2"] )
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(100)
            .style("opacity", 0);
        });
  }

function drawAxes(limits, x, y) {
    let xValue = function(d) { return +d[x]; }
    let xScale = d3.scaleLinear()
      .domain([0, limits.xMax + 10]) 
      .range([50, 450]);

    let xMap = function(d) { return xScale(xValue(d)); };
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    let yValue = function(d) { return +d[y]}
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) 
      .range([50, 450]);

    let yMap = function (d) { return yScale(yValue(d)); };
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  function findMinMax(x, y) {
    let xMin = d3.min(x);
    let xMax = d3.max(x);
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  };

d3.csv('./data/pokemon.csv').then(visualize);
