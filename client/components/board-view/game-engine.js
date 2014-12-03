function GameEngine(small_num, large_num) {
    this.players = [],
    this.turn = 0,
      this.gameBoard = new GameBoard(this, small_num, large_num),
    //are all players added to the game model, and are we ready to setup the board?
    this.areAllPlayersAdded = false;
    //true or false: is the stage where players add their first two settlements, and first two roads complete?
    this.boardIsSetup = false;
    //have all players setup their first two settlements and first two roads?
    this.hasGameStartedYet = false;
}

GameEngine.prototype.calculatePlayerTurn = function() {
  var currentTurn = this.turn,
      playerLength = this.players.length;
  return currentTurn % playerLength;
}

GameEngine.prototype.addPlayer = function() {
    if (this.areAllPlayersAdded === false) {
    var id = this.players.length;
    if (id > 5) {
        throw new Error ("Sorry, no more than 6 players!");
    }
    this.players.push(new Player(id));
    currentGameData.child('players').set(JSON.stringify(game.players));
    }
    else if (this.areAllPlayersAdded === true) {
        throw new Error ("Game is already started!");
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
        return sumDice;
};

GameEngine.prototype.findLongestRoad = function() {
  var longest_road = [];
  for(var row=0, num_rows=this.gameBoard.boardVertices.length; row<num_rows; row++){
    for(var col=0, num_cols=this.gameBoard.boardVertices[row].length; col<num_cols; col++){
      var road = this.gameBoard.followRoad([row, col]);
      if(!longest_road.length || road.length > longest_road[0].length){
        longest_road=[];
        longest_road.unshift(road);
      }
      else if(!!longest_road[0] && road.length===longest_road[0].length) {
        // Need to do something here so that ties don't change possessor of points for longest road
        // longest_road.unshift(road);
      }
    }
  }
  console.log(longest_road[0]);
  return longest_road[0].length-1;  //number of roads is always one less than the number of vertices along it
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

GameEngine.prototype.distributeResources = function(sumDice) {
  var rows = game.gameBoard.boardVertices;
  // if player's dice roll doesn't trigger robber fn
  if (sumDice !== 7) {
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
                resourceArray.push({resourceCount: resourcesToDistribute, resource: item.resource});
              }
            })
            if (resourceArray.length !== 0) {
              resourceArray.forEach(function(item){
                var resources = player.resources;
                console.log(item.resource)
                resources[item.resource] = resources[item.resource] + resourcesToDistribute;
              })
            }
          }
        }
      }
    }
};

GameEngine.prototype.tradeResources = function(firstPlayer, firstResource, secondPlayer, secondResource) {
  // arguments should be formatted as follows [game.players[x], 'resource', number to shift],
  // example: game.tradeResources(game.players[0], {brick: 1}, game.players[1], {wool: 2});
  // in a situation where
  // player0 is giving 2 wool to player2 for 1 brick
  // player0 will decrease 1 brick, and increase 1 wool
  // player1 will increase 1 brick, and decrease 1 wool
  // game.tradeResources(game.players[0], {brick: 1}, game.players[1], {wool: 1, grain: 1});
  // player0 will increase 1 grain and 1 wool and decrease 1 brick
  // player1 will increase 1 brick and decrease 1 wool and 1 grain

  var playerOne = firstPlayer;
  var playerTwo = secondPlayer;
  for (var resource in firstResource) {
    playerOne.resources[resource] = playerOne.resources[resource] - firstResource[resource];
    playerTwo.resources[resource] = playerTwo.resources[resource] + firstResource[resource];
  }
  for (var resource in secondResource) {
    playerOne.resources[resource] = playerOne.resources[resource] + secondResource[resource];
    playerTwo.resources[resource] = playerTwo.resources[resource] - secondResource[resource];
  }
  currentGameData.child('players').set(JSON.stringify(game.players));
};

GameEngine.prototype.buildSettlement = function(player, location) {
  if (player.resources.wool < 1 || player.resources.grain < 1 || player.resources.lumber < 1 || player.resources.brick < 1) {
    throw new Error ('Not enough resources to build settlement!')
  }
  else {
    player.resources.wool--;
    player.resources.grain--;
    player.resources.lumber--;
    player.resources.brick--;
    this.gameBoard.placeSettlement(player, location);
    pushUpdates(player, 'buildSettlement', location);
  }
};

