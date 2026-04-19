import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import Phaser from "phaser";
import type { GameFrameHandle } from "./Game";
import MainScene from "../scenes/MainScene";
import type { Player, PlayerState } from "../types/Player";

const GameFrame = forwardRef<GameFrameHandle, {}>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<any>(null);

  const currentPlayerRef = useRef<Player | null>(null);
  const playersRef = useRef<Record<number, PlayerState>>({});
  const socketRef = useRef<WebSocket | null>(null);

  useImperativeHandle(ref, () => ({
    setGameState(gameState: any) {
      currentPlayerRef.current = gameState.currentPlayer;
      playersRef.current = gameState.players;
      socketRef.current = gameState.socket;
    },
    getGameState() {},
    startGame() {
      gameRef.current?.scene.start("MainScene", {
        currentPlayer: currentPlayerRef.current,
        players: playersRef.current,
        socket: socketRef.current,
      });
    },

    stopGame() {
      gameRef.current?.scene.stop("MainScene");
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const storedPlayer = sessionStorage.getItem("player");
    if (storedPlayer) currentPlayerRef.current = JSON.parse(storedPlayer);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 1080,
      height: 720,
      backgroundColor: "#000000",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: MainScene,
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    // @ts-ignore
    const game = new Phaser.Game(config);

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
});

export default GameFrame;
