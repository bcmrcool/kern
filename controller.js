var RoundState = require('./RoundState');

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

function extend() {
  for (var i=1; i<arguments.length; i++) {
    for (var prop in arguments[i]) {
      arguments[0][prop] = arguments[i][prop];
    }
  }

  return arguments[0];
}

var defaults = {
  outputPlayByPlay: false
}

function Controller(player1, player2, options) {
  this._players = [player1, player2];
  this._options = extend({}, defaults, options);
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
    var currentState = new RoundState();

    playerOne.startRound(0);
    playerTwo.startRound(1);

    return this.continueRound(currentState, playerOne, playerTwo);
  },
  runRoundWithHands: function(hands, playerOne, playerTwo) {
    var currentState = new RoundState();

    currentState._hands = hands;

    playerOne.startRound(0);
    playerTwo.startRound(1);

    return this.continueRound(currentState, playerOne, playerTwo);
  },
  continueRound: function(currentState, playerOne, playerTwo) {
    var initialHands = currentState._hands,
      playerList = [playerOne, playerTwo],
      i = 0;

    while (currentState.continuing) {
      var currentPlayer = currentState.currentPlayer,
        stateForPlayer = currentState.perspectiveClone(currentPlayer),
        move = playerList[currentPlayer].nextMove(stateForPlayer);

      if (this._options.outputPlayByPlay) {
        var courts = currentState.computeCourts(),
          values = currentState.computePlayerValues(),
          pile = currentState.computePile();

        console.log('\n\nTurn ', i, '\n-------');
        console.log('Pile:', pile, '(' + currentState.computePileValue() + ')');
        console.log(playerOne.name + '(' + values[0] + ')',
                    '- Hand:', currentState._hands[0],
                    '- Court:', courts[0]);
        console.log(playerTwo.name + '(' + values[1] + ')',
                    '- Hand:', currentState._hands[1],
                    '- Court:', courts[1]);
        var currentPlayerName = playerList[currentPlayer].name,
          moveDescription;
        if (move.action === 'play') {
          moveDescription = currentPlayerName + ' plays a ' + move.rank;
        } else if (move.action === 'discard') {
          moveDescription = currentPlayerName + ' discards';
        } else if (move.action === 'take') {
          moveDescription = currentPlayerName + ' takes a ' + pile[pile.length-1];
        } else if (move.action === 'fold') {
          moveDescription = currentPlayerName + ' folds';
        } else if (move.action === 'knock') {
          moveDescription = currentPlayerName + ' knocks';
        }

        console.log(moveDescription, '\n');
        i++;
      }

      //console.log(currentState._hands);
      //console.log(currentState._hands[0].reduce(function(a,b){return a+b;}, 0),
      //            currentState._hands[1].reduce(function(a,b){return a+b;}, 0));
      //console.log('pile:', currentState.computePileValue());
      //console.log(move);
      //console.log('~~~~~~~~~~~~~~~~~~~');
      currentState = currentState.runMove(move);
    }

    return new RoundOutcome(currentState, playerOne, playerTwo, initialHands);
  }
}

module.exports = Controller;
