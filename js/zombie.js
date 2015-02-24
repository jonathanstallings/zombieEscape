// (function () {

  //Goal: Create a game wherein the player and friendly NPC try to escape from zombies.

  var game = {
    zombies: [],
    humans: [],
    survivors: [],
    players: [],
    escapees: [],
    badThings:[
      "tripped and fell",
      "took a wrong turn",
      "is frozen in fear",
      "doesn't know which way to go",
      "got caught in some brambles",
      "is freaking out",
    ],
    distance: 100,
    $console: $("#console ul"),
    $dialogText: $("#dialogText"),

    consoleLog: function (text) {
      game.$console.append("<li class='report'>" + text + "</li>");
      console.log(text);
    },

    consoleClear: function () {
      //Update arrays and clears game console.
      game.updateHumans();
      game.$console.children().remove();
    },

    createZombies: function (number, position, givenName) {
      var i, name;
      for (i = 0; i < number; i++) {
        if (givenName) {
          name = givenName[i];
        } else {
          name = game.zombies.length + 1;
          name = "Zombie " + name;
        }
        game.zombies.push(new Zombie(name, position));
      }
    },

    createSurvivors: function (number, position, givenName) {
      var i, name;
      for (i = 0; i < number; i++) {
        if (givenName) {
          name = givenName[i];
        } else {
          name = game.survivors.length + 1;
          name = "Survivor " + name;
        }
        game.survivors.push(new Human(name, position));
      }
    },

    createPlayer: function (name, position, speed, focus) {
      game.players.push(new Player(name, position, speed, focus));
    },

    createGame: function (args) {
      //Initialize Values
      game.zombies = [];
      game.humans = [];
      game.survivors = [];
      game.players = [];
      game.escapees = [];

      //Create Participants
      game.createZombies(3);
      game.createSurvivors(3, 10, ["Jonathan", "Heather", "Josh"]);
      game.createPlayer("Maria", 10, 8, 4);
      game.updateHumans();

      //Delete HTML Console <ul>
      game.$console.children().remove();
    },

    updateHumans: function () {
      game.humans = game.players.concat(game.survivors);
    },

    turn: {
      full: function () {
        game.consoleClear();
        game.turn.player();
        game.turn.npc();
      },

      npc: function () {
        game.turn.survivor();
        game.turn.zombie();
      },

      player: function () {
        for (var i = 0; i < game.players.length; i++) {
          game.players[i].takeTurn();
          game.players[i].checkPlayerStatus();
        }
      },

      survivor: function () {
        var i, j, message;
        for (i = 0; i < game.survivors.length; i++) {
          game.survivors[i].checkStatus(i);
          if (game.survivors[i]) {
            game.survivors[i].takeTurn(i);
          }
        }
      },

      zombie: function () {
        var i, j, message;
        for (i = 0; i < game.zombies.length; i++) {
          game.zombies[i].takeTurn(i);
          //check if at position of survivor
          for (j = 0; j < game.humans.length; j++) {
            if (game.zombies[i].position == game.humans[j].position) {
              message = "Brains! " + game.zombies[i].name + " caught " + game.humans[j].name + "!";
              game.consoleLog(message);
              game.zombies[i].bite(game.humans[j]);
            }
          }
        }
      }
    },
  };

  function Biped () {
    this.exhausted = false;
    this.state = "stopped";
    this.position = 0;
  }

  Biped.prototype = {
    report: function () {
      var reportText = this.name + " " + this.state + " at " + this.position + ".";
      console.log(reportText);
      game.$console.append(this.toHTML(reportText));
      return reportText;
    },
    toHTML: function (text) {
      return "<li class='report'>" + text + "</li>";
    },
    move: function (faster) {
      var currentSpeed;
      if (faster) {
        currentSpeed = this.speed * faster;
        this.state = "is running";
      } else if (this.exhausted) {
        currentSpeed = this.speed / 4;
        this.state = "is exhausted";
        this.exhausted = false;
      } else {
        currentSpeed = this.speed;
        this.state = "is walking";
      }
      if (faster || this.focus > randomNumberIn(10)) {
        this.position += currentSpeed;
      } else {
        this.state = game.badThings[randomNumberIn(game.badThings.length)];
      }
    },
    constructor: Biped
  };

  function Zombie (name, position) {
    this.name = name;
    this.speed = 2;
    this.focus = 10;
    if (position) {
      this.position = position;
    }
  }

  Zombie.prototype = new Biped();
  Zombie.prototype.bite = function (victim) {
    //Bites a chosen victim
    var message, random = randomNumberIn(10);

    if (victim.shot || random > 2) {
      victim.bitten++;
      message = this.name + " bites " + victim.name + "! ";
    } else {
      message = victim.name + " narrowly escapes, and ";
    }
    if (!victim.shot) {
      victim.run();
      message += victim.name + " runs to "+ victim.position + " in terror!";
    }
    if (victim instanceof Player) {
      victim.dies(this);
    }
    game.consoleLog(message);
  };
  Zombie.prototype.takeTurn = function () {
    if (!this.shot) {
      this.move();
    }
    this.report();
  };

  function Human (name, position, speed, focus) {
    this.name = name;
    this.speed = speed || 8;
    this.focus = focus || 4;
    this.position = position || 10;
    this.escaped = false;
    this.bitten = 0;
    this.shot = false;
    this.noiseLevel = 4;
    this.inventory = {
      gun: true,
      bullets: randomNumberIn(3)
    };
  }

  Human.prototype = new Biped();
  Human.prototype.run = function (argument) {
    this.move(2);
    this.exhausted = true;
  };
  Human.prototype.checkStatus = function (suvivorIndex) {
    if (this.escaped || this.position >= game.distance) {
      if (!this.escaped) {
        this.escaped = true;
        game.escapees.push(this);
        this.state = "is waiting at the city limits";
      }
    } else {
      if (this.bitten || this.shot) {
        var random = randomNumberIn(10);
        console.log("Random was " + random + ".");
        if (random > 7 - this.bitten) {
          this.zombify(suvivorIndex);
        }
      }
    }

  };
  Human.prototype.zombify = function (suvivorIndex) {
    game.consoleLog(this.name + " became a zombie!");
    game.createZombies(1, this.position, ["Zombified " + this.name]);
    game.survivors.splice(suvivorIndex, 1);
    game.updateHumans();
  };
  Human.prototype.search = function (target) {
    var message, thisStuff = this.inventory.bullets, theirStuff = target.inventory.bullets;

    message = this.name + " searches " + target.name + ", and ";
    if (theirStuff) {
      this.inventory.bullets += target.inventory.bullets;
      target.inventory.bullets = 0;
      message += "finds " + theirStuff + " bullets!";
    } else {
      message += "finds nothing!";
    }
    game.consoleLog(message);
    game.turn.npc();
  };
  Human.prototype.takeTurn = function () {
    if (!this.shot && !this.escaped) {
      this.move();
      // this.checkStatus();
    }
    this.report();
  };

  function Player (name, position, speed, focus) {
    this.name = name;
    this.speed = speed || 8;
    this.focus = focus || 4;
    this.position = position || 10;
    this.inventory = {
      gun: true,
      bullets: 3
    };
  }

  Player.prototype = new Human();
  Player.prototype.sneak = function (argument) {
    this.move(0.5);
    this.noiseLevel = 0;
  };
  Player.prototype.shootAt = function (targetIndex) {
    var message, victim, random = randomNumberIn(10);

    if (this.inventory.bullets) {
      message = "Bang! ";
      this.inventory.bullets--;
      if (random > 7) {
        message += this.name + " killed " + game.zombies[targetIndex].name + "!";
        game.zombies.splice(targetIndex, 1);
      } else if (random >= 1) {
        message += this.name + " misses wildly!";
      } else {
        victim = game.survivors[randomNumberIn(game.survivors.length)];
        message += this.name + " accidentally shot " + victim.name + "! ";
        victim.shot = true;
        victim.speed = 0;
        victim.state = "is dead";
      }
    } else {
      message = "Click! " + this.name + "\'s gun is empty!";
    }
    game.consoleLog(message);
    this.state = "is stopped";
    this.report();
  };
  Player.prototype.checkPlayerStatus = function () {
    if (this.bitten) {
      this.dies();
    } else if (this.position >= game.distance) {
      this.wins();
    }
  };
  Player.prototype.dies = function (fromKiller) {
    var toggleBackground = function () {
      $("#approachImage").hide();
      $("#backgroundImage").toggleClass("overrun");
      $("#youDied").show();
      $(".startGame").show();
    };
    $(".playingGame").hide();
    game.consoleLog(this.name + " dies.");
    game.$console.slideToggle();
    game.$dialogText.text(fromKiller.name + " got " + this.name + "!");
    $("#approachImage")
      .animate({"opacity": "1", "width": "100%"}, "300");
    setTimeout(toggleBackground, [400]);
  };
  Player.prototype.wins = function () { //still has a formatting bug with commas.
    var i, message = "";

    if (game.escapees.length > 1) {
      if (game.escapees.length == 2) {
        message = game.escapees[0].name + " and " + game.escapees[1].name;
        } else {
          var lastMemberIndex = game.escapees.length - 1;
          for (i = 0; i < lastMemberIndex; i++) {
            message += game.escapees[i].name + ", ";
          }
          message += "and " + game.escapees[lastMemberIndex].name;
        }
    }

    message += " escaped from the city alive!";

    game.consoleLog(this.name + " wins.");
    game.$console.slideToggle();
    game.$dialogText.text(message);
    $("#youWon").show();
    $("#backgroundImage").toggleClass("roadClosed");
    $(".playingGame").hide();
    $(".startGame").show();
  };

  function Location (argument) {
    this.name = name;
    this.position = position;
    this.details = details;
    this.inventory = inventory;
  }

  function randomNumberIn (numberSet) {
    return Math.floor(Math.random() * numberSet);
  }


  /*************************
  Image Preload
  **************************/

  $(function () {
    var $preloadContainer = $(document.createElement('span'));
    var $backgroundImage = $("#backgroundImage");

    $($preloadContainer)
      .attr("id", "preload")
      .appendTo($backgroundImage);
  });

  /*************************
  Event Listeners
  **************************/

  //Click handler for startButton.
  $("#startButton").on("click", function (e) {
    e.preventDefault();

    if ($(this).hasClass("newGame")) {
      $("#backgroundImage").removeClass("roadClosed overrun");
      $("#approachImage").removeAttr("style");
      $(".endgame").hide();
    }

    $(this)
      .text("Start New Game")
      .addClass("newGame")
      .hide();
    game.createGame();
    $(".playingGame").show();
    game.$console.slideToggle(200);

    game.turn.full();
  });

  //Click handler for moveButton.
  $("#moveButton").on("click", function (e) {
    e.preventDefault();
    game.consoleClear();
    game.turn.full();
  });

  //Click handler for playerShoots.
  $("#playerShoots").on("click", function (e) {
    e.preventDefault();
    game.consoleClear();
    game.players[0].shootAt(0);
    game.turn.npc();
  });

  //Click handler for playerDeath button.
  $("#playerDeath").on("click", function (e) {
    e.preventDefault();
    game.players[0].dies();
  });

// }()); //End of IIFE
