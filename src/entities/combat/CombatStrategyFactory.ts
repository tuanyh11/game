import { ICombatStrategy } from "./CombatTypes";
import { UnitType } from "../../config/GameConfig";
import { ArcherStrategy } from "./strategies/ArcherStrategy";
import { SwordsmanStrategy } from "./strategies/SwordsmanStrategy";
import { SpearmanStrategy } from "./strategies/SpearmanStrategy";
import { KnightStrategy } from "./strategies/KnightStrategy";
import { ScoutStrategy } from "./strategies/ScoutStrategy";

import { ImmortalStrategy } from "./strategies/ImmortalStrategy";
import { ChuKoNuStrategy } from "./strategies/ChuKoNuStrategy";
import { NinjaStrategy } from "./strategies/NinjaStrategy";
import { CenturionStrategy } from "./strategies/CenturionStrategy";
import { UlfhednarStrategy } from "./strategies/UlfhednarStrategy";

import { SpartacusStrategy } from "./strategies/heroes/SpartacusStrategy";
import { ZarathustraStrategy } from "./strategies/heroes/ZarathustraStrategy";
import { MusashiStrategy } from "./strategies/heroes/MusashiStrategy";
import { QiJiguangStrategy } from "./strategies/heroes/QiJiguangStrategy";
import { RagnarStrategy } from "./strategies/heroes/RagnarStrategy";

export class CombatStrategyFactory {
    // Singleton instances of strategies to save memory, as they are completely stateless
    private static archer = new ArcherStrategy();
    private static swordsman = new SwordsmanStrategy();
    private static spearman = new SpearmanStrategy();
    private static knight = new KnightStrategy();
    private static scout = new ScoutStrategy();

    // Elite
    private static immortal = new ImmortalStrategy();
    private static chukonu = new ChuKoNuStrategy();
    private static ninja = new NinjaStrategy();
    private static centurion = new CenturionStrategy();
    private static ulfhednar = new UlfhednarStrategy();

    // Heroes
    private static spartacus = new SpartacusStrategy();
    private static zarathustra = new ZarathustraStrategy();
    private static musashi = new MusashiStrategy();
    private static qijiguang = new QiJiguangStrategy();
    private static ragnar = new RagnarStrategy();

    // We will supply a fallback generic strategy for unimplemented ones initially
    private static fallback = new SwordsmanStrategy(); // Temporary fallback until all are implemented

    public static getStrategy(unitType: UnitType): ICombatStrategy {
        switch (unitType) {
            case UnitType.Archer: return this.archer;
            case UnitType.Swordsman: return this.swordsman;
            case UnitType.Spearman: return this.spearman;
            case UnitType.Knight: return this.knight;
            case UnitType.Scout: return this.scout;

            // Elite Units
            case UnitType.Immortal: return this.immortal;
            case UnitType.ChuKoNu: return this.chukonu;
            case UnitType.Ninja: return this.ninja;
            case UnitType.Centurion: return this.centurion;
            case UnitType.Ulfhednar: return this.ulfhednar;

            // Heroes
            case UnitType.HeroSpartacus: return this.spartacus;
            case UnitType.HeroZarathustra: return this.zarathustra;
            case UnitType.HeroMusashi: return this.musashi;
            case UnitType.HeroQiJiguang: return this.qijiguang;
            case UnitType.HeroRagnar: return this.ragnar;

            default:
                return this.fallback;
        }
    }
}
