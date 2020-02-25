'use strict';

let MARGIN = 50;
let TT_WIDTH = 200;
let TT_HEIGHT = 80;

let COL = {
    NAME: 'Name',
    TYPE1: 'Type 1',
    TYPE2: 'Type 2',
    TOTAL: 'Total',
    SP_DEF: 'Sp. Def',
    GEN: 'Generation',
    LGD: 'Legendary',
};

let Y_VAR = COL.TOTAL;
let X_VAR = COL.SP_DEF;

let FILTERS = {
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

function visualize (data) {
    let svg = d3.select('#graph')
        .append('svg')
        .attr('width', 800)
        .attr('height', 800);

    makeScatterPlot(data, svg);

    let legendaryradios = createLegendaryFilter(['All', 'True', 'False']);
    legendaryradios.on('change', function() {
        FILTERS.LGD = (this.value == 'All') ? ['True', 'False'] : [this.value];
        showCircles(svg, data);
    });

    let generationDropdown = createGenerationFilter(data);
    generationDropdown.on('change', function() {
        FILTERS.GEN = parseInt(this.value);
        showCircles(svg, data);
    });

    createType1Legend(data);

    showCircles(svg, data);
}


function makeScatterPlot (data, svg) {
    let yData = data.map(d => parseFloat(d[Y_VAR]));
    let xData = data.map(d => parseFloat(d[X_VAR]));
    let axesLimits = findMinMax(xData, yData);
    let mapFunctions = drawAxes(axesLimits, svg);
    plotData(data, svg, mapFunctions);
    let xLabel = 'Total';
    let yLabel = 'Sp. Def';

    makeLabels(svg, xLabel, yLabel);
};

function createLegendaryFilter (choices) {
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

function createGenerationFilter (data) {
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

function createType1Legend (data) {
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

function showCircles (svg, data){
    let isValid = d => {
        if (FILTERS.GEN && d[COL.GEN] != FILTERS.GEN) return false;
        return FILTERS.LGD.includes(d[COL.LGD]);
    };

    svg.selectAll('.circles')
        .data(data)
        .filter(d => !isValid(d))
        .attr('display', 'none');

    svg.selectAll('.circles')
        .data(data)
        .filter(d => isValid(d))
        .attr('display', 'inline');
};

function findMinMax (x, y) {
    return {
        xMin: d3.min(x),
        xMax: d3.max(x),
        yMin: d3.min(y),
        yMax: d3.max(y)
    };
};

function drawAxes (limits, svg) {
    let xScale = d3.scaleLinear()
        .domain([limits.xMin - 20, limits.xMax + 20])
        .range([0 + MARGIN, 800 - MARGIN]);

    let yScale = d3.scaleLinear()
        .domain([limits.yMax + 50, limits.yMin - 50])
        .range([0 + MARGIN, 800 - MARGIN]);

    let xMap = d => xScale(+d[X_VAR]);
    let yMap = d => yScale(+d[Y_VAR]);

    let xAxis = d3.axisBottom().scale(xScale);
    let yAxis = d3.axisLeft().scale(yScale);

    svg.append('g')
        .attr('transform', 'translate(0, ' + (800 - MARGIN) + ')')
        .call(xAxis);

    svg.append('g')
        .attr('transform', 'translate(' + MARGIN + ', 0)')
        .call(yAxis);

    return {
        xMap: xMap,
        yMap: yMap,
        xScale: xScale,
        yScale: yScale
    };
};

function makeLabels (svg, x, y) {
    svg.append('text')
        .attr('x', (800 - 2 * MARGIN) / 2 - 30)
        .attr('y', 800 - 10)
        .style('font-size', '12pt')
        .style('font-weight', 'bold')
        .text(x);

    svg.append('text')
        .attr('transform', 'translate( 15,' + (800 / 2 + 30) + ') rotate(-90)')
        .style('font-size', '12pt')
        .style('font-weight', 'bold')
        .text(y);
};

function plotData (data, svg, f) {
    const div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    let tooltipChart = div.append('svg')
        .attr('width', TT_WIDTH)
        .attr('height', TT_HEIGHT);

    svg.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', f.xMap)
        .attr('cy', f.yMap)
        .attr('r', 7)
        .attr('fill', d => colors2[d[COL.TYPE1]])
        .attr('class', 'circles')
        .on('mouseover', d => showTooltip(d, div, tooltipChart))
        .on('mouseout', d => hideTooltip(d, div));
};

function showTooltip (d, div, chart) {
    chart.selectAll('*').remove();

    div.transition()
        .duration(200)
        .style('opacity', .9);

    const info = `
        <strong>${d[COL.NAME]}</strong>
        <br/>
        <em>${d[COL.TYPE1]}</em>
        ${d[COL.TYPE2] ? ['<br/><em>', d[COL.TYPE2], '</em>'].join('') : ''}
    `;

    div.html(info)
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');
};

function hideTooltip (d, div, chart) {
    div.transition()
        .duration(500)
        .style('opacity', 0);
};

d3.csv('./data/pokemon.csv').then(visualize);