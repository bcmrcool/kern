var _baseDeck = [6,6,6,6,6,6,5,5,4,4,3,3,2,2,1,1];

function _sum(arr) {
  if (arr === null) { return 0; }

  return arr.reduce(function(acc, value) {
    return acc + value;
  }, 0);
}

function _shuffle(arr) {
  // FY shuffle an array in place
  var j, tmp;
  for (var i=arr.length - 1; i>0; i--) {
    j = ~~(Math.random() * (i + 1));
    tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  return arr;
}

function _removeValue(arr, value) {
  for (var i=0; i<arr.length; i++) {
    if (arr[i] === value) {
      arr.splice(i, 1);
      return arr;
    }
  }

  throw new Error('Attempted to remove value ' + value + ' from array: ' + arr);
}

function RoundState(historyStack, currentPlayer, hands) {
  this.historyStack = historyStack || [];
  this.currentPlayer = currentPlayer || 0;
  this.continuing = true;
  this.winner = null;
  this._hands = hands || this._generateHands();
}

RoundState.prototype = {
  _generateHands: function() {
    // Returns an arrray of the standard deck partitioned into 3 sub arrays of
    // length 6, 6, and 4 (two hands and the non-playable cards)
    var deck = _baseDeck.slice(0);
    _shuffle(deck);

    return [deck.slice(0,6), deck.slice(6,12), deck.slice(12)];
  },
  _op: function() {
    // Returns the index of the player that isn't the current player
    return (this.currentPlayer + 1) % 2;
  },
  computeInitialHands: function() {
    var hands = [this._hands[0].slice(0), this._hands[1].slice(0)];

    for (var i=0; i<this.historyStack.length; i++) {
      if (this.historyStack[i].action === 'play') {
        hands[i % 2].push(this.historyStack[i].rank); 
      } else if (this.historyStack[i].action === 'discard') {
        hands[i % 2].push(6); 
      }

    }

    return hands;
  },
  computePile: function() {
    var pile = [];

    for (var i=0; i<this.historyStack.length; i++) {
      var move = this.historyStack[i];
      if (move.action === 'play') {
        pile.push(move.rank);
      } else if (move.action === 'take') {
        pile.pop();
      }
    }

    return pile;
  },
  computePileValue: function() {
    return _sum(this.computePile());
  },
  computePlayerValues: function() {
    var values = this._hands.map(_sum);
    var pile = [];

    for (var i=0; i<this.historyStack.length; i++) {
      var move = this.historyStack[i];
      if (move.action === 'play') {
        pile.push(move.rank);
      } else if (move.action === 'take') {
        values[i % 2] += pile.pop();
      }
    }

    return values;
  },
  computeCourts: function() {
    var courts = [[],[]],
      pile = [];

    for (var i=0; i<this.historyStack.length; i++) {
      if (this.historyStack[i].action === 'play') {
        pile.push(this.historyStack[i].rank);
      } else if (this.historyStack[i].action === 'take') {
        courts[i % 2].push(pile.pop());
      }
    }

    return courts;
  },
  computeCourtValues: function() {
    return this.computeCourts().map(_sum);
  },
  clone: function() {
    return new RoundState(
      this.historyStack.slice(0),
      this.currentPlayer,
      [this._hands[0].slice(0), this._hands[1].slice(0)]);
  },
  perspectiveClone: function(perspective) {
    // Return the game state except without hand information for the opponent
    // to player with index `perspective`.
    var clone = this.clone();
    clone._hands[(perspective + 1) % 2] = null;

    return clone;
  },
  runMove: function(move) {
    // Takes a move object and returns a new game state.
    var clone = this.clone();

    if (move.action === 'play') {
      if (!Number.isInteger(move.rank) || move.rank < 1 || move.rank > 6) {
        throw new Error('Player ' + (this.currentPlayer + 1) + ' attempted ' +
                        'to play an invalid value of: ' + move.rank);
      }

      _removeValue(clone._hands[clone.currentPlayer], move.rank);
    } else if (move.action === 'take') {
      var pile = clone.computePile();

      if (pile.length < 1) {
        throw new Error('Player ' + (clone.currentPlayer + 1) + ' attempted ' +
                        'to take from the pile when it was empty.');
      }
    } else if (move.action === 'discard') {
      console.log(clone._hands[clone.currentPlayer]);
      if (clone._hands[clone.currentPlayer].indexOf(6) === -1) {
        throw new Error('Player ' + (clone.currentPlayer + 1) + ' attempted to '
                        + 'discard when they had no sixes.');
      }

      _removeValue(clone._hands[clone.currentPlayer], 6);
    } else if (move.action === 'knock') {
      clone.continuing = false;

      var pileValue = clone.computePileValue();
      var playerValues = clone.computePlayerValues();

      if (pileValue < playerValues[clone.currentPlayer]) {
        clone.winner = clone._op();
      } else if (pileValue < playerValues[clone._op()]) {
        clone.winner = clone.currentPlayer;
      } else {
        if (playerValues[clone.currentPlayer] > playerValues[clone._op()]) {
          clone.winner = clone.currentPlayer;
        } else {
          clone.winner = clone._op();
        }
      }
    } else if (move.action === 'fold') {
      clone.continuing = false;
      clone.winner = clone._op();
    } else {
      throw Error('Unrecognized action: ' + move.action);
    }

    clone.historyStack.push(move);
    clone.currentPlayer = this._op();

    return clone;
  },
  _testSelf: function() {
    var rs = new RoundState();
    rs._hands = [[6,6,6,6,6,6], [5,5,4,4,3,3], [2,2,1,1]];

    function _assertEq(a,b) {
      if (a !== b) {
        throw new Error(a + ' was not equal to ' + b);
      }
    }

    var rs = rs
      .runMove({action: 'play', rank: 6})
      .runMove({action: 'play', rank: 5})
      .runMove({action: 'play', rank: 6})
      .runMove({action: 'play', rank: 5})
      .runMove({action: 'play', rank: 6})
      .runMove({action: 'knock'})

    _assertEq(rs.winner, 0);
  }
}

module.exports = RoundState;
