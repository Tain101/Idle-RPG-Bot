const Helper = require('../../utils/Helper');
const monsters = require('../data/monsters');

class Monster {

  generateMonster(selectedPlayer) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.round(Helper.randomBetween(0, 100));
      const randomTypeChance = Math.round(Helper.randomBetween(0, 100));
      const randomMonsterType = randomTypeChance + randomRarityChance > 100 ? 100 : randomTypeChance + randomRarityChance;
      const monsterRarityList = monsters.rarity.filter(mobRarity => mobRarity.rarity >= randomRarityChance);
      const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType
        && mobType.isSpawnable
        && mobType.spawnableMapType.includes(selectedPlayer.map.type.name));

      const randomRarityIndex = Helper.randomBetween(0, monsterRarityList.length - 1);
      const randomTypeIndex = Helper.randomBetween(0, monsterTypeList.length - 1);

      const monsterObj = {
        name: `${monsterRarityList[randomRarityIndex].name} ${monsterTypeList[randomTypeIndex].name}`,
        stats: {
          str: (monsterRarityList[randomRarityIndex].stats.str
            * monsterTypeList[randomTypeIndex].stats.str),
          dex: (monsterRarityList[randomRarityIndex].stats.dex
            * monsterTypeList[randomTypeIndex].stats.dex),
          end: (monsterRarityList[randomRarityIndex].stats.end
            * monsterTypeList[randomTypeIndex].stats.end)
        },
        isXmasEvent: monsterTypeList[randomTypeIndex].isXmasEvent,
        experience: Number((monsterRarityList[randomRarityIndex].experience
          * monsterTypeList[randomTypeIndex].experience) / 2).toFixed(),
        gold: Number((monsterRarityList[randomRarityIndex].gold
          * monsterTypeList[randomTypeIndex].gold)).toFixed()
      };
      return resolve(monsterObj);
    });
  }

  generateNewMonster(selectedPlayer) {
    return new Promise((resolve) => {
      const randomRarityChance = Math.round(Helper.randomBetween(0, 100));
      const randomTypeChance = Math.round(Helper.randomBetween(0, 100));
      const randomMonsterType = ((randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2)) > 100 ? 100 : (randomTypeChance + randomRarityChance) - (selectedPlayer.level / 2);
      console.log(`\n\n\nMOB RT: ${randomTypeChance} - MOB RC: ${randomRarityChance} - LEVEL: ${selectedPlayer.level} - MOB MT: ${randomMonsterType}`);
      const monsterRarityList = monsters.rarity.filter(mobRarity => mobRarity.rarity >= randomRarityChance);
      const monsterTypeList = monsters.type.filter(mobType => mobType.rarity >= randomMonsterType
        && mobType.isSpawnable
        && mobType.spawnableMapType.includes(selectedPlayer.map.type.name));

      const randomRarityIndex = Helper.randomBetween(0, monsterRarityList.length - 1);
      const randomTypeIndex = Helper.randomBetween(0, monsterTypeList.length - 1);
      const playerBalance = selectedPlayer.level <= 3 ? 0 : (selectedPlayer.equipment.weapon.power + selectedPlayer.equipment.armor.power + selectedPlayer.equipment.helmet.power) / 4;

      const monsterObj = {
        name: `${monsterRarityList[randomRarityIndex].name} ${monsterTypeList[randomTypeIndex].name}`,
        health: monsterRarityList[randomRarityIndex].health + monsterTypeList[randomTypeIndex].health,
        stats: {
          str: (monsterRarityList[randomRarityIndex].stats.str
            * monsterTypeList[randomTypeIndex].stats.str) + (selectedPlayer.stats.str / 2),
          dex: (monsterRarityList[randomRarityIndex].stats.dex
            * monsterTypeList[randomTypeIndex].stats.dex) + (selectedPlayer.stats.dex / 2),
          end: (monsterRarityList[randomRarityIndex].stats.end
            * monsterTypeList[randomTypeIndex].stats.end) + (selectedPlayer.stats.end / 2),
          int: (monsterRarityList[randomRarityIndex].stats.int
            * monsterTypeList[randomTypeIndex].stats.int) + (selectedPlayer.stats.int / 2),
          luk: (monsterRarityList[randomRarityIndex].stats.luk
            * monsterTypeList[randomTypeIndex].stats.luk)
        },
        power: monsterRarityList[randomRarityIndex].power + monsterTypeList[randomTypeIndex].power + playerBalance,
        equipment: monsterTypeList[randomTypeIndex].equipment,
        inventory: monsterTypeList[randomTypeIndex].inventory,
        spells: monsterTypeList[randomTypeIndex].spells,
        isXmasEvent: monsterTypeList[randomTypeIndex].isXmasEvent,
        experience: Math.round((monsterRarityList[randomRarityIndex].experience
          * monsterTypeList[randomTypeIndex].experience) / 2),
        gold: Math.round((monsterRarityList[randomRarityIndex].gold
          * monsterTypeList[randomTypeIndex].gold))
      };
      console.log(`MOB POW: ${monsterObj.power} - PLAYER POW: ${playerBalance}`);

      return resolve(monsterObj);
    });
  }

  // GETTER SETTERS
  get monsters() {
    return monsters.type;
  }

}
module.exports = Monster;
