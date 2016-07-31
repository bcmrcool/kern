#!/usr/bin/env node

var Controller = require('./controller');


var commands = {
  runOneRound: {
    usage: '<player 1> <player 2>',
    run: function(playerOneName, playerTwoName) {
      var PlayerOne = require('./players/' + playerOneName),
        PlayerTwo = require('./players/' + playerTwoName),
        playerOne = new PlayerOne(),
        playerTwo = new PlayerTwo(),
        controller = new Controller(playerOne, playerTwo),
        outcome = controller.runOneRound(playerOne, playerTwo),
        winner = outcome.getWinner(),
        winnerIdx = (winner===playerOne)?1:2;

      console.log(winner.name + ' (player ' + winnerIdx + ') has won in ' +
                  outcome.roundState.historyStack.length + ' moves.');
    }
  },
  runOneGame: {
    usage: '<player 1> <player 2>',
    run: function(playerOneName, playerTwoName) {
      var PlayerOne = require('./players/' + playerOneName),
        PlayerTwo = require('./players/' + playerTwoName),
        playerOne = new PlayerOne(),
        playerTwo = new PlayerTwo(),
        controller = new Controller(playerOne, playerTwo),
        outcome = controller.runOneGame(),
        winner = outcome.getWinner(),
        winnerIdx = (winner===playerOne)?1:2;

      console.log(winner.name + ' (player ' + winnerIdx + ') has won the game ' +
                  outcome._scores[winnerIdx - 1] + ' to ' +
                  outcome._scores[winnerIdx % 2] + '.');
    }
  },
  runNGames: {
    usage: 'N <player 1> <player 2>',
    run: function(N, playerOneName, playerTwoName) {
      var PlayerOne = require('./players/' + playerOneName),
        PlayerTwo = require('./players/' + playerTwoName),
        playerOne = new PlayerOne(),
        playerTwo = new PlayerTwo(),
        controller = new Controller(playerOne, playerTwo),
        wins = [0, 0],
        starts = [0, 0],
        outcomes = [];

      var singleOutcome, winner, winnerIdx;

      for (var i=0; i<N; i++) {
        singleOutcome = controller.runOneGame();

        outcomes.push(singleOutcome);

        winner = singleOutcome.getWinner();
        winnerIdx = (winner===playerOne)?0:1;

        wins[winnerIdx]++;
        starts[singleOutcome.starter]++;
      }

      console.log('In ' + N + ' trials ' + playerOne.name + ' (player 1) won ' +
                  wins[0] + ' times (' + ~~(wins[0]/N * 100) + '%) and ' +
                  'started ' + starts[0] + ' times (' + ~~(starts[0]/N * 100) +
                  '%) while ' + playerTwo.name + ' (player 2) won ' + wins[1] +
                  ' times (' + ~~(wins[1]/N * 100) + '%) and started ' + starts[1] +
                  ' times (' + ~~(starts[1]/N * 100) + '%).');
    }
  },
  testPlayer: {
    usage: '<player>',
    run: function(playerName) {
      var Player = require('./players/' + playerName),
        player = new Player();

      player.testSelf();
    }
  }
};

function main() {
  var subcommandName = process.argv[2];

  if (!(subcommandName in commands)) {
    console.error('Unrecognized sub command: ' + subcommandName);
    console.error('Usage: ' + process.argv[1] + ' <subcommand>');

    var commandNames = [];
    for (var scn in commands) { commandNames.push(scn); }
    console.error('Recognized subcommands: ' + commandNames.join(','));
    process.exit(1);
  }

  var subcommand = commands[subcommandName];

  if (subcommand.run.length != process.argv.length - 3) {
    console.error('Incorrect number of arguments');
    console.error('Usage: ' + process.argv[1] + ' ' + subcommandName + ' ' +
                  subcommand.usage);
    process.exit(1);
  }

  subcommand.run.apply(subcommand, process.argv.slice(3));
}

main();