GameEngine.prototype.buildRoad = function(player, location, direction) {
  if (player.resources.lumber < 1 || player.resources.brick < 1) {
    throw new Error ('Not enough resources to build road!')
  }
  else {
    player.resources.lumber--;
    player.resources.brick--;
    this.gameBoard.constructRoad(player,location,direction);
    pushUpdates(player, 'buildRoad', location, direction);
  }
};

GameEngine.prototype.upgradeSettlementToCity = function(player, location) {
  if (player.resources.grain < 2 || player.resources.ore < 3) {
    throw new Error ('Not enough resources to build city!')
  }
  else {
    player.resources.grain = player.resources.grain - 2;
    player.resources.ore = player.resources.ore - 3;
    this.gameBoard.upgradeSettlementToCity(player, location); 
    pushUpdates(player, 'upgradeSettlementToCity', location);
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

// Iterates through two 2-dimensional arrays of objects, identifies which object is different
// Returns the indices of the changed object, as well as which of its properties have changed
GameEngine.prototype.findObjectDifferences = function(old_arr, new_arr){

  var changes = 0;
  var all_changes=[];
  for(var row=0, num_rows=old_arr.length; row<num_rows; row++){
    for(var col=0, num_cols=old_arr[row].length; col<num_cols; col++) {
      var old_obj=old_arr[row][col];
      var new_obj=new_arr[row][col];


      var changes_obj = {row:row, col:col, keys:[]};
      for(var key in old_obj) {
        if(key==='connections'){
          for(var direction in old_obj[key]){
            if(old_obj[key][direction]!==new_obj[key][direction]){
              changes++;
              changes_obj.keys.push([direction, new_obj[key][direction]]);
              all_changes.push(changes_obj);
            }
          }
        }
        else if(key==='adjacent_tiles'){
          // changes+=2;

        }
        else if(old_obj[key]!=new_obj[key]) {
            changes+=2;
            changes_obj.keys.push(key);
          all_changes.push(changes_obj);
        }
      }
      if(changes>=2){
        console.log(all_changes);
        return all_changes;
      }
    }
  }
};

var gameID = 0;
var dataLink = new Firebase("https://flickering-heat-2888.firebaseio.com/");
var gameDatabase = dataLink.child(gameID);
var currentGameData = gameDatabase.child('data');

var game = new GameEngine(3, 5);

function parseJSON(data, callback) {
    var tempData = JSON.parse(data);
    callback(tempData);
};

function syncDatabase(game) {
    currentGameData.child('players').set(JSON.stringify(game.players));
    currentGameData.child('boardTiles').set(JSON.stringify(game.gameBoard.boardTiles));
    currentGameData.child('boardVertices').set(JSON.stringify(game.gameBoard.boardVertices));
};

function _refreshDatabase(){
    game = new GameEngine(3, 5);
    syncDatabase(game);
    console.log('the database and local board have been synched and refreshed')
};

function boardSync() {
  currentGameData.once("value", function(snapshot) {
  var persistedData = snapshot.val();
  parseJSON(persistedData.players, function(data){game.players = data});
  parseJSON(persistedData.boardTiles, function(data){game.gameBoard.boardTiles = data});
  parseJSON(persistedData.boardVertices, function(data){game.gameBoard.boardVertices = data});
  console.log('data loaded')
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
})
};

//this will load all the data when the page loads initially, then turn itself off
//for loading the saved state of the board
$(document).ready(boardSync());

currentGameData.on("child_changed", function(childSnapshot) {
  var dataToSanitize = childSnapshot.val();
  var keyName = childSnapshot.key();
  switch (keyName) {
    case "players":
      var callback = function(data) {game.players = data};
      break;
    case "boardTiles":
      var callback = function(data) {game.gameBoard.boardTiles = data};
      break;
    case "boardVertices":
      var callback = function(data) {game.findObjectDifferences(game.gameBoard.boardVertices, data)};//function(data) {game.gameBoard.boardVertices = data};
      break;
    default:
      var callback = function(data) {throw new Error ('incident occurred with this data: ', data)};
      break;
  };
  parseJSON(dataToSanitize, callback)
});

