---
name: extract-design-baselines
description: Extract per-component baseline images from Figma (via MCP) or static screenshots for visual regression testing. Produces __baselines__/ with validated PNG images and manifest. Handles Figma MCP failures with retry, fallback, and integrity validation. Invoke before Phase 2 of /develop-page.
disable-model-invocation: true
---

# Extract Design Baselines

Invoke: `/extract-design-baselines <Figma URL or image path>`

## Purpose

Produce per-component baseline PNGs for pixel-level comparison in Phase 2b. Each baseline is the ground truth for ≥ 99% visual regression.

---

## Mode A: Figma MCP (preferred)

### Prerequisites

- Figma MCP server connected — verify with `/mcp` before starting
- If MCP is not connected, skip to **Mode B** immediately

### Error handling philosophy

Figma MCP calls can fail at any step. The rule is: **verify every output before using it as input to the next step.** Never assume a tool call succeeded.

---

### Step 1: Verify MCP connection

Before any Figma call, confirm the MCP server is reachable:

```
→ /mcp  (check figma server status)
```

**If MCP is not connected or shows errors:**
- Report: "⚠️ Figma MCP not available. Falling back to Mode B (static image crop)."
- Switch to Mode B entirely. Do NOT attempt Figma calls.

### Step 2: Get metadata (with retry)

```
→ get_metadata(node_id from URL)
```

**Verify the response:**
- ✅ Returns a node tree with names, types, and sizes → proceed
- ❌ Returns error, empty response, or timeout → **retry once** after 5 seconds
- ❌ Retry also fails → report the exact error and switch to Mode B:

```
⚠️ FIGMA MCP FAILED at get_metadata
Error: {exact error message}
Node ID: {node_id}
Action: falling back to Mode B. Please provide a static screenshot of the page.
```

### Step 3: Map nodes to components

Align the Figma node tree with the Phase 1 component decomposition.

**Possible issues and handling:**

| Issue | Handling |
|---|---|
| Component name doesn't match any Figma node | Ask the user to identify the correct node, or use the closest parent frame |
| Component spans multiple Figma nodes | Use the parent frame that contains all parts |
| Component is part of a larger node | Note it — will need Mode B (manual crop) for this specific component |
| Figma node has instances (e.g., RepositoryRow-1, -2, -3) | Use the **first instance** as the canonical baseline |

Output a mapping table and get confirmation before proceeding:

```
Code component          → Figma node-id    → Status
RepositoryFilters       → 1234:5678        → ✅ exact match
RepositoryTable         → 1234:5679        → ✅ exact match
RepositoryRow           → 1234:5680        → ✅ using first instance
PageTitle               → (none)           → ⚠️ no match, will use Mode B
```

### Step 4: Export each component (with per-component error handling)

For **each** mapped component, independently:

```
→ get_screenshot(node_id: "{node_id}")
   OR
→ export_node_as_image(node_id: "{node_id}", format: "PNG", scale: 1.0)
```

**CRITICAL: scale must be 1.0** — Playwright screenshots are 1x. Scale mismatch = 0% similarity.

**After each export, immediately validate:**

```bash
# Check the file was actually saved
[ -f "$OUTPUT_PATH" ] || echo "❌ File not created"

# Check file is not empty / corrupted
SIZE=$(stat -c%s "$OUTPUT_PATH" 2>/dev/null || stat -f%z "$OUTPUT_PATH")
[ "$SIZE" -gt 100 ] || echo "❌ File suspiciously small ($SIZE bytes)"

# Check it's a valid PNG (magic bytes: 89 50 4E 47)
HEADER=$(xxd -l 4 -p "$OUTPUT_PATH")
[ "$HEADER" = "89504e47" ] || echo "❌ Not a valid PNG"
```

**If validation fails for a component:**

1. **Retry the export once.** MCP image URLs can expire — a fresh call often works.
2. If retry fails, **log the failure and continue** with other components:
   ```
   ❌ EXPORT FAILED: RepositoryRow
      Error: {description}
      Node ID: 1234:5680
      Retry: attempted, also failed
      Fallback: this component needs Mode B (manual crop)
   ```
3. Do NOT stop the entire process for one component's failure. Export all others, then report which ones need fallback.

### Step 5: Get design context (optional, non-blocking)

```
→ get_design_context(node_id: "{node_id}")
```

**If this fails:** Log it and continue. Design context is helpful but not required — the PNG baseline is what matters for pixel comparison. Missing design context means the developer has less implementation guidance, not a broken workflow.

