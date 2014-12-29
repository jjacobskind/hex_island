'use strict';

angular.module('settlersApp')
	.factory('engineFactory', function($q, $rootScope, $timeout, $http, $state, boardFactory, Auth, authFactory){
		var game;

		var gameID;
		var dataLink = new Firebase("https://hex-island.firebaseio.com/");
		var pendingRequests = dataLink.child('pendingRequests')
		var gameDatabase;
		var currentGameData;

		function parseJSON(data, callback) {
		    var tempData = JSON.parse(data);
		    var tempArr =  callback(tempData);
		    return tempArr;
		};

		function firebaseEventListener(){
			//this will be applied on the new game and the existing game
			currentGameData.on("child_changed", function(childSnapshot) {
				  var dataToSanitize = childSnapshot.val();
				  var keyName = childSnapshot.key();
				  switch (keyName) {
				    case "players":
				      var callback = function(data) {
				      	game.players = data;
				      	$rootScope.playerData = game.players[authFactory.getPlayerID()];
				      	$timeout(function(){
					      	$rootScope.$apply();
				      	});
				      };
				      break;
				    case "boardTiles":
				      callback = function(data) {
				      	return game.findObjectDifferences(game.gameBoard.boardTiles, data);
				      };
				      break;
				    case "boardVertices":
				      callback = function(data) { 	
				      return game.findObjectDifferences(game.gameBoard.boardVertices, data);
				  	  };
				      break;
				    case "turn":
				      callback = function(data){
				      	game.turn = data;
				      	$rootScope.currentTurn = game.turn;
				      	// $rootScope.$digest();
				      };
				      break;
				  	case "boardIsSetup":
				      callback = function(data){
				      	game.boardIsSetup = data;
				      	// $rootScope.$digest();
				      };
				      break;
				    case "currentPlayer":
				      callback = function(data){
				      	game.currentPlayer = data;
				      	$rootScope.currentPlayer = game.currentPlayer;
				      };
				      break;
				  };
				  var change = parseJSON(dataToSanitize, callback);
				  if(!change){
				  	return null;
				  }
				  var coords1 = [change[0].row, change[0].col];
				  if(change.length>2){
				  	var coords2 = [change[1].row, change[1].col];
				  	var owner = change[2];
				  	boardFactory.buildRoad(owner, coords1, coords2);
				  }
				  else if(change.length===1){
				  	if(change[0].keys.indexOf("owner")!==-1) {
				  		var owner = change[0].owner;
				  		boardFactory.placeSettlement(owner, coords1);
				  	}
				  	else if(change[0].keys.indexOf("hasSettlementOrCity")!==-1) {
				  		boardFactory.upgradeSettlementToCity(coords1);
				  	}
					else if(change[0].keys.indexOf("robber")!==-1) {
					  	boardFactory.moveRobber(coords1);
					} 
				}
			});
		};

		function syncDatabase(game) {
		    currentGameData.child('players').set(JSON.stringify(game.players));
		    currentGameData.child('boardTiles').set(JSON.stringify(game.gameBoard.boardTiles));
		    currentGameData.child('boardVertices').set(JSON.stringify(game.gameBoard.boardVertices));
		    currentGameData.child('turn').set(game.turn);
		    currentGameData.child('currentPlayer').set(game.currentPlayer);
		};

		function boardSync(currentGameData) {
			return $q(function(resolve, reject) {
				game = new GameEngine(3,5);
			    currentGameData.once("value", function(snapshot) {
			    	var persistedData = snapshot.val();
			    	parseJSON(persistedData.players, function(data){
			    		game.players = data;
			    	});
			    	parseJSON(persistedData.boardTiles, function(data){
			    		game.gameBoard.boardTiles = data;
			    	});
			    	parseJSON(persistedData.boardVertices, function(data){
			    		game.gameBoard.boardVertices = data;
			    	});
			    	if (persistedData.turn) {
	                    parseJSON(persistedData.turn, function(data){game.turn = data;});
	                }
	                if (persistedData.currentPlayer){
		                parseJSON(persistedData.currentPlayer, function(data){game.currentPlayer = data});    
	                }	
	                if (persistedData.boardIsSetup){
		                parseJSON(persistedData.boardIsSetup, function(data){game.boardIsSetup = data});    
	                }			    

			    	resolve('success');
			  }, function (errorObject) {
			    	console.log("The read failed: " + errorObject.code);
			    	reject('error');
			  });
			});
		};

		var updateFireBase = function(updates){
			for(var key in updates){
				currentGameData.child(key).set(updates[key]);
			}
		};

		var prepGameOnClient = function(data){
			game = data;
			// following line should be refactored later so that we don't have to create an unnecessary game object
			game.gameBoard.getRoadDestination = new GameEngine(3, 5).gameBoard.getRoadDestination;
			gameID = game._id;
			$rootScope.currentGameID = gameID;
			var currentUserID = Auth.getCurrentUser()._id
			for(var i=0, len=game.players.length; i<len; i++){
				if(game.players[i].userRef === currentUserID){
					$rootScope.playerData = game.players[i];
					authFactory.setPlayerID(i);
				}
			}
			$rootScope.players = game.players;
			boardFactory.drawGame(game);
			$rootScope.$broadcast('socketConnect', gameID);
			$state.go('game');
		};

		return {
			newGame: function(small_num, big_num){
				$http.post('/api/games', {small_num:small_num, big_num:big_num})
					.success(prepGameOnClient);
			},
			joinGame: function(gameID){
				$http.post('/api/games/join', {gameID: gameID})
					.success(function(data){
						if(data.hasOwnProperty('err')){
							console.log(data.err);
						} else {
							prepGameOnClient(data);
						}
					});
			},
			getGame: function(){
				return game;
			},
			gamePromise:function(){
				return $q(function(resolve, reject) {
					resolve(game);
				});
			}, 
			buildSettlement: function(location){
				var settlement_exists = (game.gameBoard.boardVertices[location[0]][location[1]].hasSettlementOrCity === "settlement")
				var updates = game.buildSettlement(authFactory.getPlayerID(), location);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
					return false;
				}
				else {
					if(!settlement_exists){
						boardFactory.placeSettlement(authFactory.getPlayerID(), location);
					} else {
						boardFactory.upgradeSettlementToCity(authFactory.getPlayerID(), location);
					}
					updateFireBase(updates);
					dataLink.child('games').child($rootScope.currentGameID).child('chats').push({text:authFactory.getPlayerName() + " has built a settlement", systemMessage:true});
					return true;
				}
			},
			upgradeSettlementToCity: function(location){
				var updates = game.upgradeSettlementToCity(authFactory.getPlayerID(), location);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
				}
				else {
					boardFactory.upgradeSettlementToCity(authFactory.getPlayerID(), location);
					updateFireBase(updates);
					dataLink.child('games').child($rootScope.currentGameID).child('chats').push({text:authFactory.getPlayerName() + " has built a city", systemMessage:true});
				}
			},
			buildRoad: function(location, direction){
				var updates = game.buildRoad(authFactory.getPlayerID(), location, direction);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
					return false;
				} else {
					var destination = game.gameBoard.getRoadDestination(location, direction);
					boardFactory.buildRoad(authFactory.getPlayerID(), location, destination);
					updateFireBase(updates);
					dataLink.child('games').child($rootScope.currentGameID).child('chats').push({text:authFactory.getPlayerName() + " has built a road", systemMessage:true});
					return true;
				}
			},
			moveRobber: function(destination){
				var updates = game.gameBoard.moveRobber.call(game.gameBoard, destination);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
					return false;
				} else {
					boardFactory.moveRobber(destination);
					updateFireBase(updates);
					dataLink.child('games').child($rootScope.currentGameID).child('chats').push({text:authFactory.getPlayerName() + " has moved the robber", systemMessage:true});
					return true;
				}
			},
			updatePlayers: function(playerArray){
				game.players = playerArray;
			},
			getPlayers: function(){
				return game.players;
			},
			restorePreviousGame: function(gameID) {
				$http.get('/api/games/' + gameID)
					.success(prepGameOnClient);
			},
			getGameID: function(){
				return gameID;
			},
			startGame: function () {
				game.areAllPlayersAdded = true;
				var updates = {};
				for (var prop in game) {
					if (prop !== 'gameBoard' && prop !== 'players') {
						if (game.hasOwnProperty(prop)) {
							updates[prop] = game[prop];
						}
					}
				}
				updateFireBase(updates);
			},
			startPlay: function() {
				game.boardIsSetup = true;
				var updates = {};
				for (var prop in game) {
					if (prop !== 'gameBoard' && prop !== 'players') {
						if (game.hasOwnProperty(prop)) {
							updates[prop] = game[prop];
						}
					}
				}
				updateFireBase(updates);
			},
			currentDiceRoll: function(){
				return game.diceNumber;
			},
			rollDice: function() {
				//tell player they can build and trade after this is done
				var diceRoll = game.roll();
				pendingRequests.child(gameID + '/rollRequest').set(true);
				// game.distributeResources(diceRoll);
				// var onComplete = function() {
				// 	game.players[$rootScope.playerData.playerID] = $rootScope.playerData;
				// 	$rootScope.$digest();
				// };
				// currentGameData.child('players').set(JSON.stringify(game.players), onComplete);
				return diceRoll;
			},
			endTurn: function () {
				var deferAction = $q.defer();
				
				function modifyData () {
				game.turn++;
				game.calculatePlayerTurn();
				game.diceRolled = false;
				game.diceNumber = null;
				var updates = {};
				for (var prop in game) {
					if (prop !== 'gameBoard' && prop !== 'players') {
						if (game.hasOwnProperty(prop)) {
							updates[prop] = game[prop];
						}
					}
				};
				updateFireBase(updates)
				deferAction.resolve(updates);
				};

				modifyData();

				return deferAction.promise;
			},
			refresh: function(){
				return $rootScope.$digest();
			}
		}
	});