// ============================================================
//  NetworkCommands — Game command definitions for multiplayer
//  These represent player actions that get sent over the network
// ============================================================

import { CommandType } from '../../server/types';
export { CommandType } from '../../server/types';
import type { GameCommand } from '../../server/types';
export type { GameCommand } from '../../server/types';

// ---- Command Factories ----

export function cmdMove(team: number, unitIds: number[], x: number, y: number): GameCommand {
    return {
        type: CommandType.MOVE,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds, x, y },
    };
}

export function cmdAttackUnit(team: number, unitIds: number[], targetId: number): GameCommand {
    return {
        type: CommandType.ATTACK_UNIT,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds, targetId },
    };
}

export function cmdAttackBuilding(team: number, unitIds: number[], buildingId: number): GameCommand {
    return {
        type: CommandType.ATTACK_BUILDING,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds, buildingId },
    };
}

export function cmdGather(team: number, unitIds: number[], resourceX: number, resourceY: number): GameCommand {
    return {
        type: CommandType.GATHER,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds, resourceX, resourceY },
    };
}

export function cmdBuildPlace(
    team: number, buildingType: number, tileX: number, tileY: number, builderIds: number[] = []
): GameCommand {
    return {
        type: CommandType.BUILD_PLACE,
        playerId: '',
        team,
        tick: 0,
        data: { buildingType, tileX, tileY, builderIds },
    };
}

export function cmdBuildAt(team: number, unitIds: number[], buildingId: number): GameCommand {
    return {
        type: CommandType.BUILD_AT,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds, buildingId },
    };
}

export function cmdTrain(team: number, buildingId: number, unitType: number): GameCommand {
    return {
        type: CommandType.TRAIN,
        playerId: '',
        team,
        tick: 0,
        data: { buildingId, unitType },
    };
}

export function cmdCancelTrain(team: number, buildingId: number, queueIndex: number): GameCommand {
    return {
        type: CommandType.CANCEL_TRAIN,
        playerId: '',
        team,
        tick: 0,
        data: { buildingId, queueIndex },
    };
}

export function cmdResearch(team: number, upgradeType: string): GameCommand {
    return {
        type: CommandType.RESEARCH,
        playerId: '',
        team,
        tick: 0,
        data: { upgradeType },
    };
}

export function cmdAgeUp(team: number): GameCommand {
    return {
        type: CommandType.AGE_UP,
        playerId: '',
        team,
        tick: 0,
        data: {},
    };
}

export function cmdSetRally(team: number, buildingId: number, x: number, y: number): GameCommand {
    return {
        type: CommandType.SET_RALLY,
        playerId: '',
        team,
        tick: 0,
        data: { buildingId, x, y },
    };
}

export function cmdDeleteUnit(team: number, unitIds: number[]): GameCommand {
    return {
        type: CommandType.DELETE_UNIT,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds },
    };
}

export function cmdDeleteBuilding(team: number, buildingId: number): GameCommand {
    return {
        type: CommandType.DELETE_BUILDING,
        playerId: '',
        team,
        tick: 0,
        data: { buildingId },
    };
}

export function cmdStop(team: number, unitIds: number[]): GameCommand {
    return {
        type: CommandType.STOP,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds },
    };
}

export function cmdCheat(team: number, cheatType: string, args?: Record<string, any>): GameCommand {
    return {
        type: CommandType.CHEAT,
        playerId: '',
        team,
        tick: 0,
        data: { cheatType, ...args },
    };
}

export function cmdReturnResources(team: number, unitIds: number[], buildingId: number): GameCommand {
    return {
        type: CommandType.RETURN_RESOURCES,
        playerId: '',
        team,
        tick: 0,
        data: { unitIds, buildingId },
    };
}
