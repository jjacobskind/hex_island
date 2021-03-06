function GameEngine(small_num, large_num) {
    this.gameBoard = new GameBoard(this, small_num, large_num);
}

// Runs when player tries to pass the turn to the next player
GameEngine.prototype.advancePlayerTurn = function(playerID) {
  var turnValidation = this.validatePlayerTurn(playerID, "advanceTurn");
  if(turnValidation!==true){ return turnValidation; }
  this.turn++;
  if(this.turn>=this.players.length*2) { this.boardIsSetUp = true; }
  this.diceRolled = false;
  this.calculatePlayerTurn();
  return this.currentPlayer;
}

GameEngine.prototype.calculatePlayerTurn = function() {

 var currentTurn = this.turn, playerLength = this.players.length;

 if (this.turn <= playerLength - 1) {
   //go in order eg, 0, 1, 2
   // turn 0, 1, 2
   this.currentPlayer = this.turn;

 }

 else if (this.turn >= playerLength && this.turn <= (playerLength * 2) - 1) {
   if (this.turn === playerLength) {
     // turn 3, 4, 5
     // start at the last player eg, 2
     this.currentPlayer = this.turn - 1;
   }
   else {
     // then go backwards, eg 1, 0
     this.currentPlayer--;
   }
 }

 else if (this.turn >= (playerLength * 2)) {
   this.boardIsSetUp = true;
   this.currentPlayer = currentTurn % playerLength;
 }
}


// Returns a boolean value indicating whether the player is allowed to take this action at this point in the game
GameEngine.prototype.validatePlayerTurn = function(playerID, action){

  // Conditions that apply to nearly all game actions
  if (playerID!==this.currentPlayer) { return {err: "It is not currently your turn!"}; }
  if(this.robberMoveLockdown && action!=="moveRobber") { return {err: "You must move the robber before taking any other action!"}; }
  if(this.roadCardLockdown && action!=="buildRoad") { return {err: "You must finish building both roads before taking any further action!"}; }

  switch(action){
    case "roll":
      if(!this.boardIsSetUp) { return {err: "You may not roll during the board setup phase!"}; }
      else if(this.diceRolled) { return {err: "You may only roll once per turn!"}; }
      else { return true; }
    case "buildRoad":
      if(!this.diceRolled && this.boardIsSetUp) { return { err: "You must roll the dice before you can build!" }; }
      else if (this.boardIsSetUp === false && Math.floor(this.turn / this.players.length) !== this.players[playerID].playerQualities.roadSegments) { return { err: "You may only build one road per turn during the board setup phase!" }; }
      return true;
    case "build":
      if(!this.diceRolled && this.boardIsSetUp) { return { err: "You must roll the dice before you can build!" }; }
      else if (this.boardIsSetUp === false && Math.floor(this.turn / this.players.length) !== this.players[playerID].playerQualities.settlements) { return { err: "You may only build one settlement per turn during the board setup phase!" }; }
      return true;
    case "trade":
      return (this.diceRolled===true && this.robberMoveLockdown===false);
    case "moveRobber":
      return (this.robberMoveLockdown);
    case "advanceTurn":
      var playersSettlements = this.players[playerID].playerQualities.settlements;
      var playersRoads = this.players[playerID].playerQualities.roadSegments;

      if(this.boardIsSetUp===false) {
        if(playersSettlements===playersRoads && playersRoads===Math.ceil((this.turn+1)/this.players.length)) { return true; }
        else { return {err: "You must build one settlement and one road during the board setup phase!"}; }
      } else if(!this.diceRolled) { return { err: "You need to roll the dice before ending your turn!" }; }
      else { return true; }
    default:
      return false;
  }
};


