const moment = require('moment');
const Space = require('../modules/Space');
const Crypto = require('../modules/Crypto');
const Urban = require('../modules/Urban');
const maps = require('../../game/data/maps');
const Helper = require('../../utils/Helper');
const { commandChannel } = require('../../../settings');

const commands = [
  // RPG COMMANDS
  help = {
    command: '!help',
    operatorOnly: false,
    function: (game, message) => {
    	const helpEmbed = {
    		"title": "Help",
		    "description": "This is a list of available commands.\nYou can private message me these commands except for commands that mention other players.\ncommands wrapped in `[]` are optional.",
		    "timestamp": moment(),
		    "fields": [
		    	{
		    		"name": "!top10 [gold, spells, level, stolen, stole, gambles, events, bounty]",
		    		"value":"Retrieves top 10 highest of selected section. (default level)"
		    	},
					{
						"name": "!stats [@mention]",
						"value":"Sends a PM with the players stats. (default you)"
					},
					{
						"name": "!equip [@mention]",
						"value":"Sends a PM with the players equipment. (default you)"
					},
					{
						"name": "!character [@mention]",
						"value":"Sends a PM with the players equipment and stats. (default you)"
					},
					{
						"name": "!map",
						"value":"Displays the worlds locations"
					},
					{
						"name": "!castspell [spell]",
						"value":"Casts a global spell onto Idle-RPG (default lists spells available to cast.)"
					},
					{
						"name": "!eventlog [@mention]",
						"value":"Lists up to 15 past events of mentioned player (default all players)"
					},
					{
						"name": "!pvplog [@mention]",
						"value":"Lists up to 15 past PvP events of mentioned player (default all players)"
					},
					{
						"name": "!mention <on|off>",
						"value":"Change if events relating to you will @Mention you"
					},
					{
						"name": "!pm <on|off|filtered>",
						"value":"Change if events relating to you will be private messaged to you"
					},
					{
						"name": "!gender <male|female|neutral|neuter>",
						"value":"Change your character's gender"
					},
					{
						"name": "!lore <Map Name>",
						"value":"Retrieves the lore of map selected"
					},
					{
						"name": "!bounty <@Mention of player> <Bounty Amount>",
						"value":"Puts a bounty on the death of a player"
					},
					{
						"name": "!spellbook",
						"value":"Returns list of spells your character has learned"
					},
					{
						"name": "!inventory",
						"value":"Displays what your character has in his/her inventory"
					}
		    ]
    	}
      message.author.send({helpEmbed});
    }
  },

  character = {
    command: '!character',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerStats(playerObj.array()[0])
          .then((playerStats) => {
            if (!playerStats) {
              return message.author.send('This character was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const stats = Helper.generateStatsString(playerStats);
            const equip = Helper.generateEquipmentsString(playerStats);
            message.author.send(stats.replace('Here are your stats!', `Here is ${playerStats.name}s stats!`)
              .concat('\n')
              .concat(equip).replace('Heres your equipment!', `Here is ${playerStats.name}s equipment!`));
          });
      }

      return game.playerStats(message.author)
        .then((playerStats) => {
          if (!playerStats) {
            return message.author.send('Your character were not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const stats = Helper.generateStatsString(playerStats);
          const equip = Helper.generateEquipmentsString(playerStats);
          message.author.send(stats.concat('\n').concat(equip));
        });
    }
  },

  inventory = {
    command: '!inventory',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerInventory(playerObj.array()[0])
          .then((playerInventory) => {
            if (!playerInventory) {
              return message.author.send('This players inventory was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const inv = Helper.generateInventoryString(playerInventory);
            message.author.send(inv.replace('Here is your inventory!', `Here is ${playerInventory.name}s inventory!`));
          });
      }

      game.playerInventory(message.author)
        .then((playerInventory) => {
          if (!playerInventory) {
            return message.author.send('Your inventory was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const inv = Helper.generateInventoryString(playerInventory);
          message.author.send(inv);
        });
    }
  },

  stats = {
    command: '!stats',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerStats(playerObj.array()[0])
          .then((playerStats) => {
            if (!playerStats) {
              return message.author.send('This players stats were not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const stats = Helper.generateStatsString(playerStats);
            message.author.send(stats.replace('Here are your stats!', `Here is ${playerStats.name}s stats!`));
          });
      }

      game.playerStats(message.author)
        .then((playerStats) => {
          if (!playerStats) {
            return message.author.send('Your stats were not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const stats = Helper.generateStatsString(playerStats);
          message.author.send(stats);
        });
    }
  },

  equip = {
    command: '!equip',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerEquipment(playerObj.array()[0])
          .then((playerEquipment) => {
            if (!playerEquipment) {
              return message.author.send('This players equipment was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const equip = Helper.generateEquipmentsString(playerEquipment);
            message.author.send(equip.replace('Heres your equipment!', `Here is ${playerEquipment.name}s equipment!`));
          });
      }

      game.playerEquipment(message.author)
        .then((playerEquipment) => {
          if (!playerEquipment) {
            return message.author.send('Your equipment was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const equip = Helper.generateEquipmentsString(playerEquipment);
          message.author.send(equip);
        });
    }
  },

  spellbook = {
    command: '!spellbook',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        let checkPlayer = message.content.split(/ (.+)/)[1];
        checkPlayer = checkPlayer.replace(/([\<\@\!\>])/g, '');
        const playerObj = discordBot.users.filter(player => player.id === checkPlayer && !player.bot);
        if (playerObj.size === 0) {
          message.author.send(`${checkPlayer} was not found!`);
          return;
        }

        return game.playerStats(playerObj.array()[0])
          .then((playerSpells) => {
            if (!playerSpells) {
              return message.author.send('This players spellbook was not found! This player probably was not born yet. Please be patient until destiny has chosen him/her.');
            }

            const spellBook = Helper.generateSpellBookString(playerSpells);
            message.author.send(spellBook.replace('Here\'s your spellbook!', `Here is ${playerSpells.name}'s spellbook!`));
          });
      }

      game.playerStats(message.author)
        .then((playerSpells) => {
          if (!playerSpells) {
            return message.author.send('Your spellbook was not found! You probably were not born yet. Please be patient until destiny has chosen you.');
          }

          const spellBook = Helper.generateSpellBookString(playerSpells);
          message.author.send(spellBook);
        });
    }
  },

  map = {
    command: '!map',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message, discordBot) => {
      const discordOnlinePlayers = discordBot.users
        .filter(player => player.presence.status === 'online' && !player.bot
          || player.presence.status === 'idle' && !player.bot
          || player.presence.status === 'dnd' && !player.bot)
        .map((player) => {
          return player.id;
        });

      game.getOnlinePlayerMaps(discordOnlinePlayers)
        .then((players) => {
          let mapInfo = '';
          maps.forEach((map) => {
            mapInfo = mapInfo.concat(`\n${map.name} (${map.type.name}):\n`);
            players.forEach((player) => {
              if (player.map.name === map.name) {
                mapInfo = mapInfo.concat(`${player.name}, `);
              }
            });
            mapInfo = mapInfo.replace(/,\s*$/, '\n');
          });

          message.author.send(`\`\`\`Map of Idle-RPG:\n${mapInfo}\`\`\``);
        });
    }
  },

  lore = {
    command: '!lore',
    operatorOnly: false,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitMessage = message.content.split(/ (.+)/)[1].toLowerCase();
        const requestedMap = maps.filter(map => map.name.toLowerCase() === splitMessage)
          .map(map => map.lore);

        if (requestedMap.length === 0) {
          return message.author.send(`${splitMessage} was not found. Did you type the map correctly?`);
        }

        return message.author.send(`\`\`\`${Helper.capitalizeFirstLetter(splitMessage)}: ${requestedMap[0]}\`\`\``);
      }

      return message.author.send('You must enter a map to retrieve its lore. Check `!help` for more info.');
    }
  },

  top10 = {
    command: '!top10',
    channelOnlyId: commandChannel,
    function: (game, message) => {
      switch ((message.content.split(/ (.+)/)[1] === undefined) ? 'level' : message.content.split(/ (.+)/)[1].toLowerCase()) {
        case 'gambles':
          game.top10(message.author, { gambles: -1 });
          break;
        case 'stolen':
          game.top10(message.author, { stolen: -1 });
          break;
        case 'stole':
          game.top10(message.author, { stole: -1 });
          break;
        case 'gold':
          game.top10(message.author, { gold: -1 });
          break;
        case 'spells':
          game.top10(message.author, { spellCasted: -1 });
          break;
        case 'events':
          game.top10(message.author, { events: -1 });
          break;
        case 'bounty':
          game.top10(message.author, { currentBounty: -1 });
          break;
        default:
          game.top10(message.author, { level: -1 });
          break;
      }
    }
  },

  giveEquipmentToPlayer = {
    command: '!giveplayer',
    operatorOnly: true,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitArray = message.content.split(' ');
        const playerId = splitArray[1];
        const position = splitArray[2];
        const equipment = JSON.parse(splitArray.slice(3, splitArray.length).join(' '));
        game.loadPlayer(playerId)
          .then((player) => {
            player.equipment[position] = equipment;
            game.savePlayer(player)
              .then(() => {
                message.author.send('Done.');
              });
          });
      }
    }
  },

  castSpell = {
    command: '!castspell',
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, discordHook) => {
      if (message.content.includes(' ')) {
        return game.castSpell(message.author, discordHook, message.content.split(/ (.+)/)[1].toLowerCase());
      }

      return message.reply(`\`\`\`List of spells:
        bless - 1500 gold - Increases global EXP/GOLD multiplier by 1 for 30 minutes.
        home - 500 gold - Teleports you back to Kindale.
        \`\`\``);
    }
  },

  /**
   * places a bounty on a specific player for a specific amount should work with @playername and then a gold amount
   */
  placeBounty = {
    command: '!bounty',
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, discordHook) => {
      const splitArray = message.content.split(' ');
      if (message.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];

        if (Number(amount) <= 0 || Number(amount) % 1 !== 0 || !amount.match(/^\d+$/)) {
          return message.author.send('Please use a regular amount of gold.');
        }
        if (Number(amount) < 100) {
          return message.author.send('You must place a bounty higher or equal to 100');
        }
        if (!recipient.match(/^\d+$/)) {
          return message.author.send('Please add a bounty to a player.');
        }
        return game.placeBounty(discordHook, message.author, recipient, Number(amount));
      }

      return message.author.send('Please specify a player and amount of gold you wish to place on their head. You need to have enough gold to put on their head');
    }
  },

  eventLog = {
    command: '!eventlog',
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        return game.playerEventLog(splitCommand[1].replace(/([\<\@\!\>])/g, ''), 15)
          .then((result) => {
            if (!result || result.length === 0) {
              return message.author.send('This player has not activated any Events yet.');
            }

            return message.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return game.playerEventLog(message.author.id, 15)
        .then((result) => {
          if (!result || result.length === 0) {
            return message.author.send('You have not activated any Events yet.');
          }

          return message.author.send(`\`\`\`${result}\`\`\``);
        });
    }
  },

  pvpLog = {
    command: '!pvplog',
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        return game.playerPvpLog(splitCommand[1].replace(/([\<\@\!\>])/g, ''), 15)
          .then((result) => {
            if (!result || result.length === 0) {
              return message.author.send('This player has not had any PvP Events yet.');
            }

            return message.author.send(`\`\`\`${result}\`\`\``);
          });
      }

      return game.playerPvpLog(message.author.id, 15)
        .then((result) => {
          if (!result || result.length === 0) {
            return message.author.send('You have not had any PvP Events yet.');
          }

          return message.author.send(`\`\`\`${result}\`\`\``);
        });
    }
  },

  /**
   * Subscribe to PM messages
   */
  privateMessage = {
    command: '!pm',
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, discordHook) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        switch (splitCommand[1].toLowerCase()) {
          case 'on':
          case 'off':
            return game.modifyPM(message.author, discordHook, splitCommand[1] === 'on', false);
          case 'filtered':
            return game.modifyPM(message.author, discordHook, true, true);
        }
      }

      return message.reply(`\`\`\`Possible options:
      on - You will be pmed in events that include you
      off - You won't be pmed in events that include you
      filtered - You will be pmed certain important events that include you
      \`\`\``);
    }
  },

  /**
   * Modify if player will be @Mentioned in events
   */
  modifyMention = {
    command: '!mention',
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, discordHook) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);

        // Use switch to validate the value
        switch (splitCommand[1].toLowerCase()) {
          case 'on':
          case 'off':
            return game.modifyMention(message.author, discordHook, splitCommand[1] === 'on');
        }
      }

      return message.reply(`\`\`\`Possible options:
        on - You will be tagged in events that include you
        off - You won't be tagged in events that include you
        \`\`\``);
    }
  },

  /**
   * Modify player's gender
   */
  modifyGender = {
    command: '!gender',
    channelOnlyId: commandChannel,
    function: (game, message, discordBot, discordHook) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);

        // Use switch to validate the value
        switch (splitCommand[1].toLowerCase()) {
          case 'male':
          case 'female':
          case 'neutral':
          case 'neuter':
            return game.modifyGender(message.author, discordHook, splitCommand[1]);
        }
      }

      return message.reply(`\`\`\`Possible options:
        male
        female
        neutral
        neuter
        \`\`\``);
    }
  },

  // Bot Operator commands
  setPlayerBounty = {
    command: '!setbounty',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      const splitArray = message.content.split(' ');
      if (message.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];
        game.setPlayerBounty(recipient, Number(amount));
        return message.author.send('Done');
      }
    }
  },

  setPlayerGold = {
    command: '!setgold',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      const splitArray = message.content.split(' ');
      if (message.content.includes(' ') && splitArray.length === 3) {
        const recipient = splitArray[1].replace(/([\<\@\!\>])/g, '');
        const amount = splitArray[2];
        game.setPlayerGold(recipient, Number(amount));
        return message.author.send('Done');
      }
    }
  },

  sendChristmasFirstPreMessage = {
    command: '!xmasfirst',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      game.sendChristmasFirstPreEventMessage();
    }
  },

  sendChristmasSecondPreMessage = {
    command: '!xmassecond',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      game.sendChristmasSecondPreEventMessage();
    }
  },

  christmasEventCommand = {
    command: '!xmas',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        switch (message.content.split(/ (.+)/)[1].toLowerCase()) {
          case 'true':
            return game.updateChristmasEvent(true);
          case 'false':
            return game.updateChristmasEvent(false);
        }
      }
    }
  },

  activateBlizzard = {
    command: '!blizzard',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const splitCommand = message.content.split(/ (.+)/);
        const blizzardBoolean = game.blizzardSwitch(splitCommand[1]);
        switch (splitCommand) {
          case 'on':
            message.author.send(blizzardBoolean ? 'Blizzard is already activated!' : 'Blizzard activated.');
            break;
          case 'off':
            message.author.send(!blizzardBoolean ? 'Blizzard is already deactivated!' : 'Blizzard deactivated.');
            break;
        }
      }
    }
  },

  giveGold = {
    command: '!givegold',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ') && message.content.split(' ').length > 2) {
        const splitCommand = message.content.split(' ');
        game.giveGold(splitCommand[1], splitCommand[2])
          .then(() => {
            message.author.send('Done.');
          });
      }
    }
  },

  resetPlayer = {
    command: '!resetplayer',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        game.deletePlayer(message.content.split(/ (.+)/)[1])
          .then(() => {
            message.author.send('Done.');
          });
      }
    }
  },

  resetAll = {
    command: '!resetall',
    operatorOnly: true,
    channelOnlyId: commandChannel,
    function: (game, message) => {
      game.deleteAllPlayers()
        .then(() => {
          message.author.send('Done.');
        });
    }
  },

  // MODULE COMMANDS
  nextLaunch = {
    command: '!nextlaunch',
    operatorOnly: false,
    function: (game, message) => {
      Space.nextLaunch()
        .then((spaceInfo) => {
          const nextLaunch = spaceInfo.launches[0];
          const codeBlock = '\`\`\`';
          let info = codeBlock;
          info = info.concat(`${nextLaunch.provider}s ${nextLaunch.vehicle}`);
          info = info.concat(`\nPayLoad: ${nextLaunch.payload}`);
          info = info.concat(`\nLocation: ${nextLaunch.location}`);
          info = info.concat(`\nLaunch Time: ${moment(nextLaunch.launchtime).utc('br')}`);
          info = info.concat(`\nStream: ${nextLaunch.hasStream ? 'Yes' : 'No'}`);
          info = info.concat(`\nDelayed: ${nextLaunch.delayed ? 'Yes' : 'No'}`);
          info = info.concat(codeBlock);
          message.reply(info);
        });
    }
  },

  nextStreamlaunch = {
    command: '!nextstreamlaunch',
    operatorOnly: false,
    function: (game, message) => {
      Space.nextLaunch()
        .then((spaceInfo) => {
          let nextLaunch;
          for (let i = 0; i < spaceInfo.launches.length; i++) {
            if (spaceInfo.launches[i].hasStream) {
              nextLaunch = spaceInfo.launches[i];
              break;
            }
          }

          const codeBlock = '\`\`\`';
          let info = codeBlock;
          info = info.concat(`${nextLaunch.provider}s ${nextLaunch.vehicle}`);
          info = info.concat(`\nPayLoad: ${nextLaunch.payload}`);
          info = info.concat(`\nLocation: ${nextLaunch.location}`);
          info = info.concat(`\nLaunch Time: ${moment(nextLaunch.launchtime).utc('br')}`);
          info = info.concat(`\nStream: ${nextLaunch.hasStream ? 'Yes' : 'No'}`);
          info = info.concat(`\nDelayed: ${nextLaunch.delayed ? 'Yes' : 'No'}`);
          info = info.concat(codeBlock);
          message.reply(info);
        });
    }
  },

  crypto = {
    command: '!crypto',
    operatorOnly: false,
    function: (game, message) => {
      let currency = 'BRL';
      if (message.content.includes(' ')) {
        currency = message.content.split(/ (.+)/)[1];
      }

      Crypto.top5(currency)
        .then((cyrptoInfo) => {
          const codeBlock = '\`\`\`';
          const currencyVar = `price_${currency.toLocaleLowerCase()}`;
          let info = codeBlock;
          cyrptoInfo.forEach((c) => {
            info = info.concat(`${c.name} (${c.symbol})`);
            info = info.concat(`\nRank: ${c.rank}`);
            info = info.concat(`\nUSD: ${c.price_usd}`);
            info = info.concat(`\n${currency.toUpperCase()}: ${c[currencyVar]}`);
            info = info.concat(`\nPercent Change 1h: ${c.percent_change_1h}%`);
            info = info.concat(`\nPercent Change 24h: ${c.percent_change_24h}%`);
            info = info.concat(`\nPercent Change 7d: ${c.percent_change_7d}%\n\n`);
          });
          info = info.concat(codeBlock);
          message.reply(info);
        });
    }
  },

  urban = {
    command: '!urban',
    operatorOnly: false,
    function: (game, message) => {
      if (message.content.includes(' ')) {
        const word = message.content.split(/ (.+)/)[1].toLowerCase().replace(' ', '+');

        return Urban.searchUrbanDictionary(word)
          .then((result) => {
            let definition = 'Urban Dictionary Definition of ****\n```';
            const wordDefinition = result.list.sort((item1, item2) => {
              return item1.thumbs_up - item2.thumbs_up;
            })[0];
            definition = definition.replace('****', `\`${Helper.capitalizeFirstLetter(wordDefinition.word).replace('+', ' ')}\``);

            return message.reply(definition.concat(`Definition:\n${wordDefinition.definition}\n\nExample:\n${wordDefinition.example}\`\`\`\n[:thumbsup::${wordDefinition.thumbs_up} / :thumbsdown::${wordDefinition.thumbs_down}]`));
          });
      }

      return message.reply('Please specify a word to look up.');
    }
  }
];
module.exports = commands;
