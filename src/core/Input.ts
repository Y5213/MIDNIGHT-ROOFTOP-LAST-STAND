export class InputManager {
  public isLocked: boolean = false;
  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;
  private readonly keys: Record<string, boolean> = {};

  // Debug drag-look fallback when pointer lock is unavailable
  private isDragging: boolean = false;
  private lastDragX: number = 0;
  private lastDragY: number = 0;

  constructor(private readonly domElement: HTMLElement, private readonly isDebug: boolean) {
    this.setupListeners();
  }

  private setupListeners(): void {
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      } else if (this.isDebug && this.isDragging) {
        this.mouseDeltaX += e.clientX - this.lastDragX;
        this.mouseDeltaY += e.clientY - this.lastDragY;
        this.lastDragX = e.clientX;
        this.lastDragY = e.clientY;
      }
    });

    this.domElement.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 0) this.isMouseDown = true;
      if (e.button === 2) this.isRightMouseDown = true;

      if (!this.isLocked) {
        this.requestLock();
        if (this.isDebug) {
          this.isDragging = true;
          this.lastDragX = e.clientX;
          this.lastDragY = e.clientY;
        }
      }
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) this.isMouseDown = false;
      if (e.button === 2) this.isRightMouseDown = false;
      this.isDragging = false;
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.code] = true;
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.code] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    // Prevent context menu on right click
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public requestLock(): void {
    if (this.isLocked) return;
    try {
      this.domElement.requestPointerLock();
    } catch {
      // Chrome lock cooldown
    }
  }

  public isKeyDown(code: string): boolean {
    return !!this.keys[code] || !!this.keys[code.toLowerCase()];
  }

  public consumeMouseDeltas(): { dx: number; dy: number } {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }
}
