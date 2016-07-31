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

function avgReducer(denominator) {
  return (function(acc,x) {
    return acc + (x / denominator);
  });
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
    var self = this,
      opponentIdx = (self._playerIdx + 1) % 2,
      unseenCards = computeUnseenCards(gameState),
      courtValues = gameState.computeCourtValues(),
      avgUnseenCard = unseenCards.reduce(avgReducer(unseenCards.length), 0),
      opponentHandSize = unseenCards.length - 4, 
      expectedOpponentHand = opponentHandSize * avgUnseenCard,
      expectedOpponentValue = expectedOpponentHand + courtValues[opponentIdx],
      myHand = gameState._hands[self._playerIdx],
      myValue = gameState.computePlayerValues()[self._playerIdx],
      pileValue = gameState.computePileValue();

    //console.log('unseen cards:', unseenCards);
    //console.log(avgUnseenCard);
    //console.log('EOV:', expectedOpponentValue);

    if (myValue <= pileValue) {
      if (expectedOpponentValue > pileValue || expectedOpponentValue < myValue) {
        return {action: 'knock'};
      } else {
        return {action: 'take'};
      }
    } else {
      var ranks = myHand.map(function(rank, i) {
        return {
          score: self._rankPlay(gameState, expectedOpponentValue, rank),
          idx: i
        };
      });

      ranks.sort(function(a,b) {
        return b.score - a.score;
      });

      //console.log(ranks);

      if (ranks.length === 0 || ranks[0].score === -4242) {
        return {action: 'fold'};
      } else {
        return {action: 'play', rank: myHand[ranks[0].idx]};
      }
    }
  },
  _rankPlay: function(gameState, expectedOpponentValue, play) {
    var hypValue = gameState.computePlayerValues()[this._playerIdx] - play,
      hypPileValue = gameState.computePileValue() + play;

    if (expectedOpponentValue < hypValue) {
      if (hypValue > hypPileValue) {
        return -4242;
      } else if (hypValue < expectedOpponentValue) {
        // TODO: Heuristic based on opponent variance
        return -4242;
      } else {
        return Math.abs(hypValue - expectedOpponentValue);
      }
    } else {
      // TODO: better to be over than under, skew
      var myDelta = Math.abs(hypValue - hypPileValue),
        opponentDelta = Math.abs(hypPileValue - expectedOpponentValue);

      return opponentDelta - myDelta;
    }
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
