//
let debug = false;

const fs = require('fs');
// const links = [];

const FibonacciHeap = require('@tyriar/fibonacci-heap').FibonacciHeap;

const {toAdjacencyList, toEdgeHash, runDijkstra} = require('./index.js');

exports.contractGraph = contractGraph;

function contractGraph(geojson, options) {

  const cost_field = options.cost_field;

  const adjacency_list = toAdjacencyList(geojson);
  const edge_hash = toEdgeHash(geojson);
  const bh = new FibonacciHeap();
  const key_to_nodes = {};

  const ih = new FibonacciHeap();
  const key_to_nodes_extra = {};


  const contracted_nodes = {};

  const clen = Object.keys(adjacency_list).length;
  // create an additional node ordering
  Object.keys(adjacency_list).forEach((vertex, i) => {
    console.log(i / clen);
    const score = getVertexScore(vertex);
    key_to_nodes[vertex] = bh.insert(score, vertex);
    key_to_nodes_extra[vertex] = ih.insert(score, vertex);
  });

  // const ordered = [];
  //
  // while(ih.size() > 0) {
  //   const item = ih.extractMinimum();
  //   ordered.push(item);
  // }

  // const ifeatures = ordered.map((element, index) => {
  //   return {
  //     "type": "Feature",
  //     "properties": {
  //       "rank": index + 1,
  //       "coords": element.value,
  //       "score": element.key
  //     },
  //     "geometry": {
  //       "type": "Point",
  //       "coordinates": element.value.split(',').map(k => Number(k))
  //     }
  //   };
  // });
  //
  //
  // const initial = {
  //   "type": "FeatureCollection",
  //   "features": ifeatures
  // };
  //
  // fs.writeFileSync('./initial_rank.geojson', JSON.stringify(initial), 'utf8');

  function getVertexScore(v) {
    const shortcut_count = contract(v, true);
    const edge_count = adjacency_list[v].length;
    const edge_difference = shortcut_count - edge_count;
    const contracted_neighbors = getContractedNeighborCount(v);
    return edge_difference + contracted_neighbors;
  }

  function getContractedNeighborCount(v) {
    return adjacency_list[v].reduce((acc, node) => {
      const is_contracted = contracted_nodes[node] ? 1 : 0;
      return acc + is_contracted;
    }, 0);
  }

  let contraction_level = 1;

  // main contraction loop
  while (bh.size() > 0) {

    console.log(bh.size());

    // recompute to make sure that first node in priority queue
    // is still best candidate to contract
    let found_lowest = false;
    let node_obj = bh.findMinimum();
    const old_score = node_obj.key;
    do {
      const first_vertex = node_obj.value;
      const new_score = getVertexScore(first_vertex);
      if (new_score > old_score) {
        // insertKey equivalent.  (remove and insert)
        bh.delete(node_obj);
        key_to_nodes[first_vertex] = bh.insert(new_score, first_vertex);
      }
      node_obj = key_to_nodes[first_vertex];
      if (node_obj.value === first_vertex) {
        found_lowest = true;
      }
    } while (found_lowest === false);

    // lowest found, pop it off the queue and contract it
    const v = bh.extractMinimum();
    contract(v.value, false);
    // keep a record of contraction level of each node
    contracted_nodes[v.value] = contraction_level;
    contraction_level++;
  }

  // const viz = {
  //   "type": "FeatureCollection",
  //   "features": links
  // };
  //
  // fs.writeFileSync('./geohash.geojson', JSON.stringify(viz), 'utf8');

  // const features = Object.keys(contracted_nodes).map(key => {
  //   return {
  //     "type": "Feature",
  //     "properties": {
  //       "rank": contracted_nodes[key],
  //       "coords": key,
  //     },
  //     "geometry": {
  //       "type": "Point",
  //       "coordinates": key.split(',').map(k => Number(k))
  //     }
  //   };
  // });
  //
  //
  // const viz2 = {
  //   "type": "FeatureCollection",
  //   "features": features
  // };
  //
  // fs.writeFileSync('./rankspts.geojson', JSON.stringify(viz2), 'utf8');

// remove links to lower ranked nodes
  Object.keys(adjacency_list).forEach(from_coords => {
    const from_rank = contracted_nodes[from_coords];
    adjacency_list[from_coords] = adjacency_list[from_coords].filter(to_coords => {
      const to_rank = contracted_nodes[to_coords];
      return from_rank < to_rank;
    });
  });

  return [adjacency_list, edge_hash, contracted_nodes];

  // this function is multi-use:  actually contract a node  OR
  // with `get_count_only = true` find number of shortcuts added
  // if node were to be contracted
  function contract(v, get_count_only) {
    if (!get_count_only && debug) {
      console.log('-------------------------------------');
      console.log('contract: ' + v);
    }

    const connections = adjacency_list[v]
      .filter(c => {
        return !contracted_nodes[c];
      });
    let shortcut_count = 0;

    // Get all pairs of edges
    const combinations = [];
    connections.forEach(u => {
      connections.forEach(w => {
        // ignore point to itself, and reverse path
        if (u === w || combinations.includes(`${w}|${u}`)) {
          return;
        }
        combinations.push(`${u}|${w}`);
      });
    });

    if (!get_count_only && debug) {
      console.log({combinations});
    }

    // shortcut distance for each path
    combinations.forEach(c => {
      if (!get_count_only && debug) {
        console.log('combination: ' + c);
      }
      const [u, w] = c.split('|');
      // dist u to v
      const dist1 = edge_hash[`${u}|${v}`].properties[cost_field];
      // dist v to w
      const dist2 = edge_hash[`${v}|${w}`].properties[cost_field];
      const total = dist1 + dist2;

      // get dijkstra shortest path distance for u to w
      const path = runDijkstra(adjacency_list, edge_hash, u, w, cost_field, v);
      const dijkstra = path.distance || Infinity;
      // Infinity does happen - what are the consequences
      if (!get_count_only && debug) {
        console.log({u, w, v});
        console.log({path});
        console.log({total});
        console.log({dijkstra});
      }

      if (total < dijkstra) {
        if (!get_count_only && debug) {
          console.log('shortcut !');
        }

        shortcut_count++;

        if (!get_count_only) {
          adjacency_list[u].push(w);
          adjacency_list[w].push(u);

          const seg1_id = edge_hash[`${u}|${v}`].properties.ID;
          const seg2_id = edge_hash[`${v}|${w}`].properties.ID;

          // const link = {
          //   "type": "Feature",
          //   "properties": {
          //     "distance": total,
          //     "coords1": seg1_id,
          //     "coords2": seg2_id,
          //   },
          //   "geometry": {
          //     "type": "LineString",
          //     "coordinates": [u.split(',').map(k => Number(k)), w.split(',').map(k => Number(k))]
          //   }
          // };
          //
          // links.push(link);

          edge_hash[`${u}|${w}`] = {
            "properties": {
              [cost_field]: total,
              ID: `${seg1_id},${seg2_id}`
            }
          };

          edge_hash[`${w}|${u}`] = {
            "properties": {
              [cost_field]: total,
              ID: `${seg1_id},${seg2_id}`
            }
          };

        }
      }
    });

    return shortcut_count;

  }
}