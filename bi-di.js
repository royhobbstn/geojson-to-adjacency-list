
const fs = require('fs').promises;
const FibonacciHeap = require('@tyriar/fibonacci-heap').FibonacciHeap;
const toBestRoute = require('./index.js').toBestRoute;
const getComparator = require('./index.js').getComparator;

const debug = false;
const save_output = false;

exports.runBiDijkstra = runBiDijkstra;


function runBiDijkstra(adj_list, edge_hash, start, end, cost_field) {

  // TODO this is not guaranteed to be an optimal solution (yet)

  const forward = {};
  const backward = {};

  const searchForward = doDijkstra(adj_list, edge_hash, forward, start, cost_field, 'forward');
  const searchBackward = doDijkstra(adj_list, edge_hash, backward, end, cost_field, 'backward');

  let forward_done = false;
  let backward_done = false;
  let sf, sb;
  do {
    if(!forward_done){
      sf = searchForward.next();
      if(sf.done) {
        forward_done = true;
      }
    }
    if(!backward_done) {
      sb = searchBackward.next();
      if(sb.done) {
        backward_done = true;
      }
    }

  } while (!forward.visited[sb.value]);

  const latest = sb.value;
  const geojson_forward = toBestRoute(latest, forward.prev, edge_hash);
  const geojson_backward = toBestRoute(latest, backward.prev, edge_hash);

  if(save_output) {
    console.log('forward');
    geojson_forward.features.forEach(g=> {
      console.log(g.properties.ID, g.properties[cost_field]);
    });
    console.log('backward');
    geojson_backward.features.forEach(g=> {
      console.log(g.properties.ID, g.properties[cost_field]);
    });

    fs.writeFile('./orig_path1.geojson', JSON.stringify(geojson_forward), 'utf8');
    fs.writeFile('./orig_path2.geojson', JSON.stringify(geojson_backward), 'utf8');
  }

  const geojson_combined = [...geojson_forward.features, ...geojson_backward.features];
  const segments = geojson_combined.map(f=>f.properties.ID);
  const distance = geojson_combined.reduce((acc, feat)=> {
    return acc + feat.properties[cost_field];
  }, 0);

  segments.sort((a,b)=> a-b);

  const route = {
    "type": "FeatureCollection",
    "features": geojson_combined
  };
  return {distance, segments, route};
}

function* doDijkstra(graph, edge_hash, ref, current, cost_field, direction) {

  const heap = new FibonacciHeap();
  const key_to_nodes = {};

  ref.dist = {};  // distances to each node
  ref.prev = {}; // node to parent_node lookup
  ref.visited = {}; // node has been fully explored
  ref.dist[current] = 0;

  do {

    if(debug) {
      console.log(direction);
      console.log({current});
      console.time('bi-di');
    }

    graph[current].forEach(node => {
      if(ref.visited[node]) {
        return;
      }
      const segment_distance = edge_hash[`${current}|${node}`].properties[cost_field];
      const proposed_distance = ref.dist[current] + segment_distance;
      if (proposed_distance < getComparator(ref.dist[node])) {
        if(ref.dist[node] !== undefined) {
          heap.decreaseKey(key_to_nodes[node], proposed_distance);
        } else {
          key_to_nodes[node] = heap.insert(proposed_distance, node);
        }
        ref.dist[node] = proposed_distance;
        ref.prev[node] = current;
      }
    });
    ref.visited[current] = true;

    // get lowest value from heaps
    const elem = heap.extractMinimum();
    if(debug) {
      console.log(direction, elem.key, elem.value);
    }
    if(elem) {
      current = elem.value;
    } else {
      current = '';
      return '';
    }

    if(debug){
      console.log('bh length', bh.length());
      console.log('edges', graph[current].length);
      console.timeEnd('bi-di');
      console.log('=======');
    }

    yield current

  } while (true)
}
