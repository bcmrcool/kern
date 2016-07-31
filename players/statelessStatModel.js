var RoundState = require('../RoundState');

function _assertArrEq(a,b) {
  if (a.length !== b.length) {
    throw new Error('Arrays were of unequal length');
  }

  for (var i=0; i<a.length; i++) {
    if (a[i] !== b[i]) {
      throw new Error('Arrays ' + a + ' and ' + b + ' differ. First variance ' +
                      'at index ' + i + '.');
    }
  }
}

var _baseDeck = [6,6,6,6,6,6,5,5,4,4,3,3,2,2,1,1];

function computeUnseenCards(state) {
  // given a game state compute the union of the out-of-game cards and the
  // non-current player's hand.
  var possibilities = _baseDeck.slice(0),
    currentHand = state._hands[state.currentPlayer];

  for (var i=0; i<currentHand.length; i++) {
    possibilities.splice(possibilities.indexOf(currentHand[i]), 1);
  }

  var move;
  for (var i=0; i<state.historyStack.length; i++) {
    move = state.historyStack[i];

    if (move.action === 'play') {
      possibilities.splice(possibilities.indexOf(move.rank), 1);
    } else if (move.action === 'discard') {
      possibilities.splice(possibilities.indexOf(6), 1);
    }
  }

  return possibilities;
}

function Player() {
  this._playerIdx = null;
};

Player.prototype = {
  name: 'statelessStatModel',
  startRound: function(idx) {
    this._playerIdx = idx;
  },
  nextMove: function(gameState) {
    throw new Error('Not implemented yet');
  },
  testSelf: function() {
    var rs = new RoundState();

    rs._hands = [[6,6,6,6,6,3], [5,5,4,4,3,6], [2,2,1,1]];

    _assertArrEq([5,5,4,4,3,6,2,2,1,1].sort(), computeUnseenCards(rs).sort());

    rs = rs
      .runMove({action: 'play', rank: 6})
      .runMove({action: 'play', rank: 5});

    _assertArrEq([5,4,4,3,6,2,2,1,1].sort(), computeUnseenCards(rs).sort());

    rs = rs
      .runMove({action: 'play', rank: 6})
      .runMove({action: 'discard'})

    _assertArrEq([5,4,4,3,2,2,1,1].sort(), computeUnseenCards(rs).sort());
  }
};

module.exports = Player;
