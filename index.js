const express = require('express');
const app = express();
const { readFileSync } = require('fs');
const PORT = process.env.PORT || 3000;
const FILE_NAME = 'cities_canada-usa.tsv';
const CITIES = tsvJSON();

app.get('/suggestions', async ({ query }, res) => {
    const { q, latitude, longitude } = query;
    if (!q) {
      return res.status(400).json({
        suggestions: [],
        message: 'Missing q parameter for searching'
      });
    }

    const results = CITIES.filter(city => city.name?.includes(q));
    const suggestions = results.map(city => ({
      name: `${city.name}, ${city.admin1}, ${city.country}`,
      latitude: city.lat,
      longitude: city.long,
      score: scoreSuggestion(q.length, city, latitude, longitude)
    }));

    res.status(200).json({
      suggestions
    });
});

function scoreSuggestion(query, city, latitude, longitude) {
  const queryPrecentage = query / city.name.length;
  if (!latitude && !longitude) {
    return queryPrecentage.toFixed(1);
  }
  
  const prectage = (10 - Math.sqrt(Math.pow(city.long - longitude, 2) + Math.pow(city.lat - latitude, 2))) / 10;
  return ((queryPrecentage + prectage) / 2).toFixed(1);
}

function tsvJSON() {
    const tsvTextBuffer = readFileSync(`${__dirname}/${FILE_NAME}`);
    const tsvText = tsvTextBuffer.toString();
    const lines = tsvText.split('\n');
    const headers = lines.slice(0, 1)[0].split('\t');
    return lines.slice(1, lines.length).map(line => {
      const data = line.split('\t');
      return headers.reduce((obj, nextKey, index) => {
        obj[nextKey] = data[index];
        return obj;
      }, {});
    });
}

app.listen(PORT, () => { 
    console.log(`Server is running on port ${PORT}`);
});