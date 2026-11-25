// js/three-bg.js
(function () {
  "use strict";

  const host = document.getElementById("three-background");
  if (!host || !window.THREE) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 38;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const dustCount = window.innerWidth < 700 ? 260 : 600;
  const positions = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 90;
    positions[i3 + 1] = (Math.random() - 0.5) * 55;
    positions[i3 + 2] = (Math.random() - 0.5) * 60;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xd4af37,
    size: 0.16,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const dust = new THREE.Points(geometry, material);
  scene.add(dust);

  function resize() {
    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener("resize", resize);

  let pointerX = 0;
  let pointerY = 0;

  window.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);
    dust.rotation.y += 0.0005;
    dust.rotation.x += (pointerY * 0.018 - dust.rotation.x) * 0.025;
    dust.rotation.z += (pointerX * 0.012 - dust.rotation.z) * 0.025;
    renderer.render(scene, camera);
  }

  animate();
})();