function Player() {
  this._playerIdx = null;
};


Player.prototype = {
  name: '001',
  startRound: function(idx) {
    this._playerIdx = idx;
  },
  nextMove: function(gameState) {
    var myValue = gameState.computePlayerValues()[this._playerIdx],
        pileValue = gameState.computePileValue(),
        delta = myValue - pileValue,
        myHand = gameState._hands[this._playerIdx],
        myHandRate = null,
        enemyHandRate = null,
        condition;


      // Step 1: Determine if my Hand and the Enemy Hand is High or Low
      //console.log("Hand: " + myHand);
      myHandRate = computeMyHandRate(myHand);
      //console.log("My hand is: " + myHandRate);

      // Step 2: Check if condition can be fulfilled
         // 2a: checkEnemyChance of exact
         //     if high: step 3
         //     if  low: knock
      condition = checkCondition(myHand,pileValue);
      if(condition.pass==true){
        //console.log("ey bruh it passed and the card is " + condition.index);
        //console.log("total hand is " +pileValue);
        if (condition.discard==true){
          return {action: 'discard', rank:6};
        }
        else{
          return {action: 'play', rank: myHand[condition.index]};
        }
      }

      // Step 3: If more than one 6, discard
      if (findOccurrences(myHand,6)>1){
        return {action: 'discard', rank:6};
      }

      // Step 4: ???

    else if (delta < 1) {
      return {action: 'knock'};
    } else {
      //myHand.sort();
      for (var i=myHand.length - 1; i>=0; i--) {
        if (pileValue + (myHand[i] * 2) < myValue) {
          return {action: 'play', rank: myHand[i]};
        }
      }

      return {action: 'play', rank: myHand[0]};
    }
  }
};

function computeMyHandRate(hand){
  var myCardsHandRate;
  if ( findOccurrences(hand,4)==2 || findOccurrences(hand,5)==2 || 
    (findOccurrences(hand,5)==1 && findOccurrences(hand,4)==1)){
    return "high";
  }
  else return "low";
};

function computerEnemyHandRate(hand, pileValue){

};

//TODO: Refactor into seperate functions ASAP
function checkCondition(hand, pileValue){
  var condition = {};
  var tempHand;
  condition.index = null;
  condition.pass = null;
  condition.discard = null;
  //console.log(pileValue);
  for(var i = 0; i < hand.length; i++){
    //console.log("now pile v is "+pileValue);
    tempHand = hand.slice(0);
    cardToMove = tempHand.splice(i,1)[0];
    //If value of the pile added with the card taken out of the current hand is at most one more than hand after, pass
    if (pileValue+cardToMove - computeSumMyHand(tempHand) >=0 && 
      pileValue+cardToMove - computeSumMyHand(tempHand) < 2){
      condition.index = i;
      condition.pass = true;
      return condition;
    }
    else condition.pass = false;
  }
  if(hand.indexOf(6)>=0 && (computeSumMyHand(hand)-6 == pileValue)){
      condition.discard = true;
      condition.pass = true;
      condition.index = hand.indexOf(6);
      return condition;
    }
  return condition;
}

function computeSumMyHand(hand){
  var sum = 0;
  for (var i = 0; i < hand.length; i++){
    sum+=hand[i];
  }
  return sum;
}

function findOccurrences(hand, value) {
    var i,
        count = 0;
    for (i = 0; i < hand.length; i++) {
        if (hand[i] === value){
          count++;
        }
    }
    return count;
}

module.exports = Player;
