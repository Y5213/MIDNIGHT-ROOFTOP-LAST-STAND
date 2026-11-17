import { CONFIG } from '../config';
import { ZombieManager } from './ZombieManager';
import { Barricade } from '../world/Barricade';
import { Player } from '../player/Player';
import { WeaponController } from '../player/WeaponController';

export class WaveDirector {
  public currentWave: number = 1;
  public waveBudgetRemaining: number = 0;
  public isIntermission: boolean = false;
  public intermissionTimer: number = 0;
  public isVictory: boolean = false;
  public onWaveStart?: (wave: number) => void;

  private spawnCooldown: number = 2.0;

  constructor(
    private readonly zombies: ZombieManager,
    private readonly gates: Barricade[],
    private readonly player: Player,
    private readonly weapon: WeaponController
  ) {
    // Wave initialized via main.ts on game start
  }

  public startWave(waveNum: number): void {
    this.currentWave = waveNum;
    this.isIntermission = false;
    this.isVictory = false;

    // Level budget: Level 1 has fewer zombies (4), increasing each level
    this.waveBudgetRemaining = waveNum === 1 ? 4 : 5 + 4 * waveNum;
    this.spawnCooldown = 1.8;

    // Speed scales progressively with level!
    const speedMult = waveNum === 1 ? 0.85 : 1.0 + (waveNum - 1) * 0.08;
    this.zombies.speedMultiplier = speedMult;

    this.onWaveStart?.(waveNum);
  }

  public skipIntermission(): void {
    if (this.isIntermission) {
      this.intermissionTimer = 0;
      this.startWave(this.currentWave + 1);
    }
  }

  public update(dt: number): void {
    if (this.isVictory) return;

    // 1. Intermission Countdown
    if (this.isIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        if (this.currentWave < CONFIG.TOTAL_WAVES) {
          this.startWave(this.currentWave + 1);
        } else {
          this.isVictory = true;
        }
      }
      return;
    }

    // 2. Wave In-Progress: Spawning Logic
    if (this.waveBudgetRemaining > 0) {
      this.spawnCooldown -= dt;
      if (this.spawnCooldown <= 0) {
        this.spawnBatch();
        this.spawnCooldown = 3.0 + Math.random() * 2.5;
      }
    } else {
      // Budget spent: check if all zombies are eliminated
      if (this.zombies.getAliveCount() === 0) {
        if (this.currentWave >= CONFIG.TOTAL_WAVES) {
          this.isVictory = true;
        } else {
          this.enterIntermission();
        }
      }
    }
  }

  private spawnBatch(): void {
    const batchSize = Math.min(3, Math.ceil(this.waveBudgetRemaining));

    for (let i = 0; i < batchSize; i++) {
      if (this.waveBudgetRemaining <= 0) break;

      // Pick type based on wave & budget
      let type: 'walker' | 'runner' | 'brute' = 'walker';
      if (this.currentWave >= 5 && (this.currentWave === 5 || this.currentWave === 8 || this.currentWave === 10) && this.waveBudgetRemaining >= 8) {
        type = 'brute';
      } else if (this.currentWave >= 3 && this.waveBudgetRemaining >= 2 && Math.random() < 0.45) {
        type = 'runner';
      }

      const cost = CONFIG.ZOMBIE_TYPES[type].cost;
      if (this.waveBudgetRemaining < cost) {
        type = 'walker';
      }

      // Pick random gate
      const gate = this.gates[Math.floor(Math.random() * this.gates.length)];
      if (this.zombies.spawn(type, gate)) {
        this.waveBudgetRemaining -= CONFIG.ZOMBIE_TYPES[type].cost;
      }
    }
  }

  private enterIntermission(): void {
    this.isIntermission = true;
    this.intermissionTimer = CONFIG.INTERMISSION_TIME;

    // Resupply rewards
    this.weapon.spareCells += CONFIG.INTERMISSION_REWARD_CELLS;
    if (this.currentWave % 3 === 0) {
      this.player.heal(CONFIG.MEDKIT_HEAL);
    }
  }
}
