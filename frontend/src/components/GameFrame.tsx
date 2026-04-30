import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import Phaser from "phaser";
import type { GameFrameHandle } from "./Game";
import MainScene from "../scenes/MainScene.ts";

const GameFrame = forwardRef<GameFrameHandle, {}>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useImperativeHandle(ref, () => ({
    startGame(gameState: any) {
      if (!gameRef.current) return;

      // IMPORTANT: pass data directly here
      gameRef.current.scene.start("MainScene", gameState);
    },

    stopGame() {
      gameRef.current?.scene.stop("MainScene");
    },

    getGameState() {
      return null;
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    if (gameRef.current) return;

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
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
});

export default GameFrame;
