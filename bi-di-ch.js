
const fs = require('fs');
const toBestRoute = require('./index.js').toBestRoute;
const getComparator = require('./index.js').getComparator;
const FibonacciHeap = require('@tyriar/fibonacci-heap').FibonacciHeap;
const getShortestPath = require('./index.js').getShortestPath;

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


  if(start === end) {
    return {distance: 0, segments: [], route: {
        "type": "FeatureCollection",
        "features": []
      }};
  }

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

  } while (!forward_done && !backward_done);

  const shortest_common_node = getShortestPath(start, forward.dist, forward.prev, forward.visited, end, backward.dist, backward.prev, backward.visited);

  const geojson_forward = toBestRoute(shortest_common_node, forward.prev, edge_hash);
  const geojson_backward = toBestRoute(shortest_common_node, backward.prev, edge_hash);

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

    // fs.writeFileSync('./path1.geojson', JSON.stringify(fc), 'utf8');
    // fs.writeFileSync('./path2.geojson', JSON.stringify(bc), 'utf8');

  const geojson_combined = [...fc.features, ...bc.features];
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

function* doDijkstra(graph, edge_hash, ref, current, cost_field, node_rank, direction) {

  const heap = new FibonacciHeap();
  const key_to_nodes = {};

  ref.dist = {};  // distances to each node
  ref.prev = {}; // node to parent_node lookup
  ref.visited = {}; // node has been fully explored
  ref.dist[current] = 0;

  do {
    const current_rank = node_rank[current];

    if(debug) {
      console.log('');
      console.log('starting new loop');
      console.log({direction});
      console.log({current, current_rank});
      console.time('bi-di-ch');
      console.log('edges', graph[current].length);
      console.log('for each edge from current node:');
    }


    graph[current].forEach(node => {
      if(debug){
        console.log('processing edge:');
        console.log({node, node_rank: node_rank[node], current_rank});
      }
      // todo below?
      // if(ref.visited[node]) {
      //   return;
      // }
      // console.log(node_rank[node], current_rank, direction);
      if(node_rank[node] < current_rank) {
        if(debug){
          console.log('edge is downward sloping');
          console.log('reject', {node});
        }
        return;
      }
      const segment_distance = edge_hash[`${current}|${node}`].properties[cost_field];
      const proposed_distance = ref.dist[current] + segment_distance;
      if(debug){
        console.log('the distance to the current node is: ', ref.dist[current]);
        console.log(`edge has an id of: ${edge_hash[`${current}|${node}`].properties.ID}`);
        console.log('edge has cost of :', {segment_distance});
        console.log('so the distance to the end of the edge would be:', {proposed_distance});
        console.log('the current estimated distance to the end of the edge via another path is: ', ref.dist[node]);
      }
      if (proposed_distance < getComparator(ref.dist[node])) {
        if(debug) {
          console.log('the new route is smaller!');
        }
        if(ref.dist[node] !== undefined) {
          heap.decreaseKey(key_to_nodes[node], proposed_distance);
        } else {
          key_to_nodes[node] = heap.insert(proposed_distance, node);
        }
        ref.dist[node] = proposed_distance;
        ref.prev[node] = current;
      } else {
        if(debug){
          console.log('but the new route was not smaller');
        }
      }
    });
    ref.visited[current] = true;

    // get lowest value from heaps
    const elem = heap.extractMinimum();

    if(elem) {
      current = elem.value;
      if(debug) {
        console.log(direction, elem.key, elem.value);
      }
    } else {
      current = '';
      return '';
    }

    if(debug) {
      console.log('end of loop');
      console.log('heap size', heap.size());
      console.timeEnd('bi-di-ch');
      console.log('------');
    }

    yield current

  } while (true);

}