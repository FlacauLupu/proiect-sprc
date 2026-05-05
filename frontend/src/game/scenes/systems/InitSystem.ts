import type { Player, PlayerState } from "../../../types/Player";
import { Role } from "../../../types/Player";

export class InitSystem {
  scene!: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadGameState(): {
    currentPlayer: Player;
    players: Player[];
  } | null {
    const currentPlayerRaw = sessionStorage.getItem("player");
    const playersRaw = sessionStorage.getItem("players");

    if (!currentPlayerRaw || !playersRaw) {
      console.log("Game stats are not defined");
      return null;
    }

    try {
      const parsedCurrentPlayer = JSON.parse(currentPlayerRaw);
      const parsedPlayers = JSON.parse(playersRaw);
      return {
        currentPlayer: parsedCurrentPlayer,
        players: parsedPlayers,
      };
    } catch (err) {
      console.error("Invalid game state in storage");
      return null;
    }
  }

  initializePlayers(players: Player[]): Record<number, PlayerState> {
    const playersStates: Record<number, PlayerState> = {};

    players.forEach((p: Player) => {
      playersStates[p.id] = {
        player: p,
        role: Role.NONE,
        sprite: null as any,
      };
    });

    return playersStates;
  }

  setupRound(
    playersStates: Record<number, PlayerState>,
    birds: Record<number, PlayerState>,
    currentRound: number,
  ): PlayerState {
    const hunterId = Object.keys(playersStates)[currentRound - 1];

    const hunter: PlayerState = {
      player: playersStates[Number(hunterId)].player,
      role: Role.HUNTER,
      sprite: null as any,
    };

    Object.entries(playersStates).forEach(([id, playerState]) => {
      if (id !== hunterId) {
        birds[Number(id)] = {
          player: playerState.player,
          role: Role.BIRD,
          sprite: null as any,
        };
      }
    });

    return hunter;
  }

  setupWorldBounds() {
    const { width, height } = this.scene.scale;
    this.scene.physics.world.setBounds(0, 0, width, height);
  }
}
