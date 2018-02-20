const fs = require('fs');
const Database = require('../database/Database');
const enumHelper = require('../utils/enumHelper');
const { moveLog, actionLog, errorLog } = require('../utils/logger');
const { battleDebug, eventDebug, guildID } = require('../../settings');

class Helper {
  printBattleDebug(debugMsg) {
    if (battleDebug) {
      console.log(debugMsg);
    }
  }

  printEventDebug(debugMsg) {
    if (eventDebug) {
      console.log(debugMsg);
    }
  }

  randomBetween(min, max, decimal, exclude) {
    // https://stackoverflow.com/questions/15594332/unbiased-random-range-generator-in-javascript
    if (arguments.length < 2) return (Math.random() >= 0.5);

    let factor = 1;
    let result;
    if (typeof decimal === 'number') {
      factor = decimal ** 10;
    }

    do {
      result = (Math.random() * (max - min)) + min;
      result = Math.round(result * factor) / factor;
    } while (result === exclude);
    return result;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase()
      .concat(string.slice(1));
  }

  getTimePassed(timeStamp) {
    return this.toTimeFormat(new Date().getTime() - timeStamp);
  }

  toTimeFormat(duration) {
    const date = new Date(duration);
    const seconds = date.getUTCSeconds();
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();
    const days = (date.getUTCDate() - 1);

    const dayString = (date.getUTCDate() - 1) === 0 ? '' : `${days}d `;
    const hourString = date.getUTCHours() === 0 ? '' : `${hours}h `;
    const minuteString = date.getUTCMinutes() === 0 ? '' : `${minutes}m `;
    const secondString = date.getUTCSeconds() === 0 ? '' : `${seconds}s`;

    return `${dayString}${hourString}${minuteString}${secondString}`;
  }

  logEvent(selectedPlayer, msg, eventToLog) {
    if (selectedPlayer[eventToLog].length === 99) {
      selectedPlayer[eventToLog].shift();
    }
    selectedPlayer[eventToLog].push({
      event: msg,
      timeStamp: new Date().getTime()
    });

    return selectedPlayer;
  }

  sendPrivateMessage(discordHook, player, msg, isImportantMessage) {
    if (player && player.isPrivateMessage) {
      if (player.isPrivateMessageImportant && !isImportantMessage) {
        return;
      }

      discordHook.discordBot.guilds.find('id', guildID)
        .members.find('id', player.discordId).send(msg)
        .catch(err => errorLog.error(err));
    }
  }

  sendMessage(discordHook, twitchBot, player, isMovement, msg) {
    if (msg.toLowerCase().includes('pyddur')) {
      msg = msg.replace(new RegExp('<@!pyddur>', 'g'), '\`Pyddur, God Of Beer\`');
    }

    if (isMovement) {
      discordHook.movementHook.send(msg)
        .then(debugMsg => moveLog.move(this.formatLog(debugMsg)))
        .catch(err => errorLog.error(err));
    } else {
      discordHook.actionHook.send(msg)
        .then(debugMsg => actionLog.action(this.formatLog(debugMsg)))
        .catch(err => errorLog.error(err));
    }

    // Add if to check if channel is streaming
    // twitchBot.say(msg.replace('/\*/g', ''));
  }

  formatLog(json) {
    const formattedLog = {
      timeStamp: json.timestamp,
      content: json.content,
      mentions: json.mentions,
    };
    return formattedLog;
  }

  setImportantMessage(message) {
    return `\`\`\`css\n${message}\`\`\``;
  }

  passiveRegen(player, hpRegenAmount, mpRegenAmount) {
    if (player.health <= enumHelper.maxHealth(player.level)) {
      player.health += Math.ceil(hpRegenAmount);
      if (player.health > enumHelper.maxHealth(player.level)) {
        player.health = enumHelper.maxHealth(player.level);
      }
    }

    if (player.mana <= enumHelper.maxMana(player.level)) {
      player.mana += Math.ceil(mpRegenAmount);
      if (player.mana > enumHelper.maxMana(player.level)) {
        player.mana = enumHelper.maxMana(player.level);
      }
    }
    return player;
  }