```
⚠️ design-context not available for {ComponentName} — implementation will rely on visual inspection of baseline PNG
```

### Step 6: Generate manifest

Only include components that **successfully exported** with valid PNGs:

```typescript
// src/features/{feature}/components/__baselines__/manifest.ts

export const baselines = {
  RepositoryFilters: {
    baseline: './RepositoryFilters.baseline.png',
    viewport: { width: 1440, height: 48 },  // from actual PNG dimensions
    tolerance: 0.01,
    figmaNodeId: '1234:5678',
  },
  // Components that failed export are NOT in this manifest
} as const
```

### Step 7: Run validation script

```bash
bash .claude/scripts/validate-baselines.sh src/features/{feature}/components/__baselines__/
```

This script checks:
- Every PNG is non-empty and has valid PNG headers
- No PNG is suspiciously small (< 10×10)
- Every PNG is referenced in the manifest
- Every manifest entry has a corresponding PNG

**If validation fails:** Fix the issues before declaring the extraction complete. Re-export failed components or switch them to Mode B.

### Step 8: Final report

```
━━━ BASELINE EXTRACTION COMPLETE ━━━
Source: Figma (MCP) + manual crop fallback
Total components: 5

✅ RepositoryFilters  → 1440×48  (Figma MCP)
✅ RepositoryTable    → 1440×600 (Figma MCP)
✅ RepositoryRow      → 1440×64  (Figma MCP)
✅ EmptyState         → 400×200  (Figma MCP)
⚠️ PageTitle          → 300×32   (Mode B: manual crop)

Validation: ✅ passed (validate-baselines.sh)
Manifest: src/features/projects/components/__baselines__/manifest.ts

Components missing baseline: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If ANY component has no baseline after both Mode A and Mode B attempts:

```
🚨 INCOMPLETE: 1 component(s) have no baseline
  ❌ CustomWidget — no Figma node match, no static image available
  
Action required: provide a screenshot or Figma link for this component.
Cannot proceed to Phase 2 until all components have baselines.
```

---

## Mode B: Static image (manual crop fallback)

Use when:
- Figma MCP is not available or not connected
- Specific components failed MCP export (mixed mode)
- Design reference is a screenshot/PDF

### Workflow

1. View the source image and identify each component's bounding box
2. Crop using the script:
   ```bash
   bash .claude/scripts/crop-design-reference.sh \
     --source designs/page.png \
     --component RepositoryRow \
     --region "0,280,1440,64" \
     --output src/features/{feature}/components/__baselines__/RepositoryRow.baseline.png
   ```
3. **Validate each crop immediately** — check the output PNG dimensions and visual content
4. If the source image is 2x retina, scale down first:
   ```bash
   magick designs/page@2x.png -resize 50% designs/page@1x.png
   ```
   Then crop from the 1x version.
5. Generate/update manifest
6. Run `validate-baselines.sh`

---

## Common Figma MCP failure modes and mitigations

| Failure | Symptom | Mitigation |
|---|---|---|
| MCP not connected | `/mcp` shows no figma server | Switch to Mode B entirely |
| Invalid node-id | "Node not found" error | Re-copy URL from Figma with correct selection |
| Image URL expired | Download returns 404 or empty | Retry the export — fresh URL generated |
| Rate limited | Multiple calls fail in sequence | Wait 10 seconds between exports |
| Large frame timeout | Export hangs for > 30s | Use child nodes instead of parent frame |
| Empty/corrupt PNG | File < 100 bytes or bad header | Retry once, then Mode B fallback |
| Scale mismatch | PNG dimensions ≠ manifest viewport | Re-export at scale 1.0, or resize with ImageMagick |
| Wrong node exported | PNG shows wrong part of design | Verify node-id mapping in Step 3 |
| MCP disconnects mid-export | Some components exported, others not | Resume from where it stopped, Mode B for remaining |

---

## Integration with /develop-page

Phase 1 step 6 delegates to this skill:

```
/develop-page → Phase 1 step 6 → /extract-design-baselines <URL>
                                      ↓
                                  __baselines__/ with validated PNGs + manifest
                                      ↓
                                  Phase 1 gate verifies baselines exist
                                      ↓
                                  Phase 2b uses baselines for pixel comparison
```

If this skill reports incomplete baselines, `/develop-page` Phase 1 gate will NOT pass.
