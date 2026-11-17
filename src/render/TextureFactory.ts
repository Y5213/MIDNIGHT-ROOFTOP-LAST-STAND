import * as THREE from 'three';

export class TextureFactory {
  /**
   * Generates a wet dark concrete texture with cracks, stains and glossy puddles
   */
  public static createWetConcreteTexture(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const rCanvas = document.createElement('canvas');
    rCanvas.width = size;
    rCanvas.height = size;
    const rCtx = rCanvas.getContext('2d')!;

    // Base concrete dark tone
    ctx.fillStyle = '#14171d';
    ctx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#7a7a7a'; // baseline rough
    rCtx.fillRect(0, 0, size, size);

    // Stains & aggregate noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const rData = rCtx.getImageData(0, 0, size, size);

    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));

      rData.data[i] = Math.min(255, Math.max(0, rData.data[i] + noise * 2));
      rData.data[i + 1] = rData.data[i];
      rData.data[i + 2] = rData.data[i];
    }
    ctx.putImageData(imgData, 0, 0);
    rCtx.putImageData(rData, 0, 0);

    // Dark wet stains & glossy puddles (low roughness)
    for (let p = 0; p < 7; p++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const pr = 40 + Math.random() * 60;

      const grad = ctx.createRadialGradient(px, py, 5, px, py, pr);
      grad.addColorStop(0, 'rgba(8, 10, 14, 0.7)');
      grad.addColorStop(1, 'rgba(8, 10, 14, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // Roughness map: puddles are very glossy (black = mirror smooth)
      const rGrad = rCtx.createRadialGradient(px, py, 5, px, py, pr);
      rGrad.addColorStop(0, 'rgba(15, 15, 15, 0.9)');
      rGrad.addColorStop(1, 'rgba(120, 120, 120, 0)');
      rCtx.fillStyle = rGrad;
      rCtx.beginPath();
      rCtx.arc(px, py, pr, 0, Math.PI * 2);
      rCtx.fill();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(6, 6);

    const roughnessMap = new THREE.CanvasTexture(rCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(6, 6);

    return { map, roughnessMap };
  }

  /**
   * Distant city lit windows texture
   */
  public static createCityWindowsTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, size, size);

    const rows = 32;
    const cols = 16;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.28) {
          // Warm amber or cold cyan lit window
          const isCyan = Math.random() < 0.35;
          ctx.fillStyle = isCyan ? 'rgba(0, 229, 255, 0.85)' : 'rgba(255, 185, 90, 0.85)';
          ctx.fillRect(c * cellW + 3, r * cellH + 2, cellW - 6, cellH - 4);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Zombie detailed snarling face texture with milky dead eyes, exposed teeth & rot
   */
  public static createZombieFaceTexture(type: 'walker' | 'runner' | 'brute'): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const isBrute = type === 'brute';
    const isRunner = type === 'runner';

    // Base skin tone
    const baseColor = isBrute ? '#828482' : isRunner ? '#586b59' : '#727a70';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Mottled decay noise & veins
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 6 + 1;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(25, 30, 22, 0.12)' : 'rgba(50, 18, 18, 0.1)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Branching necrotic dark veins
    ctx.strokeStyle = 'rgba(25, 35, 45, 0.4)';
    ctx.lineWidth = 1.5;
    for (let v = 0; v < (isBrute ? 12 : 7); v++) {
      let vx = (isBrute ? 0.2 : 0.25) * size + Math.random() * size * 0.5;
      let vy = 0.1 * size + Math.random() * size * 0.7;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 5; s++) {
        vx += (Math.random() - 0.5) * 45;
        vy += Math.random() * 30 + 10;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // Sunken hollow eye sockets (centered horizontally)
    const eyeY = size * 0.38;
    const eyeSpacing = size * 0.16;
    const eyeRadius = size * 0.085;

    // Left and Right Eye Sockets
    [size * 0.5 - eyeSpacing, size * 0.5 + eyeSpacing].forEach((ex) => {
      // Dark hollow socket shadow
      const sockGrad = ctx.createRadialGradient(ex, eyeY, eyeRadius * 0.2, ex, eyeY, eyeRadius);
      sockGrad.addColorStop(0, 'rgba(12, 8, 12, 0.95)');
      sockGrad.addColorStop(0.7, 'rgba(38, 18, 22, 0.85)');
      sockGrad.addColorStop(1, 'rgba(60, 40, 40, 0)');
      ctx.fillStyle = sockGrad;
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Eyeball - milky cloudy dead white/sallow
      ctx.fillStyle = isBrute ? '#f0f2eb' : '#d8ded3';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeRadius * 0.45, eyeRadius * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dead cloudy faded iris
      ctx.fillStyle = isBrute ? '#7a858c' : '#526258';
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeRadius * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Faint pinpoint pupil
      ctx.fillStyle = '#1a1f22';
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeRadius * 0.07, 0, Math.PI * 2);
      ctx.fill();

      // Bloodshot vessels in sclera
      ctx.strokeStyle = 'rgba(140, 20, 20, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex - eyeRadius * 0.35, eyeY);
      ctx.lineTo(ex - eyeRadius * 0.15, eyeY + 2);
      ctx.moveTo(ex + eyeRadius * 0.35, eyeY);
      ctx.lineTo(ex + eyeRadius * 0.15, eyeY - 2);
      ctx.stroke();
    });

    // Snarling open mouth with rotting teeth
    const mouthY = size * 0.68;
    const mouthW = size * (isBrute ? 0.32 : 0.26);
    const mouthH = size * (isBrute ? 0.16 : 0.13);

    // Mouth cavity interior (pitch black / dark coagulated red)
    ctx.fillStyle = '#0f0404';
    ctx.beginPath();
    ctx.ellipse(size * 0.5, mouthY, mouthW * 0.5, mouthH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged rotting teeth (Top & Bottom)
    const teethCount = isBrute ? 10 : 8;
    const toothW = (mouthW * 0.8) / teethCount;

    // Top teeth
    for (let t = 0; t < teethCount; t++) {
      const tx = size * 0.5 - mouthW * 0.4 + t * toothW;
      const toothLen = Math.random() * 8 + 10;
      ctx.fillStyle = Math.random() < 0.4 ? '#b8a86a' : '#ded197'; // Rotten yellow/bone
      ctx.beginPath();
      ctx.moveTo(tx, mouthY - mouthH * 0.35);
      ctx.lineTo(tx + toothW * 0.8, mouthY - mouthH * 0.35);
      ctx.lineTo(tx + toothW * 0.4, mouthY - mouthH * 0.35 + toothLen);
      ctx.closePath();
      ctx.fill();
    }

    // Bottom teeth
    for (let t = 0; t < teethCount - 1; t++) {
      const tx = size * 0.5 - mouthW * 0.35 + t * toothW;
      const toothLen = Math.random() * 7 + 8;
      ctx.fillStyle = Math.random() < 0.4 ? '#9c8c56' : '#d2c58f';
      ctx.beginPath();
      ctx.moveTo(tx, mouthY + mouthH * 0.35);
      ctx.lineTo(tx + toothW * 0.8, mouthY + mouthH * 0.35);
      ctx.lineTo(tx + toothW * 0.4, mouthY + mouthH * 0.35 - toothLen);
      ctx.closePath();
      ctx.fill();
    }

    // Dripping dark blood drool from mouth onto chin
    ctx.strokeStyle = 'rgba(75, 10, 10, 0.85)';
    ctx.lineWidth = 3;
    for (let d = 0; d < 4; d++) {
      const dx = size * 0.5 - mouthW * 0.25 + d * (mouthW * 0.2);
      ctx.beginPath();
      ctx.moveTo(dx, mouthY + mouthH * 0.3);
      ctx.lineTo(dx + (Math.random() - 0.5) * 6, mouthY + mouthH * 0.9);
      ctx.stroke();
    }

    // Scars & Gashes on Forehead and Cheeks
    ctx.strokeStyle = 'rgba(65, 12, 12, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.35, size * 0.18);
    ctx.lineTo(size * 0.48, size * 0.28);
    ctx.stroke();

    // Autopsy cross stitches on forehead (Brute reference)
    if (isBrute) {
      ctx.strokeStyle = '#2b221a';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 5; s++) {
        const sx = size * 0.36 + s * 24;
        const sy = size * 0.19 + s * 20;
        ctx.beginPath();
        ctx.moveTo(sx - 6, sy + 6);
        ctx.lineTo(sx + 6, sy - 6);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Zombie rotting flesh & muscular body skin texture
   */
  public static createZombieSkinTexture(type: 'walker' | 'runner' | 'brute'): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const isBrute = type === 'brute';
    const isRunner = type === 'runner';

    // Base flesh tone
    ctx.fillStyle = isBrute ? '#80827f' : isRunner ? '#586b59' : '#6f786d';
    ctx.fillRect(0, 0, size, size);

    // Mottled decay noise
    const imgData = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 24;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Dark bruises and coagulated blood patches
    for (let p = 0; p < (isBrute ? 22 : 14); p++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const pr = 15 + Math.random() * 35;
      const grad = ctx.createRadialGradient(px, py, 4, px, py, pr);
      grad.addColorStop(0, 'rgba(50, 15, 18, 0.65)');
      grad.addColorStop(0.6, 'rgba(30, 25, 25, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Branching veins & surgical stitches
    ctx.strokeStyle = 'rgba(20, 30, 42, 0.45)';
    ctx.lineWidth = 1.8;
    for (let v = 0; v < 8; v++) {
      let vx = Math.random() * size;
      let vy = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 6; s++) {
        vx += (Math.random() - 0.5) * 50;
        vy += (Math.random() - 0.5) * 50;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // Stitched cuts (Brute arms & chest reference)
    if (isBrute) {
      ctx.strokeStyle = '#381010';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(size * 0.2, size * 0.3);
      ctx.lineTo(size * 0.4, size * 0.6);
      ctx.stroke();

      ctx.strokeStyle = '#1a1815';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const sx = size * 0.2 + i * 16;
        const sy = size * 0.3 + i * 24;
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy + 6);
        ctx.lineTo(sx + 8, sy - 6);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Tattered Denim Blue Jeans Texture (Walker / Runner)
   * With ripped knee holes revealing rotting gory flesh beneath
   */
  public static createJeansTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Faded denim blue base
    ctx.fillStyle = '#3a4e6b';
    ctx.fillRect(0, 0, size, size);

    // Denim twill weave lines
    ctx.strokeStyle = 'rgba(75, 105, 140, 0.35)';
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + 2);
      ctx.stroke();
    }

    // Faded thigh highlights (whiskering)
    const fadeGrad = ctx.createLinearGradient(0, size * 0.15, 0, size * 0.55);
    fadeGrad.addColorStop(0, 'rgba(95, 125, 165, 0.45)');
    fadeGrad.addColorStop(1, 'rgba(40, 55, 80, 0)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, size * 0.1, size, size * 0.45);

    // Dark leather belt & metal buckle at the top
    ctx.fillStyle = '#221914';
    ctx.fillRect(0, 0, size, size * 0.08);

    // Silver belt buckle
    ctx.strokeStyle = '#bcc4cf';
    ctx.lineWidth = 4;
    ctx.strokeRect(size * 0.44, size * 0.015, size * 0.12, size * 0.05);

    // Large jagged ripped knee holes revealing rotting gore (center thighs/knees)
    [size * 0.28, size * 0.72].forEach((kx) => {
      const ky = size * 0.65;
      const kw = size * 0.16;
      const kh = size * 0.18;

      // Inner gaping wound (raw deep red / black decay muscle)
      ctx.fillStyle = '#360d0d';
      ctx.beginPath();
      ctx.ellipse(kx, ky, kw, kh, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bloody flesh core
      ctx.fillStyle = '#6b1c1c';
      ctx.beginPath();
      ctx.ellipse(kx, ky, kw * 0.65, kh * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Jagged torn white denim fray threads around the hole border
      ctx.strokeStyle = '#c4cdd8';
      ctx.lineWidth = 2;
      for (let t = 0; t < 24; t++) {
        const ang = (t / 24) * Math.PI * 2;
        const bx = kx + Math.cos(ang) * kw;
        const by = ky + Math.sin(ang) * kh;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (Math.random() - 0.5) * 14, by + (Math.random() - 0.5) * 14);
        ctx.stroke();
      }
    });

    // Mud and dirt splatter around lower shins
    for (let m = 0; m < 35; m++) {
      const mx = Math.random() * size;
      const my = size * 0.75 + Math.random() * size * 0.25;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(32, 22, 16, 0.7)' : 'rgba(18, 14, 12, 0.85)';
      ctx.beginPath();
      ctx.arc(mx, my, Math.random() * 8 + 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Tattered Shirt Texture
   * Walker: Light stone/khaki button-down open over dark undershirt with blood
   * Brute: Ragged charcoal work shirt torn open over white ribbed tank top with claw gashes
   */
  public static createShirtTexture(type: 'walker' | 'runner' | 'brute'): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const isBrute = type === 'brute';

    if (isBrute) {
      // Charcoal/brown ragged work shirt
      ctx.fillStyle = '#2f2b27';
      ctx.fillRect(0, 0, size, size);

      // Open chest: dirty white ribbed tank top down the center
      const tankW = size * 0.44;
      const tankX = size * 0.5 - tankW * 0.5;
      ctx.fillStyle = '#9b9890';
      ctx.fillRect(tankX, 0, tankW, size);

      // Tank top vertical ribs
      ctx.strokeStyle = 'rgba(110, 106, 100, 0.35)';
      ctx.lineWidth = 2;
      for (let x = tankX; x < tankX + tankW; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
      }

      // Massive claw slash lacerations across chest
      ctx.strokeStyle = '#420d0d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(size * 0.35, size * 0.28);
      ctx.lineTo(size * 0.62, size * 0.52);
      ctx.moveTo(size * 0.4, size * 0.22);
      ctx.lineTo(size * 0.68, size * 0.48);
      ctx.stroke();

      // Exposed red gore
      ctx.fillStyle = '#6e1414';
      ctx.beginPath();
      ctx.ellipse(size * 0.52, size * 0.38, 22, 12, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Light khaki/tan button-down work shirt (Image 2)
      ctx.fillStyle = '#7a766c';
      ctx.fillRect(0, 0, size, size);

      // Center open collar placket displaying dark dirty undershirt
      const vWidth = size * 0.28;
      const vX = size * 0.5 - vWidth * 0.5;
      ctx.fillStyle = '#282b30'; // Dark undershirt
      ctx.beginPath();
      ctx.moveTo(vX, 0);
      ctx.lineTo(vX + vWidth, 0);
      ctx.lineTo(size * 0.5, size * 0.7);
      ctx.closePath();
      ctx.fill();

      // Breast pockets
      ctx.strokeStyle = '#5a574e';
      ctx.lineWidth = 2;
      ctx.strokeRect(size * 0.16, size * 0.28, size * 0.16, size * 0.2);
      ctx.strokeRect(size * 0.68, size * 0.28, size * 0.16, size * 0.2);

      // Blood stains and chest tears
      ctx.fillStyle = 'rgba(65, 14, 14, 0.75)';
      ctx.beginPath();
      ctx.arc(size * 0.48, size * 0.45, 26, 0, Math.PI * 2);
      ctx.arc(size * 0.35, size * 0.62, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grime & soot noise
    for (let g = 0; g < 40; g++) {
      const gx = Math.random() * size;
      const gy = Math.random() * size;
      ctx.fillStyle = 'rgba(20, 16, 12, 0.4)';
      ctx.beginPath();
      ctx.arc(gx, gy, Math.random() * 12 + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Heavy Work & Combat Boots Texture
   */
  public static createBootsTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Worn dark leather
    ctx.fillStyle = '#24201c';
    ctx.fillRect(0, 0, size, size);

    // Boot sole band
    ctx.fillStyle = '#11100e';
    ctx.fillRect(0, size * 0.8, size, size * 0.2);

    // Laces
    ctx.strokeStyle = '#423b34';
    ctx.lineWidth = 2;
    for (let y = size * 0.2; y < size * 0.75; y += 14) {
      ctx.beginPath();
      ctx.moveTo(size * 0.35, y);
      ctx.lineTo(size * 0.65, y + 8);
      ctx.moveTo(size * 0.65, y);
      ctx.lineTo(size * 0.35, y + 8);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Weathered wood plank texture with grain
   */
  public static createWoodPlankTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#4a3525';
    ctx.fillRect(0, 0, 256, 64);

    // Wood grain lines
    ctx.strokeStyle = '#2d1e13';
    ctx.lineWidth = 1;
    for (let y = 0; y < 64; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 3);
      ctx.bezierCurveTo(80, y + (Math.random() - 0.5) * 4, 160, y + (Math.random() - 0.5) * 4, 256, y);
      ctx.stroke();
    }

    // Nail heads at ends
    ctx.fillStyle = '#111215';
    ctx.beginPath();
    ctx.arc(14, 32, 4, 0, Math.PI * 2);
    ctx.arc(242, 32, 4, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }
}
