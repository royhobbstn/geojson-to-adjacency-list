const fs = require('fs').promises;
const {runBiDijkstra, toIdList} = require('./bi-di-ch.js');
const biDiPlain = require('./bi-di.js').runBiDijkstra;
const new_adj = require('./ch.json');
const new_edge = require('./ne.json');
const node_rank = require('./nr.json');

const {toAdjacencyList, toEdgeHash, runDijkstra} = require('./index.js');
const {contractGraph} = require('./contraction_hierarchy.js');

main();

async function main() {

  const geojson_raw = await fs.readFile('./full_network.geojson'); // full_network

  const geojson = JSON.parse(geojson_raw);

  geojson.features = geojson.features.filter(feat => {
    if (feat.properties.STFIPS === 6 || feat.properties.STFIPS === 41 || feat.properties.STFIPS === 53) {
      return true;
    }
  });
  //
  // console.time('contracted');
  // const [new_adj, new_edge, node_rank] = contractGraph(geojson, {cost_field: 'MILES'});
  // console.timeEnd('contracted');
  //
  // const ch = fs.writeFile('./ch.json', JSON.stringify(new_adj), 'utf8');
  // const ne = fs.writeFile('./ne.json', JSON.stringify(new_edge), 'utf8');
  // const nr = fs.writeFile('./nr.json', JSON.stringify(node_rank), 'utf8');
  // await Promise.all([ch, ne, nr]);
  //
  // process.exit();

  const adjacency = toAdjacencyList(geojson);
  const edge_list = toEdgeHash(geojson);
  const id_list = toIdList(geojson);

  setTimeout(function () {

    // console.time('CH');
    // // const sample1 = runBiDijkstra(new_adj, new_edge,  '-122.247284,37.809112', '-121.974367,37.323066', 'MILES', node_rank, id_list);
    // // const small1 = runBiDijkstra(new_adj, new_edge,  '-122.026583,37.334387', '-121.993577,37.289151', 'MILES', node_rank, id_list);
    // const pacific1 = runBiDijkstra(new_adj, new_edge, '-124.20303,43.35581', '-117.207863,32.795913', 'MILES', node_rank, id_list);
    // console.timeEnd('CH');
    //
    // console.time('biDimensional');
    // // const sample2 = biDiPlain(adjacency, edge_list,  '-122.247284,37.809112', '-121.974367,37.323066', 'MILES');
    // // const small2 = biDiPlain(adjacency, edge_list,  '-122.026583,37.334387', '-121.993577,37.289151', 'MILES');
    // const pacific2 = biDiPlain(adjacency, edge_list, '-117.343748,48.046597', '-117.21164,32.743957', 'MILES');
    // console.timeEnd('biDimensional');
    //
    // console.time('dijkstra');
    // // const sample3 = runDijkstra(adjacency, edge_list,  '-122.247284,37.809112', '-121.974367,37.323066', 'MILES');
    // // const small3 = runDijkstra(adjacency, edge_list,  '-122.026583,37.334387', '-121.993577,37.289151', 'MILES');
    const pacific3 = runDijkstra(adjacency, edge_list, '-117.343748,48.046597', '-117.21164,32.743957', 'MILES');
    console.log(pacific3.segments.length, pacific3.distance);
    // console.timeEnd('dijkstra');

    // performance test
    const adj_keys = Object.keys(adjacency);
    const adj_length = adj_keys.length;

    console.time('Dijkstra');
    for (let i = 0; i < 10; i++) {
      let rnd1 = Math.floor(Math.random() * adj_length);
      let rnd2 = Math.floor(Math.random() * adj_length);
      console.time('test: ' + i);
      console.log(adj_keys[rnd1], adj_keys[rnd2]);
      // const test = runDijkstra(adjacency, edge_list, adj_keys[rnd1], adj_keys[rnd2], 'MILES');
      console.timeEnd('test: ' + i);
    }
    console.timeEnd('Dijkstra');

    // console.time('ContractionHierarchy');
    // for (let i = 0; i < 1000; i++) {
    //   let rnd1 = Math.floor(Math.random() * adj_length);
    //   let rnd2 = Math.floor(Math.random() * adj_length);
    //   console.time('test: ' + i);
    //   console.log(adj_keys[rnd1], adj_keys[rnd2]);
    //   const test = runBiDijkstra(new_adj, new_edge, adj_keys[rnd1], adj_keys[rnd2], 'MILES', node_rank, id_list);
    //   console.timeEnd('test: ' + i);
    // }
    // console.timeEnd('ContractionHierarchy');

  }, 3000);
}