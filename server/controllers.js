const axios = require('axios')
var stockfish = require('stockfish')
var engine = stockfish();

module.exports.getMoves = (req, res) => {
  axios.get('https://explorer.lichess.ovh/lichess', {
    params:
    {
      variant: 'standard',
      fen: req.query.fen,
      moves: req.query.moves,
      speeds: ["bullet", "blitz", "rapid", "classical"], // should be able to be set by user
      ratings: [1600, 1800, 2000, 2200, 2500] // ^
    }
  })
    .then((response) => {
      res.send(response.data.moves);
    })
    .catch((err) => { console.log('Error getting moves: ', err); res.end() })
}

module.exports.getScore = (req, res) => {
  axios.get('https://lichess.org/api/cloud-eval', {
    params: {
      fen: req.query.fen,
      multiPv: 5
    }
  })
    .then((response) => {
      res.send(response.data)
    })
    .catch((err) => {
      console.log('Error getting score: ', err.response.statusText)
      res.end('not found')
    })
}

module.exports.stockfish = (req, res) => {
  let pvs = [];
  engine.postMessage(`setoption name multipv value ${req.query.multiPv}\\n`)
  engine.postMessage('position fen ' + req.query.fen)
  engine.onmessage = function (event) {
    if (event.split(' ')[2] === '18' /* && event.split(' ')[6] === String(req.query.multiPv)*/) {
      //console.log(event)
      let moves = event.split(' ');
      moves.splice(0, 19);
      moves.splice(10, 30)
      let pvNum = event.split(' ')[6]
      pvs[pvNum - 1] = { moves, cp: event.split(' ')[9] }
      if (pvs.length === Number(req.query.multiPv)) {
        console.log('pvs: ', pvs)
        res.send(pvs)
      }
    }
  }
  engine.postMessage('go to depth 18')
}