import { useEffect, useRef, useState } from "react";

import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { createRig, rigParts, addMarkers } from "./rigModel";

import { healthState, markerDefinitions } from "../data/config";

import { Badge, Icon, Panel } from "./ui";

export default function DigitalTwin({ data, mode, settings }) {
  const score = data.prediction?.health_indicator,
    stale = data.stale;

  const host = useRef(),
    sceneApi = useRef(),
    [error, setError] = useState(""),
    [assetNote, setAssetNote] = useState(""),
    [part, setPart] = useState("ds18b20");

  const health = healthState(stale ? null : score, settings.health);

  useEffect(() => {
    const mount = host.current;

    let renderer,
      observer,
      disposed = false,
      rig;

    const scene = new THREE.Scene();

    scene.background = new THREE.Color("#0d1720");

    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);

    camera.position.set(6.3, 4.2, 7.2);

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

    renderer.shadowMap.type = THREE.PCFShadowMap;

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

    function applyHealth(color) {
      halo.material.color.set(color);
      rim.color.set(color);
      rig.traverse((o) => {
        if (o.isMesh && o.material?.emissive) {
          o.material.emissive.set(color);
          o.material.emissiveIntensity = 0.08;
        }
      });
      render();
    }
    const reset = () => {
      camera.position.set(6.3, 4.2, 7.2);

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

      const hits = raycaster.intersectObject(rig, true);
      const hit =
        hits.find((h) => markerDefinitions[h.object.userData.part]) ||
        hits.find((h) => h.object.userData.part);

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

          addMarkers(rig);

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
    sceneApi.current?.applyHealth(health.color);
  }, [health.color]);

  const inspect = (key) => {
    setPart(key);

    sceneApi.current?.inspect(key);
  };

  const marker = markerDefinitions[part];

  return (
    <Panel
      title="Equipment installation view"
      eyebrow="DIGITAL TWIN"
      className="twin-panel"
      action={
        <Badge tone={health.tone}>
          {stale ? "Freshness unverified" : health.label}
        </Badge>
      }
    >
      <div className="twin-stage">
        <div className="three-host" ref={host} />
        <div className="twin-overlay">
          <span>SIMPLIFIED EQUIPMENT MODEL</span>
          <strong>{data.source}</strong>
        </div>
        {error && (
          <div className="twin-error" role="alert">
            {error}
          </div>
        )}
        <div className="twin-controls">
          {[
            ["rotate", "Rotate model", () => sceneApi.current?.rotate()],
            ["zoomIn", "Zoom in", () => sceneApi.current?.zoom(0.85)],
            ["zoomOut", "Zoom out", () => sceneApi.current?.zoom(1.15)],
            ["refresh", "Reset view", () => sceneApi.current?.reset()],
          ].map(([icon, label, action]) => (
            <button key={label} aria-label={label} onClick={action}>
              <Icon name={icon} />
            </button>
          ))}
        </div>
      </div>

      <div className="twin-disclaimer">
        Simplified visual representation, not an exact replica or validated
        physics-based digital twin. {assetNote}
      </div>

      <div className="twin-inspect">
        <div className="part-buttons" aria-label="Inspect installed component">
          {Object.entries(markerDefinitions).map(([key, m], i) => (
            <button
              key={key}
              className={part === key ? "selected" : ""}
              aria-pressed={part === key}
              onClick={() => inspect(key)}
            >
              {i + 1}. {m.name}
            </button>
          ))}
        </div>
        <div className="inspection-detail">
          <Icon name="eye" />
          <div>
            <h3>{rigParts[part]?.name}</h3>
            <p>{marker?.location}</p>
            <p>{rigParts[part]?.detail}</p>
            {marker && (
              <>
                <p>Data source: {data.source}</p>
                {marker.fields.length ? (
                  <dl className="record-detail">
                    {marker.fields.map(([key, label, unit]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>
                          {mode === "live" &&
                          Number.isFinite(data.physical?.[key])
                            ? `${data.physical[key]} ${unit}`
                            : "Not available"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>Microcontroller role only; no measurement.</p>
                )}
                {mode !== "live" ? (
                  <p>
                    No verified mapping from the selected dataset to this
                    installation location.
                  </p>
                ) : (
                  <p>
                    Last updated:{" "}
                    {data.physicalTimestamp
                      ? new Date(data.physicalTimestamp).toLocaleString()
                      : "Not available"}
                    . {data.stale ? "Freshness is unverified." : ""}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <p className="muted">
          Drag to rotate · Scroll or pinch to zoom · Click a numbered marker to
          inspect.
        </p>
        <p className="muted">
          For greater geometric accuracy, provide front, side and rear
          photographs, dimensions, and close-ups of the four mounting locations.
          Marker positions are approximate.
        </p>
      </div>
    </Panel>
  );
}

