const helper = require('../../utils/helper');
const enumHelper = require('../../utils/enumHelper');
const Battle = require('../utils/Battle');
const Monster = require('../utils/Monster');
const Item = require('../utils/Item');
const Map = require('../utils/Map');
const Database = require('../../database/Database');

class Event {

  // Move Events
  moveEvent(selectedPlayer, discordHook) {
    return new Promise((resolve) => {
      selectedPlayer.map = Map.moveToRandomMap(selectedPlayer);
      helper.sendMessage(discordHook, 'twitch', true, `<@!${selectedPlayer.discordId}> just arrived in \`${selectedPlayer.map.name}\`.`);

      return resolve(selectedPlayer);
    });
  }

  // Attack Events
  attackForcePvPAttack(discordHook, twitchBot, selectedPlayer, playerToAttack) {
    const { playerChance, otherPlayerChance } = Battle.simulateBattleWithPlayer(
      selectedPlayer,
      playerToAttack
    );

    console.log(`GAME: Attacking Player: ${playerChance} - Random Defending Player: ${otherPlayerChance}`);

    if (playerChance >= otherPlayerChance) {
      helper.checkHealth(playerToAttack, selectedPlayer, discordHook);
      playerToAttack.health -= Math.abs(playerChance);

      helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just attacked <@!${playerToAttack.discordId}> in ${selectedPlayer.map.name} with his/her \`${selectedPlayer.equipment.weapon.name}\` dealing ${Math.abs(playerChance)} damage!`);
      return this.stealPlayerItem(discordHook, twitchBot, selectedPlayer, playerToAttack)
        .then((battleResults) => {
          Database.savePlayer(battleResults.randomPlayer);

          return battleResults.selectedPlayer;
        });
    }

    selectedPlayer.health -= Math.abs(otherPlayerChance);
    helper.checkHealth(selectedPlayer, playerToAttack, discordHook);

    helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just attacked <@!${playerToAttack.discordId}> with his/her \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` but failed!
  <@!${playerToAttack.discordId}>s \`${playerToAttack.equipment.weapon.name}\` dealt ${Math.abs(otherPlayerChance)} damage!`);

    return this.stealPlayerItem(discordHook, twitchBot, playerToAttack, selectedPlayer)
      .then((battleResults) => {
        Database.savePlayer(battleResults.randomPlayer);

        return battleResults.selectedPlayer;
      });
  }

  attackEventPlayerVsPlayer(discordHook, twitchBot, selectedPlayer, onlinePlayers) {
    return Database.getSameMapPlayers(selectedPlayer.map.name)
      .then((mappedPlayers) => {
        const sameMapPlayers = mappedPlayers.filter(player => player.name !== selectedPlayer.name && onlinePlayers.findIndex(onlinePlayer => (onlinePlayer.discordId === player.discordId)) !== -1);
        console.log(`${selectedPlayer.map.name} - SMP: ${sameMapPlayers.length} - MP: ${mappedPlayers.length} - OP: ${onlinePlayers.length}`);

        if (sameMapPlayers.length > 0) {
          const randomPlayerIndex = helper.randomInt(0, sameMapPlayers.length - 1);
          const randomPlayer = sameMapPlayers[randomPlayerIndex];

          const { playerChance, otherPlayerChance } = Battle.simulateBattleWithPlayer(
            selectedPlayer,
            randomPlayer
          );

          console.log(`GAME: Attacking Player: ${playerChance} - Random Defending Player: ${otherPlayerChance}`);

          if (playerChance >= otherPlayerChance) {
            helper.checkHealth(randomPlayer, selectedPlayer, discordHook);
            randomPlayer.health -= Math.abs(playerChance);
            selectedPlayer.battles.won++;
            randomPlayer.battles.lost++;

            helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just attacked <@!${randomPlayer.discordId}> in \`${selectedPlayer.map.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` dealing ${Math.abs(playerChance)} damage!`);
            return this.stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer)
              .then((battleResults) => {
                Database.savePlayer(battleResults.randomPlayer);

                return battleResults.selectedPlayer;
              });
          }

          selectedPlayer.health -= Math.abs(otherPlayerChance);
          helper.checkHealth(selectedPlayer, randomPlayer, discordHook);
          randomPlayer.battles.won++;
          selectedPlayer.battles.lost++;

          helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just attacked <@!${randomPlayer.discordId}> with his/her \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` but failed!
          <@!${randomPlayer.discordId}>s \`${randomPlayer.equipment.weapon.name}\` dealt ${Math.abs(otherPlayerChance)} damage!`);

          return this.stealPlayerItem(discordHook, twitchBot, randomPlayer, selectedPlayer)
            .then((battleResults) => {
              Database.savePlayer(battleResults.randomPlayer);

              return battleResults.selectedPlayer;
            });
        }

        return this.attackEventMob(discordHook, twitchBot, selectedPlayer);
      });
  }

  attackEventMob(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const mob = Monster.generateMonster(selectedPlayer);
      const { playerChance, mobChance } = Battle.simulateBattleWithMob(selectedPlayer, mob);

      console.log(`GAME: PlayerChance: ${playerChance} - MobChance: ${mobChance}`);

      if (playerChance >= mobChance) {
        selectedPlayer.experience += mob.experience;
        selectedPlayer.gold += mob.gold;
        selectedPlayer.kills.mob++;
        helper.checkExperience(selectedPlayer, discordHook);

        helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just killed \`${mob.name}\` with his/her \`${selectedPlayer.equipment.weapon.name}\` in \`${selectedPlayer.map.name}\` gaining ${mob.experience} exp and ${mob.gold} Gold!`);
        selectedPlayer = this.generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob);
        return resolve(selectedPlayer);
      }

      selectedPlayer.health -= mobChance;
      selectedPlayer.gold -= mob.gold;
      if (selectedPlayer.gold <= 0) {
        selectedPlayer.gold = 0;
      }
      helper.checkHealth(selectedPlayer, mob, discordHook);

      helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just lost a battle to \`${mob.name}\` in \`${selectedPlayer.map.name}\` losing ${Math.abs(mobChance)} health and ${mob.gold} Gold!`);
      return resolve(selectedPlayer);
    });
  }

  generateDropItemEvent(discordHook, twitchBot, selectedPlayer, mob) {
    return new Promise((resolve) => {
      const dropitemChance = helper.randomInt(0, 100);

      if (dropitemChance <= 15 + (selectedPlayer.stats.luk / 2)) {
        const item = Item.generateItem(selectedPlayer);
        switch (item.position) {
          case enumHelper.equipment.types.helmet.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
            break;
          case enumHelper.equipment.types.armor.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
              return resolve(selectedPlayer);
            }


            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
            break;
          case enumHelper.equipment.types.weapon.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
            break;
        }

        helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> dropped a \`${item.name}\` from \`${mob.name}!\``);
        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

  // Item Events
  generateTownItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const item = Item.generateItem(selectedPlayer);
      switch (item.position) {
        case enumHelper.equipment.types.helmet.position:
          if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
            return resolve(selectedPlayer);
          }

          if (selectedPlayer.gold >= item.gold) {
            selectedPlayer.gold -= item.gold;
            helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
            helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
            return resolve(selectedPlayer);
          }
          break;

        case enumHelper.equipment.types.armor.position:
          if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
            return resolve(selectedPlayer);
          }

          if (selectedPlayer.gold >= item.gold) {
            selectedPlayer.gold -= item.gold;
            helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
            helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
            return resolve(selectedPlayer);
          }
          break;

        case enumHelper.equipment.types.weapon.position:
          if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
            return resolve(selectedPlayer);
          }

          if (selectedPlayer.gold >= item.gold) {
            selectedPlayer.gold -= item.gold;
            helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
            helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just purchased \`${item.name}\` from Town for ${item.gold} Gold!`);
            return resolve(selectedPlayer);
          }
          break;
      }

      return resolve(selectedPlayer);
    });
  }

  generateItemEventMessage(selectedPlayer, item) {
    const randomEventMessage = helper.randomInt(0, 3);
    switch (randomEventMessage) {
      case 0:
        return `<@!${selectedPlayer.discordId}> found a chest containing \`${item.name}\` in \`${selectedPlayer.map.name}\`!`;
      case 1:
        return `<@!${selectedPlayer.discordId}> found \`${item.name}\` on the ground in \`${selectedPlayer.map.name}\`!`;
      case 2:
        return `<@!${selectedPlayer.discordId}> explored an abandoned hut in \`${selectedPlayer.map.name}\` which had \`${item.name}\` inside!`;
      case 3:
        return `<@!${selectedPlayer.discordId}> a bird just dropped \`${item.name}\` infront of him/her in \`${selectedPlayer.map.name}\`!`;
    }
  }

  stealPlayerItem(discordHook, twitchBot, selectedPlayer, randomPlayer) {
    return new Promise((resolve) => {
      const luckStealChance = helper.randomInt(0, 100);
      if (luckStealChance > 50) {
        const luckItem = helper.randomInt(0, 3);
        switch (luckItem) {
          case 0:
            if (helper.calculateItemRating(selectedPlayer.equipment.helmet) < helper.calculateItemRating(randomPlayer.equipment.helmet)) {
              selectedPlayer.equipment.helmet = randomPlayer.equipment.helmet;
              selectedPlayer.equipment.helmet.name = `${randomPlayer.name}s ${randomPlayer.equipment.helmet.name}`;
              if (!randomPlayer.equipment.helmet.previousOwners) {
                selectedPlayer.equipment.helmet.previousOwners = [`${randomPlayer.name}`];
              } else {
                selectedPlayer.equipment.helmet.previousOwners = randomPlayer.equipment.helmet.previousOwners;
                selectedPlayer.equipment.helmet.previousOwners.add(randomPlayer.name);
              }

              discordHook.send(helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.helmet.name}!`));
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.helmet.position, enumHelper.equipment.empty.equip);
            }
            break;
          case 1:
            if (helper.calculateItemRating(selectedPlayer.equipment.armor) < helper.calculateItemRating(randomPlayer.equipment.armor)) {
              selectedPlayer.equipment.armor = randomPlayer.equipment.armor;
              selectedPlayer.equipment.armor.name = `${randomPlayer.name}s ${randomPlayer.equipment.armor.name}`;
              if (!randomPlayer.equipment.armor.previousOwners) {
                selectedPlayer.equipment.armor.previousOwners = [`${randomPlayer.name}`];
              } else {
                selectedPlayer.equipment.armor.previousOwners = randomPlayer.equipment.armor.previousOwners;
                selectedPlayer.equipment.armor.previousOwners.add(randomPlayer.name);
              }

              discordHook.send(helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.armor.name}!`));
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.armor.position, enumHelper.equipment.empty.equip);
            }
            break;
          case 2:
            if (helper.calculateItemRating(selectedPlayer.equipment.weapon) < helper.calculateItemRating(randomPlayer.equipment.weapon)) {
              selectedPlayer.equipment.weapon = randomPlayer.equipment.weapon;
              selectedPlayer.equipment.weapon.name = `${randomPlayer.name}s ${randomPlayer.equipment.weapon.name}`;
              if (!randomPlayer.equipment.weapon.previousOwners) {
                selectedPlayer.equipment.weapon.previousOwners = [`${randomPlayer.name}`];
              } else {
                selectedPlayer.equipment.weapon.previousOwners = randomPlayer.equipment.weapon.previousOwners;
                selectedPlayer.equipment.weapon.previousOwners.add(randomPlayer.name);
              }

              discordHook.send(helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.weapon.name}!`));
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.weapon.position, enumHelper.equipment.empty.equip);
            }
            break;
          case 3:
            if (helper.calculateItemRating(selectedPlayer.equipment.relic) < helper.calculateItemRating(randomPlayer.equipment.relic)) {
              selectedPlayer.equipment.relic = randomPlayer.equipment.relic;
              selectedPlayer.equipment.relic.name = `${randomPlayer.name}s ${randomPlayer.equipment.relic.name}`;
              if (!randomPlayer.equipment.relic.previousOwners) {
                selectedPlayer.equipment.relic.previousOwners = [`${randomPlayer.name}`];
              } else {
                selectedPlayer.equipment.relic.previousOwners = randomPlayer.equipment.relic.previousOwners;
                selectedPlayer.equipment.relic.previousOwners.add(randomPlayer.name);
              }

              discordHook.send(helper.setImportantMessage(`${selectedPlayer.name} just stole ${randomPlayer.name}s ${randomPlayer.equipment.relic.name}!`));
              randomPlayer = helper.setPlayerEquipment(randomPlayer, enumHelper.equipment.types.relic.position, enumHelper.equipment.empty.equip);
            }
            break;
        }
      }

      return resolve({ selectedPlayer, randomPlayer });
    });
  }

  // Luck Events
  generateGodsEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckEvent = helper.randomInt(0, 3);
      switch (luckEvent) {
        case 0:
          const luckStat = helper.randomInt(0, 4);
          let luckStatAmount = helper.randomInt(2, 10);
          if (luckStatAmount === 0) {
            luckStatAmount = 1;
          }
          let stat;
          switch (luckStat) {
            case 0:
              stat = enumHelper.stats.str;
              selectedPlayer.stats.str += luckStatAmount;
              break;
            case 1:
              stat = enumHelper.stats.dex;
              selectedPlayer.stats.dex += luckStatAmount;
              break;
            case 2:
              stat = enumHelper.stats.end;
              selectedPlayer.stats.end += luckStatAmount;
              break;
            case 4:
              stat = enumHelper.stats.int;
              selectedPlayer.stats.int += luckStatAmount;
              break;
            default:
              stat = enumHelper.stats.str;
              selectedPlayer.stats.str += luckStatAmount;
              break;
          }

          helper.sendMessage(discordHook, twitchBot, false, `Apollo has blessed <@!${selectedPlayer.discordId}> with his music raising his/her \`${stat}\` by ${luckStatAmount}!`);
          return resolve(selectedPlayer);

        case 1:
          let luckExpAmount = helper.randomInt(5, 15);
          if (luckExpAmount === 0) {
            luckExpAmount = 1;
          }
          selectedPlayer.experience -= luckExpAmount;
          if (selectedPlayer.experience < 0) {
            selectedPlayer.experience = 0;
          }

          helper.sendMessage(discordHook, twitchBot, false, `Hades unleashed his wrath upon <@!${selectedPlayer.discordId}> making him/her lose ${luckExpAmount} experience!`);
          return resolve(selectedPlayer);

        case 3:
          let luckHealthAmount = helper.randomInt(5, 15);
          if (luckHealthAmount === 0) {
            luckHealthAmount = 1;
          }
          selectedPlayer.health -= luckHealthAmount;
          helper.checkHealth(selectedPlayer, discordHook);
          helper.sendMessage(discordHook, twitchBot, false, `<@!${selectedPlayer.discordId}> just lost ${luckHealthAmount} health by tripping and hitting his/her head!`);

          return resolve(selectedPlayer);
      }
    });
  }

  generateGoldEvent(discordHook, selectedPlayer) {
    return new Promise((resolve) => {
      const luckGoldChance = helper.randomInt(0, 100);
      if (luckGoldChance >= 50) {
        const luckGoldDice = helper.randomInt(0, 100);
        const goldAmount = Number(((luckGoldDice * selectedPlayer.stats.luk) / 2).toFixed());
        selectedPlayer.gold += goldAmount;
        helper.sendMessage(discordHook, 'twitch', false, `<@!${selectedPlayer.discordId}> found ${goldAmount} gold in \`${selectedPlayer.map.name}\`!`);

        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

  generateLuckItemEvent(discordHook, twitchBot, selectedPlayer) {
    return new Promise((resolve) => {
      const luckItemDice = helper.randomInt(0, 100);

      if (luckItemDice <= 15 + (selectedPlayer.stats.luk / 2)) {
        const item = Item.generateItem(selectedPlayer);
        switch (item.position) {
          case enumHelper.equipment.types.helmet.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.helmet) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.helmet.position, item);
            break;
          case enumHelper.equipment.types.armor.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.armor) > item.rating) {
              return resolve(selectedPlayer);
            }


            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.armor.position, item);
            break;
          case enumHelper.equipment.types.weapon.position:
            if (helper.calculateItemRating(selectedPlayer.equipment.weapon) > item.rating) {
              return resolve(selectedPlayer);
            }

            selectedPlayer = helper.setPlayerEquipment(selectedPlayer, enumHelper.equipment.types.weapon.position, item);
            break;
        }

        helper.sendMessage(discordHook, twitchBot, false, this.generateItemEventMessage(selectedPlayer, item));
        return resolve(selectedPlayer);
      }

      return resolve(selectedPlayer);
    });
  }

}
module.exports = new Event();