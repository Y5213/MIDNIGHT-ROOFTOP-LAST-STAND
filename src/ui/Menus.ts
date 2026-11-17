import { AtmosphereType } from '../config';

export class MenuSystem {
  private container: HTMLElement;
  public onStartGame: () => void = () => {};
  public onResumeGame: () => void = () => {};
  public onRestartGame: () => void = () => {};

  // Settings callbacks
  public onMasterVolumeChange: (val: number) => void = () => {};
  public onSfxVolumeChange: (val: number) => void = () => {};
  public onAmbienceVolumeChange: (val: number) => void = () => {};
  public onSensitivityChange: (val: number) => void = () => {};
  public onAtmosphereChange: (type: AtmosphereType) => void = () => {};

  // Settings state cache
  public masterVol: number = 85;
  public sfxVol: number = 90;
  public ambienceVol: number = 50;
  public sensitivityVal: number = 100;
  public currentAtmosphere: AtmosphereType = 'midnight';
  private previousMenu: 'TITLE' | 'PAUSE' = 'TITLE';
  private activeStartClickListener: ((e: MouseEvent) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'menus-layer';
    document.body.appendChild(this.container);
    this.showHorrorDisclaimer();
  }

  private cleanClickListener(): void {
    if (this.activeStartClickListener) {
      window.removeEventListener('click', this.activeStartClickListener);
      this.activeStartClickListener = null;
    }
  }

