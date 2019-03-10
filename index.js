
const fs = require('fs').promises;
const FibonacciHeap = require('@tyriar/fibonacci-heap').FibonacciHeap;

const debug = false;
const save_output = false;

exports.toEdgeHash = toEdgeHash;
exports.toAdjacencyList = toAdjacencyList;
exports.connectedComponents = connectedComponents;
exports.runDijkstra = runDijkstra;
exports.toBestRoute = toBestRoute;
exports.getComparator = getComparator;
exports.getShortestPath = getShortestPath;

function toAdjacencyList(geo) {

  const features = Array.isArray(geo) ? geo : geo.features;

  const adjacency_list = {};

  features.forEach(feature => {
    const coordinates = feature.geometry.coordinates;
    if (!coordinates) {
      return;
    }
    if(!feature.properties) {
      console.log('no features adj');
      return;
    }
    if(!feature.properties.MILES) {
      console.log('NO MILES adj');
      return;
    }
    const start_vertex = coordinates[0].join(',');
    const end_vertex = coordinates[coordinates.length - 1].join(',');

    if (!adjacency_list[start_vertex]) {
      adjacency_list[start_vertex] = [end_vertex];
    } else {
      adjacency_list[start_vertex].push(end_vertex);
    }

    if (!adjacency_list[end_vertex]) {
      adjacency_list[end_vertex] = [start_vertex];
    } else {
      adjacency_list[end_vertex].push(start_vertex);
    }

  });

  return adjacency_list;
}

function toEdgeHash(geo) {

  const features = Array.isArray(geo) ? geo : geo.features;

  const edge_hash = {};

  features.forEach(feature => {
    const coordinates = feature.geometry.coordinates;
    if (!coordinates) {
      console.log("No Coords eh");
      return;
    }
    if(!feature.properties.MILES) {
      console.log("NO MILES eh")
    }
    const start_vertex = coordinates[0].join(',');
    const end_vertex = coordinates[coordinates.length - 1].join(',');

    edge_hash[`${start_vertex}|${end_vertex}`] = feature;
    edge_hash[`${end_vertex}|${start_vertex}`] = feature;
  });

  return edge_hash;
}


function connectedComponents(geo) {

  const features = Array.isArray(geo) ? geo : geo.features;

  // create an adjacency list from GeoJSON data
  const adjacencyList = toAdjacencyList(features);

  // get a list of all nodes
  const nodeList = Object.keys(adjacencyList);

  // initialize explored list to 0 for all nodes
  // will keep track of connected component
  const explored = nodeList.reduce((acc, value) => {
    acc[value] = 0;
    return acc;
  }, {});

  let connected_component = 0;
  let component_count = 0;
  const cc_results = [];

  // loop through node list, making sure they are all explored.
  // Depth first search
  nodeList.forEach(node => {
    if (!explored[node]) {

      connected_component++;

      explore(node);

      // reset connected component
      cc_results.push({cc: connected_component, count: component_count});
      component_count = 0;
    }
  });

  // recursively search all nodes
  function explore(vertex) {
    component_count++;
    explored[vertex] = connected_component;
    adjacencyList[vertex].forEach(v => {
      if (!explored[v]) {
        explore(v);
      }
    });
  }

  // return lookup of connected component to size rank
  const ranked_lookup = rankResults(cc_results);

  // create copy of geo data with connected component rank
  return features.map(feature => {
    const start_pt = feature.geometry.coordinates[0];
    const properties = {...feature.properties, __groupId: ranked_lookup[explored[start_pt]]};
    return Object.assign({}, feature, {properties});
  });

}

function rankResults(results) {
  const sorted = [...results].sort((a, b) => {
    return b.count - a.count;
  });

  return sorted.reduce((acc, value, index) => {
    acc[value.cc] = index + 1;
    return acc;
  }, {});
}

//

function runDijkstra(adj_list, edge_hash, start, end, cost_field, vertex) {

  if(debug) {
    console.log('dij', {start, end, vertex});
  }

  const heap = new FibonacciHeap();
  const key_to_nodes = {};

  const dist = {};  // distances to each node
  const prev = {}; // node to parent_node lookup
  const visited = {}; // node has been fully explored

  let current = start;
  dist[start] = 0;

  do {
    adj_list[current]
      .filter(node => {
        // maybe not necessary?
        return node !== vertex;
      })
      .forEach(node => {
        // maybe not necessary?
        if(visited[node]) {
          return;
        }
        const segment_distance = edge_hash[`${current}|${node}`].properties[cost_field];
        if(!segment_distance){
          console.log('aggggg Dijkstra');
          console.log(edge_hash[`${current}|${node}`]);
          console.log(current, node);
          process.exit();
        }
        const proposed_distance = dist[current] + segment_distance;
        if (proposed_distance < getComparator(dist[node])) {
          if (dist[node] !== undefined) {
              heap.decreaseKey(key_to_nodes[node], proposed_distance);
          } else {
            key_to_nodes[node] = heap.insert(proposed_distance, node);
          }
          dist[node] = proposed_distance;
          prev[node] = current;
        }
      });
    visited[current] = true;

    // get lowest value from heap
    const elem = heap.extractMinimum();

    if(elem) {
      current = elem.value;
    } else {
      if(debug){
        console.log('NO PATH!');
      }
      current = ''; // no path
    }

    // exit early if current node becomes end node
    if (current === end) {
      current = '';
    }

  } while (current);

  const route = toBestRoute(end, prev, edge_hash);

  if(save_output){
   fs.writeFile('./single_dijkstra.geojson', JSON.stringify(route), 'utf8');
  }

  const segments = route.features.map(f=> f.properties.ID);
  const distance = route.features.reduce((acc, feat)=> {
    return acc + feat.properties[cost_field];
  }, 0);

  segments.sort((a,b)=> a-b);

  return {distance, segments, route};
}

function toBestRoute(end_pt, prev, edge_hash) {

  const features = [];

  while (prev[end_pt]) {
    features.push(edge_hash[`${end_pt}|${prev[end_pt]}`]);
    end_pt = prev[end_pt];
  }

  return {
    "type": "FeatureCollection",
    "features": features
  };

}

function getComparator(dist_node){
  // excessive check necessary to distinguish undefined from 0
  // (dist[node] can on rare circumstances be 'start')
  if(dist_node === 0) {
    return 0;
  }
  if(dist_node === undefined){
    return Infinity;
  }

  return dist_node;
}


function getShortestPath(start, forward_dist, forward_prev, forward_visited, end, backward_dist, backward_prev, backward_visited) {
  let distance = Infinity;
  let bestNode = null;

  let processedNodes = new Set([...Object.keys(forward_visited), ...Object.keys(backward_visited)]);
  processedNodes.forEach(u=> {
    const dist = forward_dist[u] + backward_dist[u];
    if(dist < distance) {
      bestNode = u;
      distance = dist;
    }
  });

  return bestNode;
}