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

function _sum(arr) {
  if (arr === null) { return 0; }

  return arr.reduce(function(acc, value) {
    return acc + value;
  }, 0);
}

_baseDeck = [6,6,6,6,6,6,5,5,4,4,3,3,2,2,1,1];

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

    for (var i=0; i<this.historyStack; i++) {
      var move = this.historyStack[i];
      if (move.action === 'play') {
        pile.push(move.rank);
      } else if (move.action === 'take') {
        values[i % 2] += pile.pop();
      }
    }

    return values;
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
        throw new Error('Player ' + (currentPlayer + 1) + ' attempted to play '
                        + 'an invalid value of: ' + move.rank);
      }

      _removeValue(clone._hands[clone.currentPlayer], move.rank);
    } else if (move.action === 'take') {
      var pile = clone.computePile();

      if (pile.length < 1) {
        throw new Error('Player ' + (currentPlayer + 1) + ' attempted to take '
                        + 'from the pile when it was empty');
      }

      clone._hands[clone.currentPlayer].push(pile(pile.length-1));
    } else if (move.action === 'discard') {
      if (clone._hands[clone.currentPlayer].indexOf(6) === -1) {
        throw new Error('Player ' + (currentPlayer + 1) + ' attempted to '
                        + 'discard when they had no sixes.');
      }
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

function RoundOutcome(roundState, playerOne, playerTwo) {
  if (roundState.continuing) {
    throw new Error('Don\'t construct a RoundOutcome until a game has finished');
  }

  this.roundState = roundState;
  this.playerOne = playerOne;
  this.playerTwo = playerTwo;
}

RoundOutcome.prototype = {
  getWinner: function() {
    if (this.roundState.winner === 0) {
      return this.playerOne;
    } else {
      return this.playerTwo;
    }
  },
  endedInFold: function() {
    if (this.roundState.continuing) {
      throw Error('Can not determine fold-state before a round is done.');
    }

    var lastStackIdx = this.roundState.historyStack.length - 1;
    return this.roundState.historyStack[lastStackIdx].action === 'fold';
  },

}

function GameOutcome(players, starter) {
  this.starter = starter;
  this._scores = [0, 0];
  this._rounds = [];
  this._players = players;
}

GameOutcome.prototype = {
  recordRound: function(roundOutcome) {
    var winnerIdx = this._players.indexOf(roundOutcome.getWinner());

    this._rounds.push(roundOutcome);
    if (roundOutcome.endedInFold()) {
      this._scores[winnerIdx] += 1;
    } else {
      this._scores[winnerIdx] += 2;
    }
  },
  continuing: function() {
    return this._scores.filter(function(x) { return x>=6; }).length === 0;
  },
  getWinner: function() {
    if (this.continuing()) {
      throw new Error('Game not finished yet.');
    }

    return this._players[(this._scores[0]>=6) ? 0 : 1];
  }
}

function Controller(player1, player2, options) {
  this._players = [player1, player2];
}

Controller.prototype = {
  runOneGame: function() {
    var startingPlayerIdx = ~~(Math.random()*2),
    outcome = new GameOutcome(this._players, startingPlayerIdx);

    while (outcome.continuing()) {
      var roundOutcome = this.runOneRound(
        this._players[startingPlayerIdx],
        this._players[(startingPlayerIdx + 1) % 2]);

      outcome.recordRound(roundOutcome);
      startingPlayer = this._players.indexOf(roundOutcome.getWinner());
    }

    return outcome;
  },
  runOneRound: function(playerOne, playerTwo) {
    var currentState = new RoundState(),
      playerList = [playerOne, playerTwo];

    playerOne.startRound(0);
    playerTwo.startRound(1);

    while (currentState.continuing) {
      var currentPlayer = currentState.currentPlayer,
        stateForPlayer = currentState.perspectiveClone(currentPlayer),
        move = playerList[currentPlayer].nextMove(stateForPlayer);

      currentState = currentState.runMove(move);
    }

    return new RoundOutcome(currentState, playerOne, playerTwo);
  }
}

module.exports = Controller;
