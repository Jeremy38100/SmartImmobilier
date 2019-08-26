window.onload = function() {
  start(); 
}

async function start() {
  const data = await load('data.json');
  const chart = c3.generate({
    bindto: '#chart',
    data: {
      columns: [
        data
      ]
    }
  });
}

function load(url) {
  return new Promise(resolve => {
    d3.json(url, resolve);
  })
}