  public showHorrorDisclaimer(): void {
    this.cleanClickListener();
    this.previousMenu = 'TITLE';
    this.container.innerHTML = `
      <div class="horror-disclaimer-screen" id="horror-screen">
        <div class="disclaimer-card">
          <div class="disclaimer-header">
            <div class="disclaimer-badge">
              <span style="font-size: 16px;">⚠</span> CRITICAL SURVIVAL ADVISORY
            </div>
            <button id="btn-disclaimer-settings" class="no-start-trigger" style="background: transparent; border: 1px solid var(--text-dim); color: var(--text-dim); font-family: var(--font-mono); font-size: 11px; padding: 5px 12px; cursor: pointer; border-radius: 2px; letter-spacing: 1px;">
              SETTINGS
            </button>
          </div>

          <div class="disclaimer-title">SENSORY COLLAPSE WARNING</div>

          <div class="disclaimer-content">
            This psychological survival simulation depicts severe darkness, visceral horror, and acute sensory disorientation.
            
            <div class="disclaimer-alert-box">
              <div class="disclaimer-alert-text">
                ► ZOMBIES CAN BECOME INVISIBLE SOMETIMES WHEN YOU ARE DIZZY.
              </div>
              <div class="disclaimer-advice">
                Heavy trauma, concussive zombie strikes, and severe blood loss fracture your optic nerve. Under dizziness, the undead can fade into total invisibility in the pitch darkness.
              </div>
            </div>

            <div style="line-height: 1.7;">
              <b>TACTICAL DIRECTIVE:</b> Do not trust your eyes alone. Listen carefully for ragged breathing and water splashes in the rain, track floor ripples, and fire into the shadows.
            </div>
          </div>

          <div class="disclaimer-cta">
            <div class="cta-pulse-text">CLICK ANYWHERE TO START GAME</div>
          </div>

          <div class="disclaimer-controls-bar">
            <span><b>WASD</b> MOVE</span> &bull;
            <span><b>SPACE</b> JUMP / CLIMB</span> &bull;
            <span><b>RMB (HOLD)</b> AIM DOWN SIGHTS</span> &bull;
            <span><b>LMB</b> FIRE / THROW</span> &bull;
            <span><b>1 / 2 / 3</b> WEAPONS</span> &bull;
            <span><b>HOLD E</b> REPAIR</span> &bull;
            <span><b>F</b> FLASHLIGHT</span> &bull;
            <span><b>ESC</b> PAUSE</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-disclaimer-settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cleanClickListener();
      this.showSettingsScreen();
    });

    const onGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.no-start-trigger')) {
        return;
      }
      this.cleanClickListener();
      this.hide();
      this.onStartGame();
    };

    setTimeout(() => {
      this.activeStartClickListener = onGlobalClick;
      window.addEventListener('click', onGlobalClick);
    }, 60);
  }

  public showTitleScreen(): void {
    this.previousMenu = 'TITLE';
    this.container.innerHTML = `
      <div class="overlay-screen">
        <h1 class="game-title">MIDNIGHT ROOFTOP</h1>
        <div class="subtitle">LAST STAND // SURVIVE UNTIL DAWN</div>
        
        <div style="display: flex; gap: 14px; margin-top: 10px;">
          <button id="btn-start" class="btn-primary">ENTER ROOFTOP</button>
          <button id="btn-settings-title" class="btn-primary" style="font-size: 13px; padding: 8px 20px; border-color: var(--text-dim); color: var(--text-dim);">SETTINGS</button>
        </div>

        <div style="max-width: 620px; text-align: center; color: var(--text-dim); font-family: var(--font-mono); font-size: 11px; line-height: 1.8; margin-top: 16px;">
          <div><b>WASD</b> MOVE &nbsp;|&nbsp; <b>SPACE</b> JUMP / CLIMB &nbsp;|&nbsp; <b>SHIFT</b> SPRINT &nbsp;|&nbsp; <b>RMB (HOLD)</b> AIM DOWN SIGHTS</div>
          <div><b>LMB</b> FIRE / THROW &nbsp;|&nbsp; <b>1 / 2 / 3 or WHEEL</b> WEAPON SLOTS &nbsp;|&nbsp; <b>T / I</b> INSPECT WEAPON</div>
          <div><b>O</b> CYCLE ATMOSPHERE &nbsp;|&nbsp; <b>HOLD E</b> REPAIR BARRICADE &nbsp;|&nbsp; <b>F</b> FLASHLIGHT &nbsp;|&nbsp; <b>ESC</b> PAUSE</div>
        </div>
      </div>
    `;

    document.getElementById('btn-start')?.addEventListener('click', () => {
      this.hide();
      this.onStartGame();
    });

    document.getElementById('btn-settings-title')?.addEventListener('click', () => {
      this.showSettingsScreen();
    });
  }

  public showPauseMenu(): void {
    this.previousMenu = 'PAUSE';
    this.container.innerHTML = `
      <div class="overlay-screen">
        <h1 class="game-title" style="font-size: 38px;">MISSION PAUSED</h1>
        <div class="subtitle">CLICK TO RESUME CONTROL OR ADJUST AUDIO & SENSITIVITY</div>
        
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button id="btn-resume" class="btn-primary">RESUME</button>
          <button id="btn-settings-pause" class="btn-primary" style="font-size: 13px; padding: 8px 22px; border-color: var(--cyan-laser); color: var(--cyan-laser);">AUDIO & CONTROLS</button>
          <button id="btn-restart" class="btn-primary" style="font-size: 13px; padding: 8px 22px; border-color: var(--text-dim); color: var(--text-dim);">RESTART OPERATION</button>
        </div>
      </div>
    `;

    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.hide();
      this.onResumeGame();
    });

    document.getElementById('btn-settings-pause')?.addEventListener('click', () => {
      this.showSettingsScreen();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.hide();
      this.onRestartGame();
    });
  }

  public showSettingsScreen(): void {
    this.container.innerHTML = `
      <div class="overlay-screen">
        <h1 class="game-title" style="font-size: 32px;">SETTINGS & CONTROLS</h1>
        <div class="subtitle">AUDIO LEVELS & SENSITIVITY CALIBRATION</div>

        <div class="settings-panel">
          <!-- Master Volume -->
          <div class="settings-row">
            <span>MASTER VOLUME</span>
            <div class="settings-slider-wrapper">
              <input type="range" id="slider-master" class="settings-slider" min="0" max="100" value="${this.masterVol}">
              <span id="val-master" class="settings-val">${this.masterVol}%</span>
            </div>
          </div>

          <!-- SFX Volume -->
          <div class="settings-row">
            <span>SFX & WEAPONS</span>
            <div class="settings-slider-wrapper">
              <input type="range" id="slider-sfx" class="settings-slider" min="0" max="100" value="${this.sfxVol}">
              <span id="val-sfx" class="settings-val">${this.sfxVol}%</span>
            </div>
          </div>

          <!-- Ambience / Storm Volume -->
          <div class="settings-row">
            <span>AMBIENCE & RAIN</span>
            <div class="settings-slider-wrapper">
              <input type="range" id="slider-ambience" class="settings-slider" min="0" max="100" value="${this.ambienceVol}">
              <span id="val-ambience" class="settings-val">${this.ambienceVol}%</span>
            </div>
          </div>

          <!-- Mouse Sensitivity -->
          <div class="settings-row">
            <span>MOUSE SENSITIVITY</span>
            <div class="settings-slider-wrapper">
              <input type="range" id="slider-sens" class="settings-slider" min="20" max="300" value="${this.sensitivityVal}">
              <span id="val-sens" class="settings-val">${(this.sensitivityVal / 100).toFixed(1)}x</span>
            </div>
          </div>

          <!-- Atmosphere Selector -->
          <div class="settings-row" style="margin-top: 6px; padding-top: 8px; border-top: 1px solid rgba(0, 229, 255, 0.15);">
            <span>SKY & ATMOSPHERE</span>
            <div class="atmo-btn-group">
              <button id="btn-atmo-midnight" class="atmo-pill ${this.currentAtmosphere === 'midnight' ? 'active' : ''}">MIDNIGHT</button>
              <button id="btn-atmo-sunset" class="atmo-pill ${this.currentAtmosphere === 'sunset' ? 'active' : ''}">SUNSET</button>
              <button id="btn-atmo-sunrise" class="atmo-pill ${this.currentAtmosphere === 'sunrise' ? 'active' : ''}">SUNRISE</button>
            </div>
          </div>
        </div>

        <button id="btn-back-settings" class="btn-primary" style="margin-top: 18px; font-size: 13px; padding: 8px 28px;">APPLY & RETURN</button>
      </div>
    `;

    // Master Volume Listener
    const sliderMaster = document.getElementById('slider-master') as HTMLInputElement;
    const valMaster = document.getElementById('val-master');
    sliderMaster?.addEventListener('input', () => {
      this.masterVol = parseInt(sliderMaster.value, 10);
      if (valMaster) valMaster.innerText = `${this.masterVol}%`;
      this.onMasterVolumeChange(this.masterVol / 100);
    });

    // SFX Volume Listener
    const sliderSfx = document.getElementById('slider-sfx') as HTMLInputElement;
    const valSfx = document.getElementById('val-sfx');
    sliderSfx?.addEventListener('input', () => {
      this.sfxVol = parseInt(sliderSfx.value, 10);
      if (valSfx) valSfx.innerText = `${this.sfxVol}%`;
      this.onSfxVolumeChange(this.sfxVol / 100);
    });

    // Ambience Volume Listener
    const sliderAmbience = document.getElementById('slider-ambience') as HTMLInputElement;
    const valAmbience = document.getElementById('val-ambience');
    sliderAmbience?.addEventListener('input', () => {
      this.ambienceVol = parseInt(sliderAmbience.value, 10);
      if (valAmbience) valAmbience.innerText = `${this.ambienceVol}%`;
      this.onAmbienceVolumeChange(this.ambienceVol / 100);
    });

    // Sensitivity Listener
    const sliderSens = document.getElementById('slider-sens') as HTMLInputElement;
    const valSens = document.getElementById('val-sens');
    sliderSens?.addEventListener('input', () => {
      this.sensitivityVal = parseInt(sliderSens.value, 10);
      if (valSens) valSens.innerText = `${(this.sensitivityVal / 100).toFixed(1)}x`;
      this.onSensitivityChange(this.sensitivityVal / 100);
    });

    // Atmosphere Selection Listeners
    const setupAtmoBtn = (id: string, type: AtmosphereType) => {
      document.getElementById(id)?.addEventListener('click', () => {
        this.currentAtmosphere = type;
        document.querySelectorAll('.atmo-pill').forEach((el) => el.classList.remove('active'));
        document.getElementById(id)?.classList.add('active');
        this.onAtmosphereChange(type);
      });
    };

    setupAtmoBtn('btn-atmo-midnight', 'midnight');
    setupAtmoBtn('btn-atmo-sunset', 'sunset');
    setupAtmoBtn('btn-atmo-sunrise', 'sunrise');

    // Return to previous menu
    document.getElementById('btn-back-settings')?.addEventListener('click', () => {
      if (this.previousMenu === 'PAUSE') {
        this.showPauseMenu();
      } else {
        this.showHorrorDisclaimer();
      }
    });
  }

  public showGameOver(stats: { wave: number; kills: number; reason?: 'VOID' | 'OVERRUN' }): void {
    const isVoid = stats.reason === 'VOID';
    this.container.innerHTML = `
      <div class="overlay-screen">
        <h1 class="game-title" style="color: var(--danger-red); text-shadow: 0 0 16px var(--danger-red);">
          ${isVoid ? 'FELL INTO THE VOID' : 'OVERRUN'}
        </h1>
        <div class="subtitle">
          ${isVoid ? 'YOU LEAPED FROM THE TERRACE AND PERISHED IN THE FALLEN CITY' : `THE ROOFTOP WAS LOST AT LEVEL ${stats.wave}`}
        </div>
        <div style="font-family: var(--font-mono); color: var(--text-main); margin: 8px 0;">CONFIRMED KILLS: <b>${stats.kills}</b></div>
        <button id="btn-retry" class="btn-primary" style="border-color: var(--danger-red); color: var(--danger-red);">TRY AGAIN</button>
      </div>
    `;

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      this.hide();
      this.onRestartGame();
    });
  }

  public showVictory(stats: { kills: number; accuracy: number }): void {
    this.container.innerHTML = `
      <div class="overlay-screen">
        <h1 class="game-title" style="color: #ffd700; text-shadow: 0 0 20px #ffd700;">DAWN HAS BROKEN</h1>
        <div class="subtitle">RESCUE CHOPPER EXTRACTED YOU SAFELY</div>
        <div style="font-family: var(--font-mono); color: var(--text-main); margin: 8px 0;">
          TOTAL KILLS: <b>${stats.kills}</b> | ACCURACY: <b>${Math.round(stats.accuracy)}%</b>
        </div>
        <button id="btn-again" class="btn-primary" style="border-color: #ffd700; color: #ffd700;">PLAY AGAIN</button>
      </div>
    `;

    document.getElementById('btn-again')?.addEventListener('click', () => {
      this.hide();
      this.onRestartGame();
    });
  }

  public hide(): void {
    this.cleanClickListener();
    this.container.innerHTML = '';
  }
}