  countDirectoryFiles(directory) {
    return new Promise((resolve, reject) => {
      return fs.readdir(directory, (err, files) => {
        if (err) {
          return reject(err);
        }

        return resolve(files.length);
      });
    });
  }

  calculateItemRating(player, item) {
    if (player && item.position !== enumHelper.equipment.types.relic.position) {
      if (item.position !== enumHelper.equipment.types.weapon.position) {
        return item.power;
      }

      // TODO: Remove when releasing feature
      if (process.env.NODE_ENV.includes('development')) {
        switch (item.attackType) {
          case 'melee':
            return Math.ceil((this.sumPlayerTotalStrength(player) + item.power)
              + (this.sumPlayerTotalDexterity(player)
                + ((this.sumPlayerTotalLuck(player)
                  + this.randomBetween(1, this.sumPlayerTotalStrength(player))) / 2)));

          case 'range':
            return Math.ceil((this.sumPlayerTotalDexterity(player) + item.power)
              + (this.sumPlayerTotalDexterity(player)
                + ((this.sumPlayerTotalLuck(player)
                  + this.randomBetween(1, this.sumPlayerTotalDexterity(player))) / 2)));

          case 'magic':
            return Math.ceil((this.sumPlayerTotalIntelligence(player) + item.power)
              + (this.sumPlayerTotalDexterity(player)
                + ((this.sumPlayerTotalLuck(player)
                  + this.randomBetween(1, this.sumPlayerTotalIntelligence(player))) / 2)));
        }
      } else {
        return item.power;
      }
    }

    return Math.ceil(item.str + item.dex + item.end + item.int + item.luk);
  }

  sumPlayerTotalStrength(player) {
    return player.stats.str
      + player.equipment.relic.str;
  }

  sumPlayerTotalDexterity(player) {
    return player.stats.dex
      + player.equipment.relic.dex;
  }

  sumPlayerTotalEndurance(player) {
    return player.stats.end
      + player.equipment.relic.end;
  }

  sumPlayerTotalIntelligence(player) {
    return player.stats.int
      + player.equipment.relic.int;
  }

  sumPlayerTotalLuck(player) {
    return player.stats.luk
      + player.equipment.relic.luk;
  }

  checkExperience(selectedPlayer, discordHook, twitchBot) {
    if (selectedPlayer.experience >= selectedPlayer.level * 15) {
      selectedPlayer.level++;
      selectedPlayer.experience = 0;
      selectedPlayer.health = 100 + (selectedPlayer.level * 5);
      selectedPlayer.mana = 50 + (selectedPlayer.level * 5);
      if (process.env.NODE_ENV.includes('development')) {
        for (let i = 0; i < 4; i++) {
          switch (this.randomBetween(0, 3)) {
            case 0:
              selectedPlayer.stats.str++;
              break;
            case 1:
              selectedPlayer.stats.dex++;
              break;
            case 2:
              selectedPlayer.stats.end++;
              break;
            case 3:
              selectedPlayer.stats.int++;
              break;
          }
        }

        const playerStats = Object.keys(selectedPlayer.stats).map((key) => {
          if (['str', 'dex', 'int'].includes(key)) {
            return {
              key,
              value: selectedPlayer.stats[key]
            };
          }
        }).filter(obj => obj !== undefined)
          .sort((stat1, stat2) => stat2.value - stat1.value);

        switch (playerStats[0].key) {
          case 'str':
            selectedPlayer.class = 'Knight';
            break;
          case 'dex':
            selectedPlayer.class = 'Thief';
            break;
          case 'int':
            selectedPlayer.class = 'Mage';
            break;
        }
      } else {
        selectedPlayer.stats.str++;
        selectedPlayer.stats.dex++;
        selectedPlayer.stats.end++;
        selectedPlayer.stats.int++;
      }

      const eventMsg = this.setImportantMessage(`${selectedPlayer.name} is now level ${selectedPlayer.level}!`);
      const eventLog = `Leveled up to level ${selectedPlayer.level}`;

      this.sendMessage(discordHook, 'twitch', selectedPlayer, false, eventMsg);
      this.sendPrivateMessage(discordHook, selectedPlayer, eventLog, true);
      selectedPlayer = this.logEvent(selectedPlayer, eventLog, 'pastEvents');
    }
  }

