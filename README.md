# geojson-to-adjacency-list
Convert a GeoJSON LineString network to an adjacency list.


Given a GeoJSON LineString dataset, create;
 - An Adjacency List
 - An Edge Hash
 - Connected Component Attribute

**Usage**

```
const fs = require('fs').promises;
const { toAdjacencyList, toEdgeHash, connectedComponents } = require('geojson-to-adjacency-list');

main();

async function main() {

  const geojson_raw = await fs.readFile('./sample.geojson');

  const geojson = JSON.parse(geojson_raw);

  const adjacency_list = toAdjacencyList(geojson);
  const edge_has = toEdgeHash(geojson);
  const components = connectedComponets(geojson);
  
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

**Edge Hash** Output Example:

```
[
  {
    "type": "Feature",
    "properties": {
      "ID": 162942
      "__groupId": 1 // the sub-network size rank of the LineString
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
  {
    "type": "Feature",
    "properties": {
      "ID": 152116,
      "__groupId": 1
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-122.248176, 37.80973],
        [-122.247834, 37.810009]
      ]
    }
  },
  {
    "type": "Feature",
    "properties": {
      "ID": 158828,
      "__groupId": 1
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
]

```

