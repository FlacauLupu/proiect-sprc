import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import Phaser from "phaser";
import type { Player } from "../types/Player";

type GameFrameHandle = {
    moveSelectedObstacle: (deltaY: number) => void;
    clearSelection: () => void;
};

interface GameFrameProps {
    player: Player;
    enemies: Array<Player>;
}

const GameFrame = forwardRef<GameFrameHandle, GameFrameProps>((_props, ref) => {
    const { player, enemies } = _props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        moveSelectedObstacle(deltaY: number) {
            if (sceneRef.current && sceneRef.current.moveSelected)
                sceneRef.current.moveSelected(deltaY);
        },
        clearSelection() {
            if (sceneRef.current && sceneRef.current.clearSelection)
                sceneRef.current.clearSelection();
        },
    }));

    useEffect(() => {
        if (!containerRef.current) return;

        class MainScene extends Phaser.Scene {
            birds!: Array<Phaser.Physics.Arcade.Sprite>;
            // bird!: Phaser.Physics.Arcade.Sprite;
            pipes!: Phaser.GameObjects.Group;
            score = 0;
            scoreText!: Phaser.GameObjects.Text;
            pipeTimer?: Phaser.Time.TimerEvent;
            selectedPipe: Phaser.GameObjects.Rectangle | null = null;

            constructor() {
                super({ key: "MainScene" });
            }

            preload() {
                const g = this.add.graphics();
                g.fillStyle(0xffd13a, 1);
                g.fillCircle(16, 16, 16);
                g.generateTexture("bird", 32, 32);
                g.clear();
                g.fillStyle(0x00aa00, 1);
                g.fillRect(0, 0, 64, 64);
                g.generateTexture("pipe", 64, 64);
                g.destroy();
            }

            createBird(player: Player) {
                player.bird = this.physics.add.sprite(
                    220,
                    this.scale.height / 2,
                    "bird",
                );
                player.bird.setCollideWorldBounds(true);
                (player.bird.body as Phaser.Physics.Arcade.Body).setGravityY(
                    800,
                );
                player.bird.setCircle(12);
            }

            create() {
                const { width, height } = this.scale;
                this.physics.world.setBounds(0, 0, width, height);

                // expose scene instance to outer scope so parent can call methods
                // sceneRef is defined in the outer closure
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                sceneRef.current = this;

                enemies.forEach((pl) => this.createBird(pl));

                this.input.on("pointerdown", this.flap, this);
                this.input.keyboard?.on("keydown-SPACE", this.flap, this);

                this.pipes = this.add.group();

                this.scoreText = this.add.text(20, 20, "Score: 0", {
                    fontSize: "32px",
                    color: "#fff",
                });

                this.pipeTimer = this.time.addEvent({
                    delay: 1400,
                    callback: this.spawnPipes,
                    callbackScope: this,
                    loop: true,
                });

                this.physics.add.overlap(
                    this.bird,
                    this.pipes,
                    this.hitPipe,
                    undefined,
                    this,
                );
            }

            flap() {
                if (!this.bird.active) return;
                this.bird.setVelocityY(-350);
                this.tweens.add({
                    targets: this.bird,
                    angle: -20,
                    duration: 100,
                });
            }

            spawnPipes() {
                const { width, height } = this.scale;
                const gap = Phaser.Math.Between(140, 220);
                const centerY = Phaser.Math.Between(150, height - 150);
                const pipeWidth = 96;
                const pipeX = width + pipeWidth;

                const topHeight = centerY - gap / 2;
                const bottomHeight = height - (centerY + gap / 2);

                const top = this.add
                    .rectangle(pipeX, 0, pipeWidth, topHeight, 0x00aa00)
                    .setOrigin(0, 0);
                // @ts-ignore
                this.physics.add.existing(top);
                const topBody = top.body as Phaser.Physics.Arcade.Body;
                topBody.setVelocityX(-200);
                topBody.setImmovable(true);
                topBody.allowGravity = false;
                top.setData("scored", false);

                top.setInteractive();
                top.on(
                    "pointerdown",
                    (
                        pointer: any,
                        localX: number,
                        localY: number,
                        event: any,
                    ) => {
                        if (event && event.stopPropagation)
                            event.stopPropagation();
                        this.selectPipe(top);
                    },
                    this,
                );

                const bottom = this.add
                    .rectangle(
                        pipeX,
                        centerY + gap / 2,
                        pipeWidth,
                        bottomHeight,
                        0x00aa00,
                    )
                    .setOrigin(0, 0);
                // @ts-ignore
                this.physics.add.existing(bottom);
                const bottomBody = bottom.body as Phaser.Physics.Arcade.Body;
                bottomBody.setVelocityX(-200);
                bottomBody.setImmovable(true);
                bottomBody.allowGravity = false;
                bottom.setData("scored", false);

                bottom.setInteractive();
                bottom.on(
                    "pointerdown",
                    (
                        pointer: any,
                        localX: number,
                        localY: number,
                        event: any,
                    ) => {
                        if (event && event.stopPropagation)
                            event.stopPropagation();
                        this.selectPipe(bottom);
                    },
                    this,
                );

                this.pipes.add(top);
                this.pipes.add(bottom);
            }

            selectPipe(pipe: any) {
                if (this.selectedPipe) {
                    this.selectedPipe.setStrokeStyle(0);
                }
                this.selectedPipe = pipe;
                pipe.setStrokeStyle(4, 0xffff00);
            }

            moveSelected(deltaY: number) {
                if (!this.selectedPipe) return;
                this.selectedPipe.y += deltaY;
                // @ts-ignore
                if (this.selectedPipe.body) {
                    const b = this.selectedPipe
                        .body as Phaser.Physics.Arcade.Body;
                    b.y = this.selectedPipe.y;
                    // keep velocity
                    b.setSize(
                        (this.selectedPipe as any).width,
                        (this.selectedPipe as any).height,
                    );
                    b.setVelocityX(-200);
                    // @ts-ignore
                    b.updateFromGameObject();
                }
            }

            clearSelection() {
                if (this.selectedPipe) {
                    this.selectedPipe.setStrokeStyle(0);
                    this.selectedPipe = null;
                }
            }

            hitPipe() {
                if (!this.bird.active) return;
                this.gameOver();
            }

            update() {
                if (!this.bird.active) return;

                this.bird.angle = Phaser.Math.Clamp(
                    (this.bird.body as Phaser.Physics.Arcade.Body).velocity.y /
                        6,
                    -20,
                    90,
                );

                this.pipes.getChildren().forEach((pipe: any) => {
                    if (pipe.getData("scored")) return;
                    if (pipe.x + pipe.width < this.bird.x) {
                        if (pipe.y > this.bird.y) {
                            this.score += 1;
                            this.scoreText.setText(`Score: ${this.score}`);
                            this.pipes.getChildren().forEach((p: any) => {
                                if (Math.abs(p.x - pipe.x) < 10)
                                    p.setData("scored", true);
                            });
                        }
                    }
                });

                this.pipes.getChildren().forEach((pipe: any) => {
                    if (pipe.x < -100) {
                        if (pipe.body)
                            (pipe.body as Phaser.Physics.Arcade.Body).destroy();
                        pipe.destroy();
                    }
                });

                if (this.bird.y > this.scale.height || this.bird.y < 0) {
                    this.gameOver();
                }
            }

            gameOver() {
                this.bird.setActive(false);
                this.bird.setTint(0xff0000);
                this.physics.pause();
                this.pipeTimer?.remove(false);
                this.add
                    .text(
                        this.scale.width / 2,
                        this.scale.height / 2,
                        "Game Over\nClick to Restart",
                        {
                            fontSize: "48px",
                            color: "#fff",
                            align: "center",
                        },
                    )
                    .setOrigin(0.5);
                this.input.once("pointerdown", () => this.scene.restart());
                this.input.keyboard?.once("keydown-SPACE", () =>
                    this.scene.restart(),
                );
            }
        }

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
