
const fs = require('fs').promises;
const toBestRoute = require('./index.js').toBestRoute;
const FibonacciHeap = require('@tyriar/fibonacci-heap').FibonacciHeap;

const debug = false;
const save_output = false;

exports.runBiDijkstra = runBiDijkstra;
exports.toIdList = toIdList;

function toIdList(geojson) {
  const obj = {};

  geojson.features.forEach(feature=> {
    obj[feature.properties.ID] = feature;
  });

  return obj;
}

function runBiDijkstra(adj_list, edge_hash, start, end, cost_field, node_rank, id_list) {

  // TODO this is not guaranteed to be an optimal solution (yet)

  const forward = {};
  const backward = {};

  const searchForward = doDijkstra(adj_list, edge_hash, forward, start, cost_field, node_rank, 'forward');
  const searchBackward = doDijkstra(adj_list, edge_hash, backward, end, cost_field, node_rank, 'backward');

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

    console.log('forward');
    const ff = geojson_forward.features.reduce((acc, g) => {
      const id = g.properties.ID;
      if(typeof id === "string") {
        const nums = id.split(',');
        acc = [...acc, ...nums];
      } else if(typeof id === "number") {
        acc.push(String(id));
      }
      return acc;
    }, []);

    console.log('backward');
    const bb = geojson_backward.features.reduce((acc, g) => {
      const id = g.properties.ID;
      if(typeof id === "string") {
        const nums = id.split(',');
        acc = [...acc, ...nums];
      } else if(typeof id === "number") {
        acc.push(String(id));
      }
      return acc;
    }, []);

    const fc = {
      "type": "FeatureCollection",
      "features": ff.map(d=>id_list[d])
    };

    const bc = {
      "type": "FeatureCollection",
      "features": bb.map(d=>id_list[d])
    };

    fs.writeFile('./path1.geojson', JSON.stringify(fc), 'utf8');
    fs.writeFile('./path2.geojson', JSON.stringify(bc), 'utf8');
  }


}

function* doDijkstra(graph, edge_hash, ref, current, cost_field, node_rank, direction) {

  const heap = new FibonacciHeap();
  const key_to_nodes = {};


  ref.dist = {};  // distances to each node
  ref.prev = {}; // node to parent_node lookup

  ref.visited = {}; // node has been fully explored

  Object.keys(graph).forEach(key=> {
    ref.dist[key] = Infinity;
  });

  ref.dist[current] = 0;

  const current_rank = node_rank[current];

  let explored = 0;

  do {
    explored++;

    if(debug) {
      console.log(direction);
      console.log({current, explored});
      console.time('bi-di-ch');
    }

    graph[current].forEach(node => {
      if(debug){
        console.log(node_rank[node], current_rank);
      }
      if(node_rank[node] < current_rank) {
        if(debug){
          console.log('reject', node);
        }
        return;
      }
      const segment_distance = edge_hash[`${current}|${node}`].properties[cost_field];
      const proposed_distance = ref.dist[current] + segment_distance;
      if (proposed_distance < ref.dist[node]) {
        if(ref.dist[node] !== Infinity) {
          heap.decreaseKey(key_to_nodes[node], proposed_distance);
        } else {
          const n = heap.insert(proposed_distance, node);
          key_to_nodes[node] = n;
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

    if(debug) {
      console.log('heap size', heap.size());
      console.log('edges', graph[current].length);
      console.timeEnd('bi-di-ch');
      console.log('------');
    }

    yield current

  } while (true);

}
