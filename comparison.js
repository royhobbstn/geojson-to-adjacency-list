const fs = require('fs').promises;
const dj3rd = require('dijkstrajs');
const Graph = require('node-dijkstra');

// load traditional dijkstra and utilities
const {toAdjacencyList, toEdgeHash, runDijkstra} = require('./index.js');

// load standard bidirectional dijkstra
const biDiPlain = require('./bi-di.js').runBiDijkstra;

// load contraction hierarchy version bidirectional dijkstra
const {runBiDijkstra, toIdList} = require('./bi-di-ch.js');

// load contraction hierarchy output
const new_adj = require('./ch.json');
const new_edge = require('./ne.json');
const node_rank = require('./nr.json');


main();

async function main() {

  const geojson_raw = await fs.readFile('./full_network.geojson'); // full_network
  const geojson = JSON.parse(geojson_raw);

  // only pacific states
  geojson.features = geojson.features.filter(feat => {
    if (/*feat.properties.STFIPS === 6 || feat.properties.STFIPS === 41 ||*/ feat.properties.STFIPS === 53) {
      if(feat.properties.MILES && feat.geometry.coordinates) {
        if(feat.properties.ID !== 477) {
          // TODO deal with this in network cleanup
          return true;
        }
      }
    }
  });

  // geojson.features = geojson.features.filter(feat => {
  //   if (feat.properties.CTFIPS === 77 && feat.properties.STFIPS === 53) {
  //     if(feat.properties.MILES && feat.geometry.coordinates) {
  //       if(feat.properties.ID !== 477) {
  //         // TODO deal with this in network cleanup
  //         return true;
  //       }
  //     }
  //   }
  // });

  await fs.writeFile('./pacific.geojson', JSON.stringify(geojson), 'utf8');

  const alt_graph = createDijkstraJsGraph(geojson, 'MILES');

  const adjacency = toAdjacencyList(geojson);
  const edge_list = toEdgeHash(geojson);
  const id_list = toIdList(geojson);

  const adj_keys = Object.keys(adjacency);
  const adj_length = adj_keys.length;

  const coords = [];

  for(let i = 0; i < 100; i++) {
    const rnd1 = Math.floor(Math.random() * adj_length);
    const rnd2 = Math.floor(Math.random() * adj_length);
    const coord = [adj_keys[rnd1], adj_keys[rnd2]];
    // const coord = [ '-122.53917,47.148311', '-122.483947,47.170403' ];
    coords.push(coord);
  }

  const dijkstra = [];
  const bidirectional = [];
  const ch = [];
  const correct = [];
  const correct2 = [];
  const nodeDijkstra = new Graph(alt_graph);

  coords.forEach((pair, index) => {

    process.stdout.write('Processing ' + ((index/coords.length)*100).toFixed(2) + '% complete... ' + index + '  ' + pair + '                 \r');

    dijkstra[index] = runDijkstra(adjacency, edge_list, pair[0], pair[1], 'MILES');
    bidirectional[index] = biDiPlain(adjacency, edge_list, pair[0], pair[1], 'MILES');
    ch[index] = runBiDijkstra(new_adj, new_edge, pair[0], pair[1], 'MILES', node_rank, id_list);
    correct[index] = toCorrectPath(alt_graph, edge_list, pair[0], pair[1], 'MILES');
    correct2[index] = toCorrectPath2(nodeDijkstra, edge_list, pair[0], pair[1], 'MILES');
  });

  console.log(`index`,`Dijkstra`,`BiDirectional`,`ContractionHierarchy`);


  let error_count = 0;
  for(let i=0; i<coords.length; i++) {
    const values = [dijkstra[i].distance, bidirectional[i].distance, ch[i].distance, correct[i].distance, correct2[i].distance ];

    let min = Infinity;
    let max = -Infinity;

    values.forEach(val=> {
      if(val<min) {
        min = val;
      }
      if(val>max) {
        max = val;
      }
    });

    if((max-min) > 0.000001) {
      error_count++;
      console.log(i,coords[i], dijkstra[i].segments.length,dijkstra[i].distance.toFixed(5),bidirectional[i].segments.length,bidirectional[i].distance.toFixed(5),ch[i].segments.length,ch[i].distance.toFixed(5),correct[i].segments.length,correct[i].distance.toFixed(5),correct2[i].segments.length,correct2[i].distance.toFixed(5));
    }
  }
  console.log(`There were ${error_count} errors.`);

  // console.log(ch[0].raw_segments);
  // console.log(correct2[0].segments);

  // fs.writeFile('./comparison_dijkstra.geojson', JSON.stringify(dijkstra[0].route));
  // fs.writeFile('./comparison_bidirectional.geojson', JSON.stringify(bidirectional[0].route));
  // fs.writeFile('./comparison_ch.geojson', JSON.stringify(ch[0].route));
  // fs.writeFile('./comparison_correct.geojson', JSON.stringify(correct[0].route));
  // fs.writeFile('./comparison_correct2.geojson', JSON.stringify(correct2[0].route));
}


function createDijkstraJsGraph(geojson, cost_field) {
  const graph = {};
  geojson.features.forEach((f, i) => {
    if(!geojson.features[i+1]){
      return;
    }
    if (!f.geometry.coordinates) {
      console.log('ERROR: no coordinates on feature');
      return;
    }
    const start = f.geometry.coordinates[0].join(',');
    const end = f.geometry.coordinates[f.geometry.coordinates.length -1].join(',');

    const cost = f.properties[cost_field];
    if(!cost) {
      console.log('ERROR: no cost');
      return;
    }
    if(!graph[start]) {
      graph[start] = {};
    }
    if(!graph[end]) {
      graph[end] = {};
    }
    graph[start][end] = cost;
    graph[end][start] = cost;
  });
  return graph;
}

function toCorrectPath(graph, edge_list, start, end, cost_field) {
  const path = dj3rd.find_path(graph, start, end);

  const geojson_features = [];
  let distance = 0;
  const segments = [];

  if(start !== end) {
    path.forEach((node, i) => {
      if(!path[i+1]) {
        return;
      }
      const feature = edge_list[`${node}|${path[i+1]}`];
      if(!feature) {
        console.log('ERROR: No edge feature found');
        return;
      }
      geojson_features.push(feature);
      distance += feature.properties[cost_field];
      segments.push(feature.properties.ID);
    });
  }

  const route = {
    "type": "FeatureCollection",
    "features": geojson_features
  };

  return {distance, segments, route};
}

function toCorrectPath2(graph, edge_list, start, end, cost_field) {

  const path = graph.path(start, end, {cost: true}).path;

  const geojson_features = [];
  let distance = 0;
  const segments = [];

  if(start !== end) {
    path.forEach((node, i) => {
      if(!path[i+1]) {
        return;
      }
      const feature = edge_list[`${node}|${path[i+1]}`];
      if(!feature) {
        console.log('ERROR: No edge feature found');
        return;
      }
      geojson_features.push(feature);
      distance += feature.properties[cost_field];
      segments.push(feature.properties.ID);
    });
  }

  const route = {
    "type": "FeatureCollection",
    "features": geojson_features
  };

  return {distance, segments, route};
}



