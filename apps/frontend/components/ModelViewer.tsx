'use client';

import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';

interface ViewerApi {
  setAutoRotate: (v: boolean) => void;
  reset: () => void;
}

const SUPPORTED = ['stl', 'obj'];

export function ModelViewer({ file }: { file: File | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ViewerApi | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!file) {
      setStatus('idle');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!SUPPORTED.includes(ext)) {
      setStatus('unsupported');
      apiRef.current = null;
      return;
    }

    let disposed = false;
    let cleanup = () => {};
    setStatus('loading');

    (async () => {
      // Dynamic imports keep three.js out of the SSR bundle.
      const THREE = await import('three');
      const { OrbitControls } = await import(
        'three/examples/jsm/controls/OrbitControls.js'
      );

      const buffer = await file.arrayBuffer();
      if (disposed) return;

      // Build the object from the file.
      let object: import('three').Object3D;
      const makeMaterial = () =>
        new THREE.MeshStandardMaterial({
          color: 0x2563eb,
          metalness: 0.15,
          roughness: 0.55,
          flatShading: false,
        });

      if (ext === 'stl') {
        const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
        const geometry = new STLLoader().parse(buffer);
        geometry.computeVertexNormals();
        object = new THREE.Mesh(geometry, makeMaterial());
      } else {
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        const text = new TextDecoder().decode(buffer);
        const group = new OBJLoader().parse(text);
        group.traverse((child) => {
          const mesh = child as import('three').Mesh;
          if ((mesh as unknown as { isMesh?: boolean }).isMesh) {
            mesh.material = makeMaterial();
          }
        });
        object = group;
      }
      if (disposed) return;

      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 400;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf1f5f9);

      // Center the object at the origin and measure it.
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;

      // Camera positioned to frame the whole model.
      const camStart = new THREE.Vector3(maxDim * 1.6, maxDim * 1.3, maxDim * 1.9);
      const camera = new THREE.PerspectiveCamera(45, width / height, maxDim / 100, maxDim * 100);
      camera.position.copy(camStart);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Lighting.
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(1, 1.5, 1);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.4);
      fill.position.set(-1, -1, -0.5);
      scene.add(fill);

      // Ground grid for orientation.
      const grid = new THREE.GridHelper(maxDim * 3, 12, 0xcbd5e1, 0xe2e8f0);
      grid.position.y = -size.y / 2;
      scene.add(grid);

      scene.add(object);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.2;
      controls.target.set(0, 0, 0);
      controls.update();

      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 400;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(container);

      apiRef.current = {
        setAutoRotate: (v: boolean) => {
          controls.autoRotate = v;
        },
        reset: () => {
          camera.position.copy(camStart);
          controls.target.set(0, 0, 0);
          controls.update();
        },
      };
      setStatus('ready');

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        scene.traverse((o) => {
          const mesh = o as import('three').Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as
            | import('three').Material
            | import('three').Material[]
            | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else if (mat) mat.dispose();
        });
      };
    })().catch((err) => {
      if (!disposed) {
        // eslint-disable-next-line no-console
        console.error('[ModelViewer]', err);
        setStatus('error');
      }
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [file]);

  // Keep the live controls in sync with the toggle button.
  useEffect(() => {
    apiRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate, status]);

  if (!file) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">ตรวจสอบชิ้นงาน 3D</h2>
        {status === 'ready' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAutoRotate((v) => !v)}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs transition hover:bg-slate-100"
            >
              {autoRotate ? '⏸ หยุดหมุน' : '▶ หมุนอัตโนมัติ'}
            </button>
            <button
              type="button"
              onClick={() => apiRef.current?.reset()}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs transition hover:bg-slate-100"
            >
              ↺ รีเซ็ตมุมมอง
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="h-80 w-full overflow-hidden rounded-lg bg-slate-100"
        />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            กำลังโหลดโมเดล...
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600">
            ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้ (ไฟล์อาจเสียหาย) — ยังประเมินราคาได้ตามปกติ
          </div>
        )}
        {status === 'unsupported' && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-slate-500">
            ตัวอย่าง 3D รองรับเฉพาะไฟล์ .stl และ .obj — ไฟล์ประเภทอื่นยังประเมินราคาได้ตามปกติ
          </div>
        )}
      </div>

      {status === 'ready' && (
        <p className="mt-2 text-center text-xs text-slate-400">
          ลากเมาส์เพื่อหมุน 360° · scroll เพื่อซูม · คลิกขวาลากเพื่อเลื่อน
        </p>
      )}
    </div>
  );
}
