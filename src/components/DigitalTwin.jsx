import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createRig, rigParts } from "./rigModel";
import { healthState } from "../data/config";
import { Badge, Icon, Panel } from "./ui";
export default function DigitalTwin({
  score,
  stale,
  demo,
  symbolicEffect = true,
  compact = false,
}) {
  const host = useRef(),
    sceneApi = useRef(),
    [error, setError] = useState(""),
    [assetNote, setAssetNote] = useState(""),
    [part, setPart] = useState("engine");
  const health = healthState(stale ? null : score);
  const critical = health.label === "Critical";
  useEffect(() => {
    const mount = host.current;
    let renderer,
      observer,
      frame,
      disposed = false,
      rig;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d1720");
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
    camera.position.set(7.6, 5.1, 8.6);
    function disposeObject(object) {
      object.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((m) => {
            for (const value of Object.values(m))
              if (value?.isTexture) value.dispose();
            m.dispose();
          });
        }
      });
    }
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      setError(
        "3D rendering is unavailable in this browser. Enable WebGL or try a supported browser.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive simplified diesel engine test rig",
    );
    renderer.domElement.tabIndex = 0;
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 4;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.enableDamping = false;
    scene.add(new THREE.HemisphereLight(0xd6eeff, 0x253442, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(2, 7, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -5;
    light.shadow.camera.right = 5;
    light.shadow.camera.top = 5;
    light.shadow.camera.bottom = -5;
    scene.add(light);
    const rim = new THREE.PointLight(0x59dbbc, 12, 12);
    rim.position.set(-2, 3, -3);
    scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x101f2a, roughness: 0.85 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.045;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(18, 36, 0x24404e, 0x1b303d);
    grid.position.y = -0.025;
    scene.add(grid);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.016, 8, 90),
      new THREE.MeshBasicMaterial({
        color: 0x49dab7,
        transparent: true,
        opacity: 0.7,
      }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.scale.y = 0.67;
    halo.position.y = 0.02;
    scene.add(halo);
    const flames = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.07, 0.38, 6),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0xffad66 : 0xef7185,
          transparent: true,
          opacity: 0.5,
        }),
      );
      mesh.position.set(-0.7 + i * 0.14, 2.55 + Math.sin(i) * 0.1, 0.3);
      flames.add(mesh);
    }
    flames.visible = false;
    scene.add(flames);
    rig = createRig();
    scene.add(rig);
    function render() {
      if (!disposed) {
        renderer.render(scene, camera);
        renderer.domElement.dataset.rendered = "true";
      }
    }
    function resize() {
      if (!mount.clientWidth || !mount.clientHeight) return;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      render();
    }
    observer = new ResizeObserver(resize);
    observer.observe(mount);
    controls.addEventListener("change", render);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    function applyHealth(color, isCritical, effects) {
      cancelAnimationFrame(frame);
      halo.material.color.set(color);
      rim.color.set(color);
      rig.traverse((o) => {
        if (o.isMesh && o.material?.emissive) {
          o.material.emissive.set(color);
          o.material.emissiveIntensity = 0.12;
        }
      });
      flames.visible = isCritical && effects;
      let last = 0;
      function animate(t) {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        if (t - last < 65) return;
        last = t;
        flames.children.forEach((f, i) => {
          f.scale.y = 0.7 + Math.sin(t / 260 + i) * 0.25;
          f.material.opacity = 0.3 + Math.sin(t / 360 + i) * 0.12;
        });
        render();
      }
      if (flames.visible && !media.matches)
        frame = requestAnimationFrame(animate);
      render();
    }
    const reset = () => {
      camera.position.set(7.6, 5.1, 8.6);
      controls.target.set(0, 1.2, 0);
      controls.update();
      render();
    };
    function inspect(key) {
      setPart(key);
      rig.traverse((o) => {
        if (o.isMesh && o.material?.emissive)
          o.material.emissiveIntensity = o.userData.part === key ? 0.55 : 0.12;
      });
      render();
    }
    sceneApi.current = {
      applyHealth,
      reset,
      inspect,
      zoom: (factor) => {
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(factor);
        if (offset.length() >= 4 && offset.length() <= 16) {
          camera.position.copy(controls.target).add(offset);
          controls.update();
          render();
        }
      },
      rotate: () => {
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        render();
      },
    };
    const raycaster = new THREE.Raycaster();
    let start;
    const down = (e) => {
      start = [e.clientX, e.clientY];
    };
    const up = (e) => {
      if (!start || Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 5)
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster
        .intersectObject(rig, true)
        .find((h) => h.object.userData.part);
      if (hit) inspect(hit.object.userData.part);
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    const lost = (e) => {
      e.preventDefault();
      setError(
        "3D graphics context was lost. Reload the page to restore the view.",
      );
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    if (import.meta.env.VITE_EQUIPMENT_MODEL_URL)
      new GLTFLoader().load(
        import.meta.env.VITE_EQUIPMENT_MODEL_URL,
        (gltf) => {
          if (disposed) {
            disposeObject(gltf.scene);
            return;
          }
          scene.remove(rig);
          disposeObject(rig);
          rig = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(rig),
            size = bounds.getSize(new THREE.Vector3()),
            center = bounds.getCenter(new THREE.Vector3());
          rig.position.sub(center);
          const wrapper = new THREE.Group();
          wrapper.add(rig);
          wrapper.scale.setScalar(4.9 / Math.max(size.x, size.y, size.z));
          wrapper.position.y = 1.5;
          rig = wrapper;
          scene.add(rig);
          setAssetNote("Replacement 3D asset loaded");
          render();
        },
        undefined,
        () =>
          setAssetNote(
            "Replacement model unavailable; showing simplified test rig.",
          ),
      );
    controls.update();
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      sceneApi.current = null;
    };
  }, []);
  useEffect(() => {
    sceneApi.current?.applyHealth(health.color, critical, symbolicEffect);
  }, [health.color, critical, symbolicEffect]);
  const inspect = (key) => {
    setPart(key);
    sceneApi.current?.inspect(key);
  };
  return (
    <Panel
      title={compact ? "Equipment view" : "Digital Twin"}
      eyebrow="DIESEL ENGINE TEST RIG"
      className={`twin-panel ${compact ? "compact-twin" : ""}`}
      action={
        <Badge tone={health.tone}>{stale ? "Stale data" : health.label}</Badge>
      }
    >
      <div className="twin-stage">
        <div className="three-host" ref={host} />
        <div className="twin-overlay">
          <span>{demo ? "DEMO HEALTH STATE" : "MODEL HEALTH STATE"}</span>
          <strong>
            {score == null ? "Awaiting output" : `${Math.round(score)}% health`}
          </strong>
        </div>
        {critical && (
          <div className="critical-symbol">
            <Icon name="flame" size={14} />
            {symbolicEffect
              ? "Symbolic critical effect · not fire detection"
              : "Critical condition · symbolic effect disabled"}
          </div>
        )}
        {error && (
          <div className="twin-error" role="alert">
            {error}
          </div>
        )}
        <div className="twin-controls">
          <button
            onClick={() => sceneApi.current?.rotate()}
            aria-label="Rotate model"
          >
            <Icon name="rotate" />
          </button>
          <button
            onClick={() => sceneApi.current?.zoom(0.85)}
            aria-label="Zoom in"
          >
            <Icon name="zoomIn" />
          </button>
          <button
            onClick={() => sceneApi.current?.zoom(1.15)}
            aria-label="Zoom out"
          >
            <Icon name="zoomOut" />
          </button>
          <button
            onClick={() => sceneApi.current?.reset()}
            aria-label="Reset view"
          >
            <Icon name="refresh" />
          </button>
        </div>
      </div>
      <div className="twin-disclaimer">
        Simplified 3D representation · not an exact digital replica
        {assetNote && ` · ${assetNote}`}
      </div>
      {!compact && (
        <div className="twin-inspect">
          <div className="part-buttons" aria-label="Inspect equipment part">
            {Object.entries(rigParts).map(([key, p]) => (
              <button
                key={key}
                aria-pressed={part === key}
                className={part === key ? "selected" : ""}
                onClick={() => inspect(key)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="inspection-detail">
            <Icon name="eye" />
            <div>
              <h3>{rigParts[part].name}</h3>
              <p>{rigParts[part].detail}</p>
            </div>
          </div>
          <p className="muted">
            Drag to rotate · Scroll or pinch to zoom · Select a component to
            inspect
          </p>
        </div>
      )}
    </Panel>
  );
}