GameEngine.prototype.findLongestRoad = function() {
  var longest_roads = [];
  for(var row=0, num_rows=this.gameBoard.boardVertices.length; row<num_rows; row++){
    for(var col=0, num_cols=this.gameBoard.boardVertices[row].length; col<num_cols; col++){
      var road = this.gameBoard.followRoad([row, col]);
      if(longest_roads.length===0 || road.length > longest_roads[0].length){
        longest_roads=[road];
      }
      else if(longest_roads.length>0 && road.length===longest_roads[0].length) {
        // Need to do something here so that ties don't change possessor of points for longest road
        longest_roads.push(road);
      }
    }
  }

  // Return null if there aren't any roads yet
  if(longest_roads[0].length===0){
    return null;
  }

  // Remove redundant longest roads for each player
  // After this loop, 'owner' will store the owner of one of the longest roads, but will only be used if there is only one longest road
  var counted_players = [];
  for(var i=0, len=longest_roads.length; i<len;i++){
    var vertex1 = longest_roads[i][0];
    var vertex2 = longest_roads[i][1];
    for(var key in this.gameBoard.boardVertices[0][0].connections){
      var check_vert = this.gameBoard.getRoadDestination(vertex1, key);
      if(!!check_vert && check_vert[0]===vertex2[0] && check_vert[1]===vertex2[1]){
        var owner = this.gameBoard.boardVertices[vertex1[0]][vertex1[1]].connections[key];
        if(counted_players.indexOf(owner)===-1) {
          counted_players.push(owner);
        } else {
          longest_roads.splice(i, 1);
          i--;
          len--;
        }
      }
    }
  }

  var longest_road_length = longest_roads[0].length-1;   //number of roads is always one less than the number of vertices along it

  // Check if this is the first legitimate longest road of the game
  if(!this.longestRoad && longest_roads.length===1 && longest_road_length>=5) {
    this.longestRoad = {road_length: longest_road_length, owner: owner};  
    this.players[owner].playerQualities.privatePoints+=2;
    this.players[owner].hasLongestRoad=true;
  }
  // Check if this longest road beats the current longest road and whether points need to be transferred
  else if(!!this.longestRoad && longest_roads.length===1 && longest_road_length>this.longestRoad.road_length) {
    if(owner!==this.longestRoad.owner){
      this.players[owner].playerQualities.privatePoints+=2;
      this.players[owner].hasLongestRoad=true;

      this.players[this.longestRoad.owner].playerQualities.privatePoints-=2;
      this.players[this.longestRoad.owner].hasLongestRoad = false;
    }
    this.longestRoad = {road_length: longest_road_length, owner: owner};
  }
  // check for when the longest road is split by a settlement so that there is no longer a valid longest road
  else if(!!this.longestRoad && this.longestRoad.length>longest_road_length && (longest_roads.length>1 || longest_road_length<5) ){
    this.players[this.longestRoad.owner].playerQualities.privatePoints-=2;
    this.players[this.longestRoad.owner].hasLongestRoad = false;
    this.longestRoad = null;
  }
  // check if there is a valid longest road after the longest road has been split by a settlement
  // WHEN THIS WORKS, COMBINE INTO SECOND CONDITIONAL ABOVE!!!
  else if(!!this.longestRoad && this.longestRoad.length>longest_road_length && longest_roads.length===1 && longest_road_length>=5 ){
    if(owner!==this.longestRoad.owner){
      this.players[owner].playerQualities.privatePoints+=2;
      this.players[owner].hasLongestRoad=true;

      this.players[this.longestRoad.owner].playerQualities.privatePoints-=2;
      this.players[this.longestRoad.owner].hasLongestRoad = false;
    }
    this.longestRoad = {road_length: longest_road_length, owner: owner};
  }
};

// Finds the index of the first instance of a nested array in its parent array
  // ex: can use to find index of [1, 2] in array [ [0, 1], [3, 4], [1, 2]]
    // indexOf doesn't do this
GameEngine.prototype.getNestedArrayIndex = function(search_arr, find_arr) {
  for(var i=0, len=search_arr.length; i<len; i++) {
    var len2=find_arr.length;
    if(len2===search_arr[i].length){
      var match=true;
      for(var k=0; k<len2 && match; k++){
        if(search_arr[i][k]!==find_arr[k]) {
          match=false;
        }
      }
      if(match) {
        return i;
      }
    }
  }
  return -1;
};

GameEngine.prototype.buildSettlement = function(playerID, location) {
  var isPlayerTurn = this.validatePlayerTurn(playerID, 'build');
  if(isPlayerTurn !== true) { return isPlayerTurn; }

  var player = this.players[playerID];
  if(String(this.gameBoard.boardVertices[location[0]][location[1]].hasSettlementOrCity) === "settlement"){
    return this.upgradeSettlementToCity(playerID, location);
  }
  else if ((player.resources.wool < 1 || player.resources.grain < 1 || player.resources.lumber < 1 || player.resources.brick < 1) && (this.turn >= this.players.length * 2)) {
    return { err: "Not enough resources to build a settlement!" };
  }

  if(Math.floor(this.turn / this.players.length) === 1) {
    var itemsToDistribute = this.gameBoard.boardVertices[location[0]][location[1]].adjacent_tiles;
    itemsToDistribute.forEach(function(item){
      player.resources[item.resource]++
    });
  }
  return this.gameBoard.placeSettlement(player, location);
};

GameEngine.prototype.buildRoad = function(playerID, location, direction) {
  var isPlayerTurn = this.validatePlayerTurn(playerID, 'buildRoad');
  if(isPlayerTurn !== true) { return isPlayerTurn; }

  var player = this.players[playerID];
  if ((player.resources.lumber < 1 || player.resources.brick < 1) &&
    (this.turn >= (this.players.length * 2))) {
    return {err: "You don't have enough resources to build a road!"};
  }
  return this.gameBoard.placeRoad(player,location,direction);
};

GameEngine.prototype.upgradeSettlementToCity = function(playerID, location) {
  var player = this.players[playerID];
  if (player.resources.grain < 2 || player.resources.ore < 3) {
    return {err: 'Not enough resources to build city!'};
  }

  player.resources.grain -= 2;
  player.resources.ore -= 3;
  return this.gameBoard.upgradeSettlementToCity(player, location);
};

GameEngine.prototype.moveRobber = function(playerID, destination, origin) {
  var isPlayerTurn = this.validatePlayerTurn(playerID, 'moveRobber');
  if(isPlayerTurn === true) {
    return this.gameBoard.moveRobber(destination, origin);
  } else {
    return isPlayerTurn;
  }
};