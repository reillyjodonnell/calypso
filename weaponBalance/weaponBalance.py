import random
import json


def read_weapon_data(filename):
    with open(filename, "r") as json_file:
        weapon_data = json.load(json_file)
    return weapon_data


weapon_data = read_weapon_data("weapons.json")


def roll_dice(roll):
    parts = roll.split("d")
    dice_count = int(parts[0]) if parts[0] else 1
    dice_type = int(parts[1])
    return sum(random.randint(1, dice_type) for _ in range(dice_count))


def roll_damage(damage_roll):
    if "+" in damage_roll:
        parts = damage_roll.split("+")
        dice_roll = parts[0]
        fixed_bonus = int(parts[1])
        return roll_dice(dice_roll) + fixed_bonus
    else:
        return roll_dice(damage_roll)


def simulate_weapon(weapon_data, rolls=100000):
    total_damage = 0
    hits = 0
    crit_hits = 0
    crit_fails = 0
    for _ in range(rolls):
        hit_roll = roll_dice("1d20") + weapon_data.get("hitBonus", 0)

        if hit_roll in weapon_data["critFail"]:
            crit_fails += 1
            continue
        elif hit_roll in weapon_data["critHit"]:
            crit_hits += 1
            total_damage += 2 * roll_damage(weapon_data["damage"])
        elif hit_roll >= 11:
            hits += 1
            total_damage += roll_damage(weapon_data["damage"])

    return {
        "weapon": weapon_data["name"],
        "average_damage": total_damage / rolls,
        "hit_rate": hits / rolls,
        "crit_hit_rate": crit_hits / rolls,
        "crit_fail_rate": crit_fails / rolls,
    }


for weapon_stats in weapon_data:
    result = simulate_weapon(weapon_stats)
    print(result)
