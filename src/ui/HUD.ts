export class GameHUD {
  private container: HTMLElement;
  private hpFill: HTMLElement;
  private hpVal: HTMLElement;
  private ammoPips: HTMLElement;
  private spareCellsVal: HTMLElement;
  private reserveLabel: HTMLElement;
  private weaponTitle: HTMLElement;
  private scrapVal: HTMLElement;
  private waveVal: HTMLElement;
  private zombiesVal: HTMLElement;
  private damageFlash: HTMLElement;
  private promptText: HTMLElement;
  private gateN: HTMLElement;
  private gateE: HTMLElement;
  private gateW: HTMLElement;
  private breachAlert: HTMLElement;
  private slotPills: HTMLElement[] = [];

  constructor() {
    this.container = document.getElementById('ui-root')!;
    this.container.innerHTML = `
      <!-- Red Damage Flash -->
      <div id="damage-flash" class="damage-flash"></div>

      <!-- Center Crosshair -->
      <div class="crosshair">
        <div class="ch-dot"></div>
        <div class="ch-line ch-top"></div>
        <div class="ch-line ch-bottom"></div>
        <div class="ch-line ch-left"></div>
        <div class="ch-line ch-right"></div>
      </div>

      <!-- Cinematic Level Change Banner Overlay -->
      <div id="level-banner" class="level-banner-container hidden">
        <div class="level-banner-badge">THREAT ESCALATION DETECTED</div>
        <h2 id="level-banner-title" class="level-banner-title">LEVEL 1</h2>
        <div id="level-banner-sub" class="level-banner-sub">SURVIVE THE ONSLAUGHT</div>
        <div class="level-banner-lines"></div>
      </div>

      <!-- Pickup Notifications Toast -->
      <div id="pickup-toasts" class="pickup-toasts-container"></div>

      <!-- Barricade Breach Warning Alert -->
      <div id="breach-alert" class="breach-alert hidden">⚠️ CRITICAL: STAIRWELL GATE BREACHED!</div>

      <!-- Interaction Prompt -->
      <div id="interaction-prompt" class="interaction-prompt hidden">
        <span id="prompt-text">[HOLD E] REPAIR PLANK</span>
      </div>

      <!-- Top Center: Level & Threat HUD -->
      <header class="hud-top">
        <div class="gate-status-row">
          <div id="gate-w" class="gate-pill">W: 100%</div>
          <div id="gate-n" class="gate-pill">N: 100%</div>
          <div id="gate-e" class="gate-pill">E: 100%</div>
        </div>
        <div class="wave-tracker">
          <div class="hud-label">LEVEL <span id="wave-num" class="hud-val">1</span> / 10</div>
          <div class="hud-label">THREATS: <span id="zombies-remaining" class="hud-val">0</span></div>
        </div>
      </header>

      <!-- Bottom Left: Health & Scrap -->
      <footer class="hud-bottom-left">
        <div class="stat-block">
          <div class="stat-header">
            <span>HEALTH</span>
            <span id="hp-val" class="stat-num">100</span>
          </div>
          <div class="meter-bar">
            <div id="hp-fill" class="meter-fill" style="width: 100%;"></div>
          </div>
        </div>
        <div class="scrap-block">
          <span>SALVAGED SCRAP:</span>
          <span id="scrap-val" class="scrap-num">8</span>
        </div>
      </footer>

      <!-- Bottom Right: Weapon Slots & Ammo -->
      <footer class="hud-bottom-right">
        <div id="weapon-title" class="weapon-label">ARC-7 PULSE LASER</div>
        <div id="ammo-pips" class="ammo-pips-container"></div>
        <div class="cells-row">
          <span id="reserve-label">SPARE CELLS:</span>
          <span id="spare-cells" class="cells-val">4</span>
        </div>
        <div class="weapon-selector-row">
          <span id="slot-1" class="weapon-slot-pill active">[1] ARC-7 RIFLE</span>
          <span id="slot-2" class="weapon-slot-pill">[2] TALON-9 PISTOL</span>
          <span id="slot-3" class="weapon-slot-pill">[3] SHURIKEN</span>
        </div>
      </footer>
    `;

    this.hpFill = document.getElementById('hp-fill')!;
    this.hpVal = document.getElementById('hp-val')!;
    this.ammoPips = document.getElementById('ammo-pips')!;
    this.spareCellsVal = document.getElementById('spare-cells')!;
    this.reserveLabel = document.getElementById('reserve-label')!;
    this.weaponTitle = document.getElementById('weapon-title')!;
    this.scrapVal = document.getElementById('scrap-val')!;
    this.waveVal = document.getElementById('wave-num')!;
    this.zombiesVal = document.getElementById('zombies-remaining')!;
    this.damageFlash = document.getElementById('damage-flash')!;
    this.promptText = document.getElementById('prompt-text')!;
    this.gateN = document.getElementById('gate-n')!;
    this.gateE = document.getElementById('gate-e')!;
    this.gateW = document.getElementById('gate-w')!;
    this.breachAlert = document.getElementById('breach-alert')!;

    this.slotPills = [
      document.getElementById('slot-1')!,
      document.getElementById('slot-2')!,
      document.getElementById('slot-3')!,
    ];

    this.renderAmmoPips(30, 30);
  }

  public renderAmmoPips(current: number, max: number): void {
    this.ammoPips.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const pip = document.createElement('div');
      pip.className = `ammo-pip ${i < current ? 'active' : ''} ${current <= 5 ? 'critical' : ''}`;
      this.ammoPips.appendChild(pip);
    }
  }

  public updateStats(data: {
    hp: number;
    ammo: number;
    maxAmmo: number;
    spareCells: number;
    reserveLabel: string;
    weaponName: string;
    currentSlot: 1 | 2 | 3;
    scrap: number;
    wave: number;
    zombiesRemaining: number;
    gateN: number;
    gateE: number;
    gateW: number;
  }): void {
    this.hpVal.textContent = Math.round(data.hp).toString();
    this.hpFill.style.width = `${Math.max(0, Math.min(100, data.hp))}%`;
    if (data.hp < 30) {
      this.hpFill.classList.add('critical');
    } else {
      this.hpFill.classList.remove('critical');
    }

    this.weaponTitle.textContent = data.weaponName;
    this.reserveLabel.textContent = data.reserveLabel;
    this.renderAmmoPips(data.ammo, data.maxAmmo);
    this.spareCellsVal.textContent = data.spareCells.toString();
    this.scrapVal.textContent = data.scrap.toString();
    this.waveVal.textContent = data.wave.toString();
    this.zombiesVal.textContent = data.zombiesRemaining.toString();

    // Weapon slot pills highlight
    for (let i = 0; i < this.slotPills.length; i++) {
      if (i + 1 === data.currentSlot) {
        this.slotPills[i].classList.add('active');
      } else {
        this.slotPills[i].classList.remove('active');
      }
    }

    this.updateGatePill(this.gateN, 'N', data.gateN);
    this.updateGatePill(this.gateE, 'E', data.gateE);
    this.updateGatePill(this.gateW, 'W', data.gateW);

    // Any gate fully breached triggers alert
    const isAnyBreached = data.gateN <= 0 || data.gateE <= 0 || data.gateW <= 0;
    if (isAnyBreached) {
      this.breachAlert.classList.remove('hidden');
    } else {
      this.breachAlert.classList.add('hidden');
    }
  }

  private updateGatePill(element: HTMLElement, label: string, integrityPct: number): void {
    element.textContent = `${label}: ${Math.round(integrityPct)}%`;
    if (integrityPct <= 0) {
      element.className = 'gate-pill breached';
    } else if (integrityPct < 50) {
      element.className = 'gate-pill critical';
    } else {
      element.className = 'gate-pill';
    }
  }

  public triggerDamageFlash(): void {
    this.damageFlash.classList.add('flash-active');
    setTimeout(() => {
      this.damageFlash.classList.remove('flash-active');
    }, 200);
  }

  public showPrompt(text: string): void {
    this.promptText.textContent = text;
    this.promptText.parentElement?.classList.remove('hidden');
  }

  public hidePrompt(): void {
    this.promptText.parentElement?.classList.add('hidden');
  }

  public showLevelBanner(level: number): void {
    const banner = document.getElementById('level-banner');
    const title = document.getElementById('level-banner-title');
    const sub = document.getElementById('level-banner-sub');
    if (!banner || !title || !sub) return;

    const levelDescriptions = [
      'OUTPOST BREACH INITIATED',
      'WALKER HORDE RISING',
      'RUNNER STRAIN DETECTED',
      'BULKHEAD PRESSURE CRITICAL',
      'BRUTE EMERGENCE // HEAVY ASSET',
      'MIDNIGHT BLOOD MOON SURGE',
      'TRI-GATE MASS ASSAULT',
      'DOUBLE BRUTE REINFORCEMENTS',
      'PENULTIMATE HORDE WAVE',
      'FINAL STAND // HOLD UNTIL DAWN',
    ];

    title.innerText = `LEVEL ${level} / 10`;
    sub.innerText = levelDescriptions[level - 1] || 'ELIMINATE ALL HOSTILES';

    banner.classList.remove('hidden', 'level-banner-anim');
    void banner.offsetWidth; // Force CSS animation restart
    banner.classList.add('level-banner-anim');

    setTimeout(() => {
      banner.classList.add('hidden');
      banner.classList.remove('level-banner-anim');
    }, 3200);
  }

  public showPickupToast(text: string, color: string = '#00e5ff'): void {
    const container = document.getElementById('pickup-toasts');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'pickup-toast';
    toast.style.color = color;
    toast.style.borderColor = color;
    toast.innerText = text;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 1800);
  }
}
