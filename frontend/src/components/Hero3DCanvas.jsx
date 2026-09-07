import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Layers, RefreshCw, Sparkles } from 'lucide-react';

export default function Hero3DCanvas() {
  const mountRef = useRef(null);
  const [explodedMode, setExplodedMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  // References to communicate smoothly between React state and animation loop
  const animStateRef = useRef({
    exploded: false,
    autoRotate: true,
    targetMouseX: 0,
    targetMouseY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    dragRotationX: 0,
    dragRotationY: 0,
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
  });

  useEffect(() => {
    animStateRef.current.exploded = explodedMode;
    animStateRef.current.autoRotate = autoRotate;
  }, [explodedMode, autoRotate]);

  const handleResetAngle = () => {
    animStateRef.current.dragRotationX = 0;
    animStateRef.current.dragRotationY = 0;
    animStateRef.current.targetMouseX = 0;
    animStateRef.current.targetMouseY = 0;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- 1. SCENE & CAMERA SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- 2. SOFT STUDIO LIGHTING (NO LASERS / SCI-FI) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.05);
    scene.add(ambientLight);

    const dirKeyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirKeyLight.position.set(5, 7, 6);
    scene.add(dirKeyLight);

    const softFillLight = new THREE.PointLight(0x60a5fa, 1.2, 20);
    softFillLight.position.set(-5, -4, 4);
    scene.add(softFillLight);

    const rimWarmLight = new THREE.PointLight(0xa78bfa, 1.0, 16);
    rimWarmLight.position.set(4, -5, -3);
    scene.add(rimWarmLight);

    // --- 3. HIGH-RES PROCEDURAL 3D PAPER TEXTURES ---
    const createPaperTexture = (title, subtitle, accentColor, sections = []) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 880;
      const ctx = canvas.getContext('2d');

      // Crisp White Paper Sheet
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle paper border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      // Top Header Pill Tag
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(40, 36, 140, 10, 5);
      ctx.fill();

      // Paper Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(title, 40, 84);

      // Subtitle / Meta
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText(subtitle, 40, 112);

      // Abstract / Highlights Box
      ctx.fillStyle = 'rgba(241, 245, 249, 0.8)';
      ctx.beginPath();
      ctx.roundRect(40, 134, canvas.width - 80, 105, 12);
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Abstract lines inside box
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(56, 154 + i * 20, canvas.width - 112 - (i === 3 ? 140 : 0), 7);
      }

      // Two Column Academic Layout
      const colW = (canvas.width - 110) / 2;
      for (let col = 0; col < 2; col++) {
        const startX = 40 + col * (colW + 30);
        for (let row = 0; row < 12; row++) {
          ctx.fillStyle = row === 0 ? accentColor : '#94a3b8';
          const lineH = row === 0 ? 9 : 6;
          const lineW = row === 0 ? 110 : colW - (row % 3 === 0 ? 35 : 0);
          ctx.fillRect(startX, 265 + row * 20, lineW, lineH);
        }
      }

      // Visual Figure / Data Block in bottom half
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(40, 530, canvas.width - 80, 180, 12);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Section Figure Header
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Figure 1: Verified Architecture & Performance Vectors', 56, 560);

      // Data Visualization Bars
      const barPalette = ['#3b82f6', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b'];
      barPalette.forEach((c, idx) => {
        const barH = 35 + idx * 22;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.roundRect(70 + idx * 95, 680 - barH, 60, barH, [6, 6, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText(`M${idx + 1}`, 88 + idx * 95, 696);
      });

      // Footer line
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(40, 840, canvas.width - 80, 2);

      return new THREE.CanvasTexture(canvas);
    };

    // --- 4. 3D PAPER STACK MESHES ---
    const paperGroup = new THREE.Group();
    scene.add(paperGroup);

    const paperGeo = new THREE.PlaneGeometry(2.5, 3.45, 20, 20);

    // Natural curved sheet geometry for realistic physical depth
    const posAttr = paperGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const curveZ = Math.sin(vx * 1.4) * 0.07 + Math.cos(vy * 1.1) * 0.035;
      posAttr.setZ(i, curveZ);
    }
    paperGeo.computeVertexNormals();

    const paperDefs = [
      {
        title: 'Attention Is All You Need',
        subtitle: 'NeurIPS Benchmark  •  Transformer Architecture',
        accent: '#2563eb',
        stackPos: new THREE.Vector3(0, 0, 0.08),
        explodedPos: new THREE.Vector3(-0.75, 0.35, 0.75),
        rotZ: -0.04,
      },
      {
        title: 'Methodology & Matrix Scaling',
        subtitle: 'Multi-Head Attention  •  Positional Encodings',
        accent: '#8b5cf6',
        stackPos: new THREE.Vector3(0.08, -0.08, -0.1),
        explodedPos: new THREE.Vector3(0, 0, 0),
        rotZ: 0.02,
      },
      {
        title: 'Empirical BLEU & Ablations',
        subtitle: 'State-of-the-Art Evaluation  •  WMT En-De Benchmarks',
        accent: '#10b981',
        stackPos: new THREE.Vector3(0.16, -0.16, -0.28),
        explodedPos: new THREE.Vector3(0.75, -0.35, -0.75),
        rotZ: 0.07,
      },
    ];

    const paperMeshes = paperDefs.map((def) => {
      const tex = createPaperTexture(def.title, def.subtitle, def.accent);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        side: THREE.DoubleSide,
        roughness: 0.45,
        metalness: 0.05,
        transparent: true,
        opacity: 0.98,
      });

      const mesh = new THREE.Mesh(paperGeo, mat);
      mesh.position.copy(def.stackPos);
      mesh.rotation.z = def.rotZ;
      mesh.userData = {
        stackPos: def.stackPos.clone(),
        explodedPos: def.explodedPos.clone(),
        rotZ: def.rotZ,
      };
      paperGroup.add(mesh);
      return mesh;
    });

    // --- 5. FLOATING 3D GLASSMORPHIC DIMENSION PILLS ---
    const createPillTexture = (label, color, iconSymbol) => {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');

      // Rounded pill container
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 44);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Icon circle badge
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(44, 48, 22, 0, Math.PI * 2);
      ctx.fill();

      // Icon symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconSymbol, 44, 49);

      // Label text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 80, 48);

      return new THREE.CanvasTexture(canvas);
    };

    const dimensionNodes = [
      {
        name: 'Executive Synthesis',
        desc: 'Instant core thesis & key findings distilled in seconds',
        color: '#3b82f6',
        icon: '✦',
        pos: new THREE.Vector3(2.5, 1.45, 0.8),
      },
      {
        name: 'Methodology Pillars',
        desc: '4-tier research methodology & model architecture breakdown',
        color: '#8b5cf6',
        icon: '⚙',
        pos: new THREE.Vector3(-2.6, 1.35, 0.6),
      },
      {
        name: 'Critical Limitations',
        desc: 'Unaddressed research gaps, dataset biases & compute bounds',
        color: '#f43f5e',
        icon: '▲',
        pos: new THREE.Vector3(2.4, -1.5, 1.0),
      },
      {
        name: 'Future Horizons',
        desc: 'High-leverage research extensions & open strategic directions',
        color: '#10b981',
        icon: '➜',
        pos: new THREE.Vector3(-2.5, -1.35, 0.7),
      },
      {
        name: 'Seminal Citations',
        desc: 'Impact-ranked foundational papers & citation lineage',
        color: '#f59e0b',
        icon: '★',
        pos: new THREE.Vector3(0, 2.3, -0.6),
      },
    ];

    const pillGeo = new THREE.PlaneGeometry(1.65, 0.42);
    const pillMeshes = dimensionNodes.map((dim) => {
      const tex = createPillTexture(dim.name, dim.color, dim.icon);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94,
        roughness: 0.2,
      });

      const mesh = new THREE.Mesh(pillGeo, mat);
      mesh.position.copy(dim.pos);
      mesh.userData = {
        ...dim,
        initialPos: dim.pos.clone(),
      };
      scene.add(mesh);
      return mesh;
    });

    // --- 6. SUBTLE KNOWLEDGE DUST PARTICLES (NON-OBTRUSIVE) ---
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 14;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.032,
      transparent: true,
      opacity: 0.45,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // --- 7. INTERACTIVE MOUSE ROTATION & RAYCASTING ---
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleMouseDown = (e) => {
      animStateRef.current.isDragging = true;
      animStateRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      animStateRef.current.isDragging = false;
    };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouseVector.set(x, y);

      if (animStateRef.current.isDragging) {
        const deltaX = e.clientX - animStateRef.current.previousMousePosition.x;
        const deltaY = e.clientY - animStateRef.current.previousMousePosition.y;
        animStateRef.current.dragRotationY += deltaX * 0.007;
        animStateRef.current.dragRotationX += deltaY * 0.007;
        animStateRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        animStateRef.current.targetMouseX = x * 0.45;
        animStateRef.current.targetMouseY = y * 0.3;
      }

      // Check hover on dimension pills
      raycaster.setFromCamera(mouseVector, camera);
      const hits = raycaster.intersectObjects(pillMeshes);
      if (hits.length > 0) {
        const hitPill = hits[0].object;
        setHoveredNode(hitPill.userData);
      } else {
        setHoveredNode(null);
      }
    };

    // Touch interaction handlers for mobile/tablet screens
    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        animStateRef.current.isDragging = true;
        animStateRef.current.previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = () => {
      animStateRef.current.isDragging = false;
    };

    const handleTouchMove = (e) => {
      if (animStateRef.current.isDragging && e.touches && e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - animStateRef.current.previousMousePosition.x;
        const deltaY = touch.clientY - animStateRef.current.previousMousePosition.y;
        animStateRef.current.dragRotationY += deltaX * 0.007;
        animStateRef.current.dragRotationX += deltaY * 0.007;
        animStateRef.current.previousMousePosition = { x: touch.clientX, y: touch.clientY };
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // --- 8. SMOOTH RENDER LOOP ---
    let frameId;
    const startTime = performance.now();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = (performance.now() - startTime) * 0.001;
      const state = animStateRef.current;

      // Mouse lerp damping
      state.currentMouseX += (state.targetMouseX - state.currentMouseX) * 0.06;
      state.currentMouseY += (state.targetMouseY - state.currentMouseY) * 0.06;

      // Ambient auto-rotation (if enabled)
      const ambientY = state.autoRotate ? Math.sin(time * 0.3) * 0.18 : 0;

      paperGroup.rotation.y = state.dragRotationY + state.currentMouseX + ambientY;
      paperGroup.rotation.x = state.dragRotationX - state.currentMouseY * 0.7;
      paperGroup.position.y = Math.sin(time * 0.7) * 0.08;

      // Smooth layer explosion / stacking
      paperMeshes.forEach((mesh) => {
        const target = state.exploded ? mesh.userData.explodedPos : mesh.userData.stackPos;
        mesh.position.lerp(target, 0.08);
      });

      // Subtle float on dimension pills
      pillMeshes.forEach((pill, idx) => {
        const base = pill.userData.initialPos;
        pill.position.y = base.y + Math.sin(time * 1.3 + idx) * 0.08;
        pill.position.x = base.x + Math.cos(time * 1.0 + idx) * 0.04;
        pill.lookAt(camera.position); // Always face camera gracefully
      });

      // Subtle slow particle drift
      particlePoints.rotation.y = time * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // --- 9. WINDOW RESIZE HANDLER ---
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchmove', handleTouchMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="hero-3d-wrapper" style={{ position: 'relative', width: '100%' }}>
      {/* Three.js canvas container */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '24px',
          overflow: 'hidden',
          cursor: 'grab',
        }}
      />

      {/* Floating Dimension Tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.9)',
            border: `1px solid ${hoveredNode.color || 'rgba(56, 189, 248, 0.4)'}`,
            backdropFilter: 'blur(14px)',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '0.84rem',
            fontWeight: 600,
            boxShadow: `0 8px 24px ${hoveredNode.color}33`,
            pointerEvents: 'none',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: '380px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <strong style={{ color: hoveredNode.color, display: 'block', fontSize: '0.86rem', marginBottom: '2px' }}>
            {hoveredNode.name}
          </strong>
          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{hoveredNode.desc}</span>
        </div>
      )}

      {/* Clean 3D UI Control Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(16px)',
          padding: '6px 12px',
          borderRadius: '999px',
          zIndex: 10,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
        }}
      >
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          style={{
            background: autoRotate ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            color: autoRotate ? '#60a5fa' : 'var(--text-muted)',
            border: autoRotate ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          title="Toggle ambient 3D auto-rotation"
        >
          <RotateCw size={13} />
          <span>{autoRotate ? 'Rotate: ON' : 'Rotate: Paused'}</span>
        </button>

        <button
          type="button"
          onClick={() => setExplodedMode((prev) => !prev)}
          style={{
            background: explodedMode ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
            color: explodedMode ? '#c084fc' : 'var(--text-muted)',
            border: explodedMode ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          title="Expand or stack layered document sections"
        >
          <Layers size={13} />
          <span>{explodedMode ? 'Stack Layers' : 'Expand Layers'}</span>
        </button>

        <button
          type="button"
          onClick={handleResetAngle}
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid transparent',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          title="Reset document view orientation"
        >
          <RefreshCw size={13} />
          <span>Reset View</span>
        </button>
      </div>

      {/* Subtle Interactive Instruction hint */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--text-subtle)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          letterSpacing: '0.3px',
        }}
      >
        <Sparkles size={12} style={{ color: 'var(--primary-blue)' }} />
        <span>Interactive Document Preview (Drag to Orbit)</span>
      </div>
    </div>
  );
}
