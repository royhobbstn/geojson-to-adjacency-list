# geojson-to-adjacency-list
Convert a GeoJSON LineString network to an adjacency list.


Given a GeoJSON LineString dataset, output an Adjacency List, and an Edge Hash.

**Usage**

```
const fs = require('fs').promises;
const toAdjacencyList = require('geojson-to-adjacency-list');

main();

async function main() {

  const geojson_raw = await fs.readFile('./sample.geojson');

  const geojson = JSON.parse(geojson_raw);

  const [adjacency_list, edge_hash] = toAdjacencyList(geojson);

  const adjPr = fs.writeFile('./adjacency_list.json', JSON.stringify(adjacency_list), 'utf8');
  const edgePr = fs.writeFile('./edge_hash.json', JSON.stringify(edge_hash), 'utf8');

  await Promise.all([adjPr, edgePr]);

  console.log('done!');
}
```

**Adjacency List** output example:

```
{
  "-122.247284,37.809112": [
    "-122.248176,37.80973"
  ],
  "-122.248176,37.80973": [
    "-122.247284,37.809112",
    "-122.247834,37.810009",
    "-122.261054,37.811248"
  ],
  "-122.247834,37.810009": [
    "-122.248176,37.80973",
    "-122.247284,37.810806",
    "-122.24685,37.809249"
  ],
  "-122.235421,37.806529": [
    "-122.232246,37.804412",
    "-122.230896,37.805343",
    "-122.23727,37.807341"
  ]
}
```

**Edge Hash** Output Example:

```
{
  "-122.247284,37.809112|-122.248176,37.80973": {
    "type": "Feature",
    "properties": {
      "ID": 162942
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-122.247284, 37.809112],
        [-122.24746, 37.809089],
        [-122.247918, 37.809272],
        [-122.248153, 37.809548],
        [-122.248176, 37.80973]
      ]
    }
  },
  "-122.248176,37.80973|-122.247834,37.810009": {
    "type": "Feature",
    "properties": {
      "ID": 152116
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-122.248176, 37.80973],
        [-122.247834, 37.810009]
      ]
    }
  },
  "-122.235421,37.806529|-122.232246,37.804412": {
    "type": "Feature",
    "properties": {
      "ID": 158828
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-122.235421, 37.806529],
        [-122.233833, 37.805664],
        [-122.232246, 37.804412]
      ]
    }
  }
}
```

