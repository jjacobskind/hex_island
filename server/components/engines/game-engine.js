var GameBoardEngine = require('./board-engine');
var GameBoard = GameBoardEngine.GameBoard;
var Player = require('./player-engine').Player;

var GameEngine = function(game, small_num, large_num) {
    this.players = [];

    // If a game object is not passed in, create a new game (Mongo schema will add properties with default values)
    if(!game){
      this.gameBoard = new GameBoard(this, null, small_num, large_num);

    // Otherwise, populate this GameEngine object with the properties of game
    } else {
      for(var key in game){
        if(key!=="gameBoard" && key!=="players"){
          this[key] = game[key];
        }
      }
      this.gameBoard = new GameBoard(this, game.gameBoard);
      for(var i=0, len=game.players.length; i<len; i++){
        this.players.push(new Player(game.players[i]));
      }
    }
}

GameEngine.prototype.advancePlayerTurn = function(playerID) {
  if(playerID===this.currentPlayer){
    this.turn++;
    this.diceRolled = false;
    this.calculatePlayerTurn();
    return this.currentPlayer;
  } else {
    return null;
  }
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
   this.boardIsSetup = true;
   this.currentPlayer = currentTurn % playerLength;
 }
}

GameEngine.prototype.addPlayer = function() {
    if (this.areAllPlayersAdded === false) {
      var id = this.players.length;
      if (id > 5) {
          return {err: "Sorry, no more than 6 players!"};
      }
      this.players.push(new Player(id));
      return {'players': JSON.stringify(this.players)};
    }
    else if (this.areAllPlayersAdded === true) {
        return {err: "Game is already started!"};
    }
};

GameEngine.prototype.validatePlayerCount = function() {
    this.areAllPlayersAdded = true;
    return "All players have been added!"
};

GameEngine.prototype.shuffle = function(array){
   for (var i = array.length - 1; i > 0; i--) {
       var j = Math.floor(Math.random() * (i + 1));
       var temp = array[i];
       array[i] = array[j];
       array[j] = temp;
   }
   return array;
};

GameEngine.prototype.roll = function() {
    var firstRoll = Math.floor(Math.random() * 6) + 1,
        secondRoll = Math.floor(Math.random() * 6) + 1,
        sumDice = firstRoll + secondRoll;
        this.diceNumber = sumDice;
        return sumDice;
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

exports.distributeResources = function(sumDice) {
  var rows = this.gameBoard.boardVertices;
  var players = this.players;
  // if player's dice roll doesn't trigger robber fn
  if (sumDice !== 7) {
      var resourceArray = [];
      var boardSnapShot = {};
      // loop through the game board
      for (i = 0; i < rows.length; i++) {
        for (j = 0; j < rows[i].length; j++) {
          if (rows[i][j].owner !== null) {
            var resourcesToDistribute = 1;
            // check adjacent tiles if they contain a settlement or a city
            if (rows[i][j].settlementOrCity === 'city'){
              resourcesToDistribute++;
            }
            // distribute resources if player contains settlement on adjacent tiles
            rows[i][j].adjacent_tiles.forEach(function (item) {
              if (item.chit === sumDice) {
                resourceArray.push({resourceCount: resourcesToDistribute, resource: item.resource, player: rows[i][j].owner});
              }
            })
            }
          }
        }
        if (resourceArray.length !== 0) {
              resourceArray.forEach(function(item){
                var resources = players[+item.player].resources;
                resources[item.resource] = resources[item.resource] + resourcesToDistribute;
        })
      }
    }
};

GameEngine.prototype.tradeResources = function(firstPlayer, firstResource, secondPlayer, secondResource) {
  console.log("Need to refactor code in GameEngine.prototype.tradeResources!");
  // var playerOne = game.players[firstPlayer];
  // var playerTwo = game.players[secondPlayer];
  // for (var resource in firstResource) {
  //   playerOne.resources[resource] = playerOne.resources[resource] - firstResource[resource];
  //   playerTwo.resources[resource] = playerTwo.resources[resource] + firstResource[resource];
  // }
  // for (var resource in secondResource) {
  //   playerOne.resources[resource] = playerOne.resources[resource] + secondResource[resource];
  //   playerTwo.resources[resource] = playerTwo.resources[resource] - secondResource[resource];
  // }
  // currentGameData.child('players').set(JSON.stringify(game.players));
};

GameEngine.prototype.buildSettlement = function(playerID, location) {
  var player = this.players[playerID];
  if(this.gameBoard.boardVertices[location[0]][location[1]].hasSettlementOrCity === "settlement"){
    return this.gameBoard.upgradeSettlementToCity(playerID, location);
  }
  else if ((player.resources.wool < 1 || player.resources.grain < 1 || player.resources.lumber < 1 || player.resources.brick < 1) && (this.turn >= this.players.length * 2)) {
    return {err: "Not enough resources to build a settlement!"};
  }
  else if (this.boardIsSetup === false && playerID===this.currentPlayer) {
    if ((this.turn < this.players.length) && player.playerQualities.settlements === 0) {
      return this.gameBoard.placeSettlement(player, location);
    }
    else if ((this.turn >= this.players.length) && this.turn < (this.players.length * 2) && player.playerQualities.settlements === 1) {
      
      var itemsToDistribute = this.gameBoard.boardVertices[location[0]][location[1]].adjacent_tiles;
      
      itemsToDistribute.forEach(function(item){
        player.resources[item.resource]++
      });

      return this.gameBoard.placeSettlement(player, location);
    }
    else {
      return {err: "Cannot build another settlement during setup!"};
    }
  }
  else if(playerID===this.currentPlayer){
    return this.gameBoard.placeSettlement(player, location);
  } else {
    return {err: "It is not currently your turn!"};
  }
};

GameEngine.prototype.buildRoad = function(playerID, location, direction) {
  var player = this.players[playerID];
  if ((player.resources.lumber < 1 || player.resources.brick < 1) && 
    (this.turn >= (this.players.length * 2))) {
    return {err: "Not enough resources to build road!"};
  }
  else if (this.boardIsSetup === false && playerID===this.currentPlayer) {
    if ((this.turn < this.players.length) && player.playerQualities.roadSegments === 0) {
      return this.gameBoard.placeRoad(player,location,direction);
    }
    else if ((this.turn < (this.players.length * 2)) && player.playerQualities.roadSegments === 1) {
      return this.gameBoard.placeRoad(player,location,direction);
    }
    else {
      return {err: "Cannot build another road during setup!"};
    }
  }
  else if(playerID===this.currentPlayer) {
    return this.gameBoard.placeRoad(player,location,direction);
  } else {
    return {err: "It is not currently your turn!"};
  }
};

GameEngine.prototype.upgradeSettlementToCity = function(playerID, location) {
  var player = this.players[playerID];
  if (player.resources.grain < 2 || player.resources.ore < 3) {
    return {err: 'Not enough resources to build city!'};
  }
  else if(playerID===this.currentPlayer) {
    player.resources.grain -= 2;
    player.resources.ore -= 3;
    return this.gameBoard.upgradeSettlementToCity(player, location); 
  } else {
    return {err: "It is not currently your turn!"};
  }
};

GameEngine.prototype.buyDevelopmentCard = function(player) {
  if (player.resources.wool < 1 || player.resources.grain < 1 || player.resources.ore < 1) {
    throw new Error ('Not enough resources to purchase a development card!')
  }
  else {
    player.resources.wool--;
    player.resources.grain--;
    player.resources.ore--;
    this.gameBoard.getDevelopmentCard(player);
  }
};

exports.GameEngine = GameEngine;