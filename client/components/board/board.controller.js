'use strict';

angular.module('hexIslandApp')
  .controller('BoardCtrl', function(boardFactory, engineFactory, authFactory, $scope, $state, $rootScope, $timeout, socket){
    if(engineFactory.getGame().currentPlayer===undefined){
      $state.go('main.login');
      return;
    }
    
    var self = this;
    self.setMode = boardFactory.set_someAction;
    self.textContent = "";
    $rootScope.currentTurn = engineFactory.getGame().turn;
    $scope.playerHasRolled = false;
    $rootScope.currentPlayer = engineFactory.getGame().currentPlayer;
    $rootScope.playerBoard = [];
    $scope.currentGameID = $rootScope.currentGameID;

    $scope.players = engineFactory.getPlayers();


    $scope.toggleDropdown = function($event) {
      if($rootScope.lockDown) { return null; }
      $event.preventDefault();
      $event.stopPropagation();
      $scope.status.isopen = !$scope.status.isopen;
    };

    self.submitChat = function(){
      if(self.textContent!==null){
        var message = self.textContent.trim();
      }
      if(message.length>0 && self.textContent!==null) {
        socket.emit('chat:messageToServer', {text: message});
        $('<div/>').text(message).prepend($('<em/>').text(authFactory.getPlayerName() +': ')).appendTo($('.textScreen'));
        $('.textScreen')[0].scrollTop = $('.textScreen')[0].scrollHeight;
      }
      self.textContent=null;
      $('#typeBox').focus();
    };

    self.nextTurn = function () {
      // Add code to check player move
      var newTurn = engineFactory.getGame().advancePlayerTurn(authFactory.getPlayerID());
      if(newTurn.hasOwnProperty("err")){
        console.log(newTurn.err);
      } else {
        socket.emit('action:nextTurnToServer');
      }
    }

    self.rollDice = function(){
      var validation = engineFactory.getGame().validatePlayerTurn(authFactory.getPlayerID(), "roll");
      if(validation.hasOwnProperty('err')) {
        console.log(validation.err);
        return;
      }
      socket.emit('action:rollDice');
    };

     // SOCKET LISTENERS
    socket.on('action:nextTurnToClient', function(data){
      engineFactory.updateGameProperties(data);
    });

    socket.on('action:rollResults', function(data) {
      engineFactory.updateGameProperties(data);
      $rootScope.currentRoll = data.game.diceNumber;
      if(data.game.robberMoveLockdown && authFactory.getPlayerID()===$scope.currentPlayer) {
        $rootScope.lockDown = true;
        boardFactory.set_someAction("robber");
      }
    });


    socket.on('chat:messageToClient', function(message){
      if (message.name === "GAME"){
        $('<div style="color:#bb5e00; font-size:0.8em; font-weight: 900;padding:4px 0 3px 0"/>').text(message.text).prepend($('<b/>').text('')).appendTo($('.textScreen'));
      }
      else {
        $('<div/>').text(message.text).prepend($('<em/>').text(message.name+': ')).appendTo($('.textScreen'));
      }
      $('.textScreen')[0].scrollTop = $('.textScreen')[0].scrollHeight;
    });

    socket.on('updatePlayers', function(data){
      engineFactory.updateGameProperties(data);
      $scope.players = data.game.players;
    });
  });