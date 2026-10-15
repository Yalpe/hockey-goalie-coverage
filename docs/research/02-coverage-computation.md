# 02 — Computing the Coverage Shadow, Open Net and % covered

**Question.** What is the best way to compute, at 60 fps while the user drags the goaltender, a hand or the Puck, the goalie's **Coverage Shadow** on the goal-line plane (perspective projection with the Puck as a point light), the **Open Net** (the rest of the **Goal Mouth**), and a "% net covered" number? The computation has to account for the Puck's size: the goalie is dilated by 1.5" horizontally and 0.5" vertically, and the Goal Mouth is shrunk by 1.5" from the posts and 0.5" from the crossbar and ice.

**Recommendation (TL;DR).** Use an **analytic CPU pipeline** as the single source of truth for both the number and what is drawn:

1. **Build each primitive's dilated hull in 3D.** For every convex primitive (capsule or box), build a 3D convex hull of its Minkowski sum with the Puck: the sum of sampled points on the primitive and on the Puck cylinder, run through `ConvexHull`. Cache it in the goalie's local frame.
2. **Clip and project.** Each frame, clip each hull to the slab between the goal plane and the Puck, then project its vertices from the Puck onto the goal plane (one divide per vertex).
3. **Take the 2D hull** of each primitive's projected points.
4. **Union and clip.** Union all the 2D hulls with **Clipper2** (`clipper2-ts`), intersect the union with the shrunk Goal Mouth, and compute the area.
5. **Draw** the Coverage Shadow and Open Net polygons as `ShapeGeometry` meshes on the goal plane.

A local benchmark of the full per-frame pipeline came out at **about 2 ms for 35 primitives**, well inside a 16.7 ms frame. The GPU render-target approach is a good **dev-time cross-check**, but it should not be the main path.

---

## 1. Geometry first: what exactly are we computing?

Coordinates used below: the goal plane is `z = 0`, the ice is `y = 0`, and the Puck centre `P` sits at `z = P.z > 0`.

- **Dilation is exact for a flat-travelling puck.** The Puck translates along a straight line without rotating, and its shape `K` (a 3" × 1" cylinder) is symmetric. So the puck's swept volume hits goalie part `G` exactly when the centre line hits `G ⊕ K`, the Minkowski sum. The perspective shadow of `G ⊕ K` from the point `P` is therefore exactly the set of blocked aim points. "1.5" horizontal / 0.5" vertical" is the half-extent of `K`.
- **The Goal Mouth shrink is the matching cross-section.** A flat disk crossing a vertical plane through its centre has a chord 3" wide and a thickness 1". The shrunk mouth is therefore 69" × 47", with `x ∈ [−34.5, 34.5]` and `y ∈ [0.5, 47.5]`.
- **Screen-space dilation is wrong.** A world-space offset at depth `z` projects as `offset · P.z / (P.z − z)`, so the right pixel dilation depends on depth. Dilating the 2D silhouette by a fixed kernel (or with `InflatePaths` after projection) gives the wrong answer. **Inflate in 3D, then project.** This holds for the GPU and analytic paths alike.
- **Only the shot slab matters.** Only geometry with `0 < z < P.z` lies in the Shot Cone. Parts of the goalie behind the goal line (an RVH pad against the post, for example) do not block. Each hull must be **clipped by the plane `z = 0`**: add the edge/plane intersection points, which project onto themselves. Do not just drop vertices with `z ≤ 0`. If the Puck is on or behind the goal line (`P.z ≤ ε`), there is no Shot Cone.
- **Convexity is what makes this cheap.** Every capsule and box is convex, and so is its Minkowski sum with a cylinder. A central projection maps a convex body lying on one side of the eye to a convex region, namely the 2D convex hull of the projected vertices. Each primitive therefore becomes **one convex polygon**, and the only non-convex step is the union.

### Building the dilated hull