  setPlayerEquipment(selectedPlayer, equipment, item) {
    selectedPlayer.equipment[equipment].name = item.name;
    if (equipment !== enumHelper.equipment.types.relic.position) {
      selectedPlayer.equipment[equipment].power = item.power;
      if (equipment === enumHelper.equipment.types.weapon.position) {
        selectedPlayer.equipment[equipment].attackType = item.attackType;
      }
    } else if (equipment === enumHelper.equipment.types.relic.position) {
      selectedPlayer.equipment[equipment].str = item.stats.str;
      selectedPlayer.equipment[equipment].dex = item.stats.dex;
      selectedPlayer.equipment[equipment].end = item.stats.end;
      selectedPlayer.equipment[equipment].int = item.stats.int;
      selectedPlayer.equipment[equipment].luk = item.stats.luk;
    }
    selectedPlayer.equipment[equipment].previousOwners = item.previousOwners;

    return selectedPlayer;
  }

  checkHealth(MapClass, selectedPlayer, attackerObj, hook) {
    if (selectedPlayer.health <= 0) {
      selectedPlayer.health = 100 + (selectedPlayer.level * 5);
      selectedPlayer.mana = 50 + (selectedPlayer.level * 5);
      selectedPlayer.map = MapClass.getMapByIndex(4);
      selectedPlayer.experience -= Math.round(selectedPlayer.experience / 4);
      selectedPlayer.gold = Math.round(selectedPlayer.gold / 2);
      selectedPlayer.inventory = {
        equipment: [],
        items: []
      };

      const dropChance = this.randomBetween(0, 100);
      if (dropChance < 15) {
        switch (this.randomBetween(0, 2)) {
          case 0:
            if (selectedPlayer.equipment.helmet.name !== enumHelper.equipment.empty.helmet.name) {
              this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${selectedPlayer.name}'s ${selectedPlayer.equipment.helmet.name} just broke!`));
              this.sendPrivateMessage(hook, selectedPlayer, `Your ${selectedPlayer.equipment.helmet.name} just broke!`, true);
              this.setPlayerEquipment(
                selectedPlayer,
                enumHelper.equipment.types.helmet.position,
                enumHelper.equipment.empty.helmet
              );
            }
            break;
          case 1:
            if (selectedPlayer.equipment.armor.name !== enumHelper.equipment.empty.armor.name) {
              this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${selectedPlayer.name}'s ${selectedPlayer.equipment.armor.name} just broke!`));
              this.sendPrivateMessage(hook, selectedPlayer, `Your ${selectedPlayer.equipment.armor.name} just broke!`, true);
              this.setPlayerEquipment(
                selectedPlayer,
                enumHelper.equipment.types.armor.position,
                enumHelper.equipment.empty.armor
              );
            }
            break;
          case 2:
            if (selectedPlayer.equipment.weapon.name !== enumHelper.equipment.empty.weapon.name) {
              this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${selectedPlayer.name}'s ${selectedPlayer.equipment.weapon.name} just broke!`));
              this.sendPrivateMessage(hook, selectedPlayer, `Your ${selectedPlayer.equipment.weapon.name} just broke!`, true);
              this.setPlayerEquipment(
                selectedPlayer,
                enumHelper.equipment.types.weapon.position,
                enumHelper.equipment.empty.weapon
              );
            }
            break;
        }
      }

      if (selectedPlayer.deaths.firstDeath === 'never') {
        selectedPlayer.deaths.firstDeath = new Date().getTime();
      }

      if (!attackerObj.discordId) {
        selectedPlayer.deaths.mob++;
      } else {
        if (selectedPlayer.currentBounty > 0) {
          attackerObj.gold += selectedPlayer.currentBounty;
          this.sendMessage(hook, 'twitch', selectedPlayer, false, this.setImportantMessage(`${attackerObj.name} just claimed ${selectedPlayer.currentBounty} gold as a reward for killing ${selectedPlayer.name}!`));
          this.sendPrivateMessage(hook, selectedPlayer, `${attackerObj.name} just claimed ${selectedPlayer.currentBounty} gold as a reward for killing you!`, true);
          const bountyEventLog = `Claimed ${selectedPlayer.currentBounty} gold for ${selectedPlayer.name}'s head`;
          attackerObj = this.logEvent(attackerObj, bountyEventLog, 'pastEvents');
          attackerObj = this.logEvent(attackerObj, bountyEventLog, 'pastPvpEvents');
          this.sendPrivateMessage(hook, attackerObj, bountyEventLog, true);
          selectedPlayer.currentBounty = 0;
        }

        selectedPlayer.deaths.player++;
        attackerObj.kills.player++;
        Database.savePlayer(selectedPlayer);
      }

      const eventMsg = this.setImportantMessage(`${selectedPlayer.name} died! Game over man... Game over.`);
      const eventLog = 'You died. Game over man... Game over.';

      this.sendMessage(hook, 'twitch', selectedPlayer, false, eventMsg);
      this.sendPrivateMessage(hook, selectedPlayer, eventLog, true);
      selectedPlayer = this.logEvent(selectedPlayer, eventLog, 'pastEvents');
    }
  }

