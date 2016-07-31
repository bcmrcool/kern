function Player() {
  this._playerIdx = null;
};


Player.prototype = {
  name: '001',
  startRound: function(idx) {
    this._playerIdx = idx;
  },
  nextMove: function(gameState) {
    var myValue = gameState.computePlayerValues()[this._playerIdx]+gameState.computeCourtValues()[this._playerIdx],
        pileValue = gameState.computePileValue(),
        delta = myValue - pileValue,
        myHand = gameState._hands[this._playerIdx],
        myHandRate = null,
        enemyHandRate = null,
        myCourtValue = gameState.computeCourtValues()[this._playerIdx],
        condition;


      // Step 1: Determine if my Hand and the Enemy Hand is High or Low
      console.log("Hand: " + myHand);
      myHandRate = computeMyHandRate(myHand);
      console.log("My hand is: " + myHandRate);

      //Step 2: If hand is low and a six is in the center, then play a 6
      if (myHandRate == "low" && findOccurrences(myHand,6)>1 && pileValue==6){
        return {action: 'play', rank: 6};
      }

      // Step 2: Check if condition can be fulfilled
         // 2a: checkEnemyChance of exact
         //     if high: step 3
         //     if  low: knock
      condition = checkCondition(myHand,pileValue);
      if(condition.pass==true){
        console.log("THe condition was passed at index: " + condition.index);
        //console.log("total hand is " +pileValue);
        if (condition.discard==true){
          return {action: 'discard', rank:6};
        }
        else{
          return {action: 'play', rank: myHand[condition.index]};
        }
      }

      //Step 3: See if taking a card will help reach the center pile
      if((pileValue-myValue)>1){
        console.log("since pile value is "+pileValue+" and mine is "+myValue+" taking");
        return {action: 'take'};
      }

      // Step 4: If more than one 6, discard
      if (findOccurrences(myHand,6)>1 && myValue!==pileValue){
        return {action: 'discard', rank:6};
      }

      // Step 5: ???


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

function computeEnemyHandRate(hand, pileValue){

};

//TODO: Refactor into seperate functions ASAP
function checkCondition(hand, pileValue){
  var condition = {};
  var tempHand;
  condition.index = null;
  condition.pass = null;
  condition.discard = null;
  //console.log(pileValue);
  // Iterate through the current hand and determine is any of the cards can be used to be close 
  // to the pile value
  console.log("Main Pile Value: "+pileValue);
  for(var i = 0; i < hand.length; i++){
    tempHand = hand.slice(0);
    cardToMove = tempHand.splice(i,1)[0];
    //If value of the pile added with the card taken out of the current hand is at most one more than hand after, pass
    if (isWithinDelta(tempHand,pileValue+cardToMove,2)){
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

function isWithinDelta(hand,pileValue, delta){
  var isWithin = (pileValue - computeSumMyHand(hand) >=0 && 
      pileValue - computeSumMyHand(hand) < 2)
  return isWithin;
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
