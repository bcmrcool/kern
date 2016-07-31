function Player() {
  this._playerIdx = null;
};

Player.prototype = {
  name: 'knockNow',
  startRound: function(idx) {
    this._playerIdx = idx;
  },
  nextMove: function(gameState) {
    return {action: 'knock'};
  }
};

module.exports = Player;