  generateSpellBookEmbed(player) {
    let spellBookEmbed = {
    	'title': 'Here\'s your spellbook!'
    	"fields": []
    };
    player.spells.forEach((spell) => {
    	spellBookEmbed.fields.push({
    		'name':`${spell.name}`,
    		'description':`${spell.description}`
    	});
    });

    return spellBookEmbed;
  }

  generateStatsEmbed(player) {
  	const statsEmbed = {
  		'title': 'Here are your stats!',
  		'fields': [
  		{
  			'title': 'Health',
  			'description': `${player.health} / ${enumHelper.maxHealth(player.level)}`.toString()
  		},
  		{
  			'title': 'Mana',
  			'description': `${player.mana} / ${enumHelper.maxMana(player.level)}`.toString()
  		},
  		{
  			'title': 'Level',
  			'description': `${player.level}`.toString()
  		},
  		{
  			'title': 'Experience',
  			'description': `${player.experience} / ${player.level * 15}`.toString()
  		},
  		{
  			'title': 'Class',
  			'description': `${player.class}`.toString()
  		},
  		{
  			'title': 'Gender',
  			'description': `${player.gender}`.toString()
  		},
  		{
  			'title': 'Gold',
  			'description': `${player.gold}`.toString()
  		},
  		{
  			'title': 'Map',
  			'description': `${player.map.name}`.toString()
  		},
  		{
  			'title': 'Bounty',
  			'description': `${player.currentBounty}`.toString()
  		},
  		{
  			'title':'Stats (Sum of stats with equipment):'
  			'description':`Strength: ${player.stats.str} (${this.sumPlayerTotalStrength(player)})\nDexterity: ${player.stats.dex} (${this.sumPlayerTotalDexterity(player)})\nEndurance: ${player.stats.end} (${this.sumPlayerTotalEndurance(player)})\nIntelligence: ${player.stats.int} (${this.sumPlayerTotalIntelligence(player)})\nLuck: ${player.stats.luk} (${this.sumPlayerTotalLuck(player)})`.toString()
  		},
    	{
    		'title': 'Born',
    		'description': `${this.toTimeFormat(Number(player.createdAt))}`.toString()
    	},
    	{
    		'title': 'Events',
    		'description': `${player.events}`.toString()
    	},
    	{
    		'title': 'Gambles',
    		'description': `${player.gambles}`.toString()
    	},
    	{
    		'title': 'Items Stolen' ,
    		'description': `${player.stole}`.toString()
    	},
    	{
    		'title': 'Items Lost' ,
    		'description': `${player.stolen}`.toString()
    	},
    	{
    		'title': 'Spells Casted',
    		'description': `${player.spellCasted}`.toString()
    	},
    Kills:
      Monsters: ${player.kills.mob}
      Players: ${player.kills.player}
    Battles:
      Won: ${player.battles.won}
      Lost: ${player.battles.lost}
    Deaths:
      By Monsters: ${player.deaths.mob}
      By Players: ${player.deaths.player}

    Past Events:
      ${this.generateLog(player, 5).replace('Heres what you have done so far:\n      ', '')}
      \`\`\``;

      	]
  	};
  	return statsEmbed;
  }