- `capsule ⊕ K` is `segment ⊕ sphere(r) ⊕ cylinder`, so we need the hull of `{endpoint + r·sᵢ + kⱼ}`. The `sᵢ` are sphere directions and the `kⱼ` are points on the cylinder's two rims (radius 1.5, height ±0.5).
- `box ⊕ K` is the hull of `{cornerᵢ + kⱼ}`.
- Compute the hull with three.js `ConvexHull` (`three/addons/math/ConvexHull.js`), a Quickhull port. `setFromPoints(points)` takes world-space points. [three.js ConvexHull docs](https://threejs.org/docs/pages/ConvexHull.html)
  - **Gotcha.** `hull.vertices` is the *input* vertex list. Collect the actual hull vertices by walking `hull.faces` (`face.edge … edge.next`). In the benchmark this cut the vertex count from 2048 to about 210 per capsule.
- **Sampling error.** Sampling a circle with `n` points under-covers by a sagitta of `r(1 − cos(π/n))`. For `r = 6"` and `n = 16` that is about 0.11". Scale the sample radius by `1/cos(π/n)` to make it conservative (circumscribed), or raise `n`.
- **Caching.** The Puck is rotationally symmetric about the vertical axis and keeps the same orientation. So `(R·G + t) ⊕ K = R·(G ⊕ K) + t` for any yaw `R` and translation `t`. The inflated hulls can live in the **goalie's local frame** and stay valid while the goalie is moved or turned, and while the Puck is dragged. Only primitives whose pose changes (a hand or the stick, or a Stance change) need rebuilding. That costs about 1.4 ms each with the sample counts below, and fewer samples make it cheaper.

## 2. Option A: GPU, render from the Puck's viewpoint

### A1. Offscreen silhouette and pixel counting

1. **Set up a camera at `P` facing −z.** Its image plane is parallel to the goal plane, so goal-plane area maps *uniformly* to pixels. Use an **asymmetric frustum** that frames exactly the shrunk Goal Mouth rectangle, via `Matrix4.makePerspective(left, right, top, bottom, near, far)` or `PerspectiveCamera.setViewOffset`. Set the far plane at `z = 0` (distance `P.z`) so geometry behind the goal line is clipped for free.
2. **Render the inflated proxy meshes** (for example `ConvexGeometry` built from the hulls in §1, or analytically inflated primitives) in flat white to a `WebGLRenderTarget`.
3. **Count the white pixels.** Coverage = white pixels / total pixels.

**Readback is the catch.**
- `WebGLRenderer.readRenderTargetPixels` is synchronous. The three.js docs recommend `readRenderTargetPixelsAsync` "whenever possible", and describe it as the "asynchronous, non-blocking version". [three.js WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html)
- In the three.js source, the async version does `readPixels` into a `PIXEL_PACK_BUFFER`, puts a `fenceSync` in, and polls it before `getBufferSubData`. [WebGLRenderer.js (dev)](https://github.com/mrdoob/three.js/blob/dev/src/renderers/WebGLRenderer.js)
- MDN: a plain `readPixels()` to the CPU costs a "finish + round-trip". Async readback goes through a PBO and a fence. [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- The WebGL 2 spec calls `getBufferSubData` "a blocking operation" and recommends a `fenceSync` first. [WebGL 2.0 spec](https://registry.khronos.org/webgl/specs/latest/2.0/)
- **Consequence.** The number is one or more frames late (async), or every frame has a pipeline stall (sync). Reading 1024×680×4 bytes (about 2.8 MB) every frame is also wasteful.
- **Reducing on the GPU first** (ping-pong downsample or a mip chain down to 1×1, then read one pixel) cuts the bandwidth but not the latency or synchronisation. Downsampling an 8-bit target also needs a float or half-float target to avoid rounding.
- **Occlusion queries can't count pixels.** WebGL 2 exposes only `ANY_SAMPLES_PASSED` and `ANY_SAMPLES_PASSED_CONSERVATIVE`, which are booleans, not sample counts. [WebGL 2.0 spec](https://registry.khronos.org/webgl/specs/latest/2.0/)

**Accuracy.** Framing 69" across 1024 px gives about 0.07"/px. The area error scales with silhouette perimeter × about ½ px, roughly 0.1 % of the mouth. That is fine for coaching.

**Complexity.** Moderate: an off-axis camera, a second render pass, an async readback and a reduction shader. The output is pixels, so drawing the Open Net needs either the texture or a separate vectorisation step.

### A2. A real shadow (light + `ShadowMaterial`)

- `ShadowMaterial` "can receive shadows, but otherwise is completely transparent". [docs](https://threejs.org/docs/pages/ShadowMaterial.html)
- A point light at the Puck would render a **cube shadow map, 6 faces**: "For cube render targets (PointLights), render all 6 faces". [WebGLShadowMap.js](https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgl/WebGLShadowMap.js), and `PointLightShadow` uses a 90° `PerspectiveCamera` [source](https://github.com/mrdoob/three.js/blob/dev/src/lights/PointLightShadow.js).
- A `SpotLight` aimed at the net needs one render.
- Shadow quality depends on `mapSize`, `bias`, `normalBias` and `radius`. Shadow acne and blurred edges are expected tuning issues. [LightShadow docs](https://threejs.org/docs/pages/LightShadow.html)
- **Drawbacks.** It gives no number. The goalie meshes it uses would be the *visible* ones, not the dilated ones, unless invisible proxy casters are added. Its edges will not exactly match any number computed elsewhere. It is fine as a cosmetic effect, but not as the Coverage Shadow.

### A3. Projective texture

- `SpotLight.map` projects a "cookie" texture, and only takes effect with `castShadow = true`. [SpotLight docs](https://threejs.org/docs/pages/SpotLight.html)
- A custom shader on the goal-plane quad that samples the A1 render target is simpler and exact. Because the camera in A1 frames the mouth rectangle directly, the render target can be used as a plain `map` on the shrunk-mouth plane. No projection math is needed.

## 3. Option B: analytic, project hulls and do a 2D polygon union

**Pipeline.** For each frame:
1. For each cached inflated hull, clip at `z = 0`.
2. Project each vertex: `t = P.z / (P.z − v.z)`, `x' = P.x + (v.x − P.x)·t`, and the same for `y`.
3. Take the 2D monotone-chain hull.
4. Run `union(allHulls, NonZero)`.
5. Compute `intersect(union, mouth)` and `difference(mouth, union)`.
6. Compute `areaPaths` for each result.

### Choosing a library

| Library | Notes | Verdict |
|---|---|---|
| **Clipper2** (Angus Johnson) | Union, intersection, difference and XOR. NonZero/EvenOdd/Positive/Negative fill rules. `InflatePaths` for 2D offsetting. Clips "using integer coordinates internally" for robustness; `ClipperD` scales doubles. [Overview](https://www.angusj.com/clipper2/Docs/Overview.htm). `Area` is signed by orientation. [Area](https://www.angusj.com/clipper2/Docs/Units/Clipper/Functions/Area.htm) | The algorithm to use |
| **`clipper2-ts`** | TypeScript port that follows the C# structure. 258 tests against Clipper2's reference suite. Boost licence. Faster than the Clipper1 JS ports, slower than WASM. Coordinates must stay below 2^53. [README](https://cdn.jsdelivr.net/npm/clipper2-ts@2.0.1-17/README.md). Exposes `union`, `intersect`, `difference`, `areaPaths`, `booleanOpWithPolyTree` (checked in `dist/Clipper.d.ts` v2.0.1-18) | **Recommended** |
| `clipper2-js` | Port that was mostly machine-translated. Its author says "some polygon tests are still failing". [README](https://cdn.jsdelivr.net/npm/clipper2-js@1.2.4/README.md) | Avoid |
| `clipper2-wasm` | WASM build. Reportedly faster than `clipper2-ts`, but adds async WASM loading and memory management. [jsDelivr](https://www.jsdelivr.com/package/npm/clipper2-wasm) | Only if profiling demands it |
| `polygon-clipping` | Martinez-Rueda-Feito, `O((n+k) log n)`. GeoJSON-style input. Has loop guards for "floating-point math round-off errors". [README](https://github.com/mfogel/polygon-clipping) | Works, but about 6× slower in the benchmark below |

### Local benchmark

The benchmark ran in Node 22 on this dev machine, with `clipper2-ts@2.0.1-18`, `polygon-clipping` and three r170 `ConvexHull`.

- **Setup.** 35 random capsules (r = 2–6") in front of the net, Puck about 10' out. Each capsule is inflated by 32 sphere samples × 16-point rims (circumscribed). Clipper coordinates are scaled to 1/1000".
- **Building all 35 inflated hulls:** about 50 ms. That is a one-off on Stance change, or about 1.4 ms per primitive being dragged. Average hull: about 210 vertices.
- **Full per-frame pipeline** (project, 2D hull, union, intersect, difference, area): **about 2.0–2.1 ms**.
- **Union + intersect only:** Clipper2 about 0.8 ms; `polygon-clipping` about 4.7–5.1 ms.
- Lower-end laptop CPUs may be about 2–3× slower. That is still well inside budget, and the hull sample counts can be cut a lot (a 16-point sphere is plenty).

**Accuracy.** Exact up to the hull sampling (≤ about 0.1" conservative/inscribed, as chosen) and Clipper's integer grid (1/1000" at scale 1000). It is deterministic, has no frame lag, and does not depend on resolution.

**Complexity.** Moderate, and all of it is plain TypeScript that can be unit-tested in Node: a Minkowski sample set, `ConvexHull`, a 2D hull, plane clipping, and Clipper calls. It needs no shader work and no GPU sync.

## 4. Drawing Open Net vs Coverage Shadow in three.js

- **Analytic (recommended).**
  - Use `booleanOpWithPolyTree` (or rebuild from the outer/hole orientation) to get outer rings plus holes. The Open Net can have islands, such as the five-hole between the pads, and the shadow can have holes.
  - Turn each outer ring into a `THREE.Shape` and push its hole rings into `shape.holes`. Build a `ShapeGeometry`, which "creates an one-sided polygonal geometry from one or more path shapes". [ShapeGeometry docs](https://threejs.org/docs/pages/ShapeGeometry.html)
  - Use two meshes on the goal plane, e.g. a translucent red Coverage Shadow and a green Open Net, offset a hair toward the Puck, or with `polygonOffset` / `depthWrite: false` to avoid z-fighting with the net mesh.
  - Rebuilding a few-hundred-vertex `ShapeGeometry` per frame is cheap. Dispose of the old geometry each frame, or write into a preallocated `BufferGeometry` with `setDrawRange`.
  - Optionally outline the shrunk mouth so coaches see the 1.5"/0.5" margins. Optionally draw the Shot Cone edges from the Puck to the Open Net vertices.
- **GPU (if A1 is used).** Map the render target onto a quad that exactly covers the shrunk Goal Mouth, with a small shader: red where the mask is set, green elsewhere.
- **Cosmetic extra.** A `SpotLight` at the Puck with a `ShadowMaterial` on the ice can add a soft "real" shadow for flavour. Keep it visually distinct from the authoritative coverage overlay.

## 5. Hybrids considered

- **Analytic number, shadow-map display.** Rejected. Two sources of truth would show visibly different edges: the shadow has no dilation, bias and blur, while the number is exact.
- **GPU mask for both the number and the display.** Viable. It is the natural fallback if the goalie ever gains non-convex or skinned meshes that cannot be broken into convex parts. Its costs are a frame of latency on the number and readback plumbing.
- **Analytic for both, GPU as a test oracle.** **Recommended setup.** Ship analytic, and keep a debug toggle or Vitest/Playwright check that renders the A1 mask and asserts the two coverage values agree within about 0.2 %.

## 6. Recommendation

Use the **analytic pipeline (Option B) with `clipper2-ts`**:

- **Accuracy:** exact geometry including the anisotropic Puck dilation, done properly in 3D.
- **Speed:** about 2 ms per frame for a 35-primitive goalie, with no GPU readback and no frame lag. Inflated hulls are cached in the goalie frame and rebuilt only for moved parts.
- **One source of truth:** the same polygons give the % number and the Open Net / Coverage Shadow meshes.
- **Testability:** easy to unit-test.

Avoid screen-space or 2D-offset dilation (it is wrong under perspective), `clipper2-js` (known failing tests), and light shadows as the authoritative display.

**Things to get right:**
- Clip the hulls at the goal plane, so parts behind the goal line don't count.
- Handle the Puck at or behind the goal line.
- Read real hull vertices from `ConvexHull.faces`.
- Use a fixed Clipper scale (e.g. 1000 per inch).
- Keep every primitive convex. Split a non-convex part (e.g. glove pocket, stick) into several convex primitives.
