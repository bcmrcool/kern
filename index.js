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
    run: function() {
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