  generatePreviousOwnerString(equipment) {
    if (equipment.previousOwners && equipment.previousOwners.length > 0) {
      let result = 'Previous Owners:\n        ';
      result = result.concat(equipment.previousOwners.join('\n        '));
      result = result.concat('\n');
      return result;
    }

    return '';
  }

  /**
   * Based on player setting, either return <@!discordId> or playerName
   * @param player
   * @returns String
   */
  generatePlayerName(player) {
    if (player.isMentionInDiscord === false) {
      return `\`${player.name}\``;
    }

    return `<@!${player.discordId}>`;
  }

  /**
   * Based on player setting, transform into the correct gender
   * @param player
   * @param word
   * @returns String
   */
  generateGenderString(player, word) {
    return enumHelper.genders[player.gender] ? enumHelper.genders[player.gender][word] : word;
  }

  generateInventoryString(player) {
    return `\`\`\`Here is your inventory!
    Equipment:
      ${player.inventory.equipment.map(equip => equip.name).join('\n      ')}

    Items:
      ${player.inventory.items.map(item => item.name).join('\n      ')}
      \`\`\``;
  }

  generateEquipmentsString(player) {
    return `\`\`\`Here is your inventory!
    Helmet: ${player.equipment.helmet.name}
      Defense: ${player.equipment.helmet.power}
      ${this.generatePreviousOwnerString(player.equipment.helmet)}
    Armor: ${player.equipment.armor.name}
      Defense: ${player.equipment.armor.power}
      ${this.generatePreviousOwnerString(player.equipment.armor)}
    Weapon: ${player.equipment.weapon.name}
      AttackPower: ${player.equipment.weapon.power}
      AttackType: ${player.equipment.weapon.attackType}
        ${this.generatePreviousOwnerString(player.equipment.weapon)}
    Relic: ${player.equipment.relic.name}
      Stats:
        Strength: ${player.equipment.relic.str}
        Dexterity: ${player.equipment.relic.dex}
        Endurance: ${player.equipment.relic.end}
        Intelligence: ${player.equipment.relic.int}
        Luck: ${player.equipment.relic.luk}
      ${this.generatePreviousOwnerString(player.equipment.relic)}
        \`\`\``;
  }

  generateLog(player, count) {
    if (player.pastEvents.length === 0) {
      return '';
    }

    let logResult = 'Heres what you have done so far:\n      ';
    let logCount = 0;
    for (let i = player.pastEvents.length - 1; i >= 0; i--) {
      if (logCount === count) {
        break;
      }

      logResult = logResult.concat(`${player.pastEvents[i].event} [${this.getTimePassed(player.pastEvents[i].timeStamp)} ago]\n      `);
      logCount++;
    }

    return logResult;
  }

  generatePvpLog(player, count) {
    if (player.pastPvpEvents.length === 0) {
      return '';
    }

    let logResult = 'Heres what you have done so far:\n      ';
    let logCount = 0;
    for (let i = player.pastPvpEvents.length - 1; i >= 0; i--) {
      if (logCount === count) {
        break;
      }

      logResult = logResult.concat(`${player.pastPvpEvents[i].event} [${this.getTimePassed(player.pastPvpEvents[i].timeStamp)} ago]\n      `);
      logCount++;
    }

    return logResult;
  }
}
module.exports = new Helper();
