function Player() {
  this._playerIdx = null;
};

Player.prototype = {
  name: 'playTillLow',
  startRound: function(idx) {
    this._playerIdx = idx;
  },
  nextMove: function(gameState) {
    var myValue = gameState.computePlayerValues()[this._playerIdx],
      pileValue = gameState.computePileValue(),
      delta = myValue - pileValue,
      myHand = gameState._hands[this._playerIdx];

    if (delta < 1) {
      return {action: 'knock'};
    } else {
      myHand.sort();
      for (var i=myHand.length - 1; i>=0; i--) {
        if (pileValue + (myHand[i] * 2) < myValue) {
          return {action: 'play', rank: myHand[i]};
        }
      }

      return {action: 'play', rank: myHand[0]};
    }
  }
};

module.exports = Player;
