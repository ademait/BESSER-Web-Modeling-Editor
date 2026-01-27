# Phase M4: Integration & Testing - Implementation Guide

## 🎯 Objective

Validate the complete SwarmDiagram implementation by building the MOSAICO example diagram, ensuring all components work together correctly, and preparing for presentation.

---

## 📋 Pre-requisites

- Phase M1 completed: Agent role subclasses (Evaluator, Solver, Supervisor, Dispatcher)
- Phase M2 completed: Visual components with robot head icons
- Phase M3 completed: Relationship types (DelegationLink, SupervisionLink) with constraints

---

## 🔧 Step-by-Step Implementation

---

### Step 1: Verify Build Compilation

Before testing, ensure the project builds without errors.

**Command:**
```bash
npm run build
```

**Expected Result:**
- No TypeScript errors
- No compilation warnings related to swarm-diagram
- Build completes successfully

**Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| Type casting errors | Use `as UMLRelationshipType[]` for supportedRelationships arrays |
| Import errors | Check relative paths (../../ vs ../) |
| Missing exports | Ensure new classes are exported from index.ts |
| Circular dependencies | Check import order in index.ts |

---

### Step 2: Start Development Server

**Command:**
```bash
npm run dev
```

**Expected Result:**
- Webpack compiles successfully
- Server starts on `http://localhost:8888` (or configured port)
- No runtime errors in console

---

### Step 3: Validate Palette Elements

Open the editor and create a new SwarmDiagram. Verify all elements appear in the palette.

**Checklist:**

| Element | In Palette? | Correct Icon? | Correct Color? |
|---------|:-----------:|:-------------:|:--------------:|
| Swarm (container) | ⬜ | ⬜ | ⬜ |
| Dispatcher | ⬜ | ⬜ Blue robot | ⬜ #3b82f6 |
| Solver | ⬜ | ⬜ Green robot | ⬜ #22c55e |
| Evaluator | ⬜ | ⬜ Orange robot | ⬜ #f97316 |
| Supervisor | ⬜ | ⬜ Gray robot | ⬜ #6b7280 |
| LanguageModel | ⬜ | ⬜ | ⬜ |

**Note:** `AgentGroup` should NOT appear in the palette (abstract class per Phase M2 Appendix B).

---

### Step 4: Test Element Creation

For each element type, verify:

1. **Drag from palette** → Element appears on canvas
2. **Click element** → Selection handles appear
3. **Double-click/popup** → Property editor opens
4. **Edit name** → Name updates on element
5. **Resize** → Element respects minimum size
6. **Move** → Element can be repositioned

**Element Creation Matrix:**

| Element | Drag | Select | Popup | Edit | Resize | Move |
|---------|:----:|:------:|:-----:|:----:|:------:|:----:|
| Swarm | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Dispatcher | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Solver | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Evaluator | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Supervisor | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| LanguageModel | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

### Step 5: Test Relationship Creation

Verify relationships can be drawn between elements with correct type constraints.

**Test Procedure:**
1. Place two elements on canvas
2. Start drawing relationship from source element
3. Connect to target element
4. Verify correct relationship type is created
5. Click relationship to open popup
6. Verify dropdown shows only allowed types

**Relationship Type Tests:**

| Source | Target | Expected Default | Popup Options |
|--------|--------|------------------|---------------|
| Dispatcher | Solver | DelegationLink (blue) | DelegationLink, SwarmLink |
| Dispatcher | Evaluator | DelegationLink (blue) | DelegationLink, SwarmLink |
| Supervisor | Solver | SupervisionLink (gray dashed) | SupervisionLink, SwarmLink |
| Supervisor | Evaluator | SupervisionLink (gray dashed) | SupervisionLink, SwarmLink |
| Solver | Evaluator | SwarmLink (black) | SwarmLink only |
| Solver | Dispatcher | SwarmLink (black) | SwarmLink only |
| Evaluator | Solver | SwarmLink (black) | SwarmLink only |

**Relationship Feature Tests:**

| Feature | Test | Pass? |
|---------|------|:-----:|
| DelegationLink | Blue solid line with filled arrow | ⬜ |
| DelegationLink | Default label "delegates" | ⬜ |
| SupervisionLink | Gray dashed line with open arrow | ⬜ |
| SupervisionLink | Default label "supervises" | ⬜ |
| SwarmLink | Black solid line | ⬜ |
| Type change | Dispatcher→X can change to DelegationLink/SwarmLink | ⬜ |
| Type change | Solver→X cannot change to DelegationLink (dropdown disabled) | ⬜ |
| Flip | Flip button swaps source and target | ⬜ |
| Delete | Delete button removes relationship | ⬜ |
| Edit name | Can change relationship label | ⬜ |

---

### Step 6: Build the MOSAICO Example Diagram

Recreate the MOSAICO architecture from the reference image.

**MOSAICO Architecture Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOSAICO Swarm                           │
│                                                                 │
│    ┌───────────┐                         ┌───────────┐          │
│    │ Supervisor│ ─ ─ supervises ─ ─ ─ → │ Dispatcher│          │
│    │   (gray)  │                         │   (blue)  │          │
│    └───────────┘                         └─────┬─────┘          │
│          │                                     │                │
│          │                              delegates               │
│          │ supervises                          │                │
│          │                                     ▼                │
│          │                             ┌───────────┐            │
│          │                             │  Solver   │            │
│          └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ → │  (green)  │            │
│                                        └─────┬─────┘            │
│                                              │                  │
│                                         (SwarmLink)             │
│                                              │                  │
│                                              ▼                  │
│                                        ┌───────────┐            │
│                                        │ Evaluator │            │
│                                        │ (orange)  │            │
│                                        └───────────┘            │
│                                                                 │
│                        ┌───────────────┐                        │
│                        │ LanguageModel │                        │
│                        │    (GPT-4)    │                        │
│                        └───────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

**Step-by-Step Creation:**

1. **Create Swarm container**
   - Drag Swarm from palette
   - Name it "MOSAICO Swarm"
   - Resize to fit all elements

2. **Add Supervisor**
   - Drag Supervisor into Swarm
   - Position top-left
   - Name: "Main Supervisor"

3. **Add Dispatcher**
   - Drag Dispatcher into Swarm
   - Position top-right
   - Name: "Task Dispatcher"

4. **Add Solver**
   - Drag Solver into Swarm
   - Position middle-right
   - Name: "Task Solver"

5. **Add Evaluator**
   - Drag Evaluator into Swarm
   - Position bottom-right
   - Name: "Quality Evaluator"

6. **Add LanguageModel**
   - Drag LanguageModel into Swarm
   - Position bottom-center
   - Name: "GPT-4"

7. **Create SupervisionLink: Supervisor → Dispatcher**
   - Draw from Supervisor to Dispatcher
   - Verify: gray dashed line appears
   - Label: "supervises"

8. **Create DelegationLink: Dispatcher → Solver**
   - Draw from Dispatcher to Solver
   - Verify: blue solid line appears
   - Label: "delegates"

9. **Create SupervisionLink: Supervisor → Solver**
   - Draw from Supervisor to Solver
   - Verify: gray dashed line appears
   - Label: "supervises"

10. **Create SwarmLink: Solver → Evaluator**
    - Draw from Solver to Evaluator
    - Verify: black line appears (SwarmLink default)
    - Label: "requests evaluation"

---

### Step 7: Test Serialization/Deserialization

Verify the diagram can be saved and loaded correctly.

**Test Procedure:**

1. **Save diagram**
   - Use File → Export or browser download
   - Save as JSON file

2. **Clear canvas**
   - Delete all elements or create new diagram

3. **Load diagram**
   - Import the saved JSON file
   - Verify all elements restored

**Serialization Checklist:**

| Aspect | Saved Correctly? | Loaded Correctly? |
|--------|:----------------:|:-----------------:|
| Element positions | ⬜ | ⬜ |
| Element names | ⬜ | ⬜ |
| Element types (Dispatcher, Solver, etc.) | ⬜ | ⬜ |
| Element colors | ⬜ | ⬜ |
| Relationship connections | ⬜ | ⬜ |
| Relationship types | ⬜ | ⬜ |
| Relationship labels | ⬜ | ⬜ |
| Containment (elements inside Swarm) | ⬜ | ⬜ |

---

### Step 8: Visual Polish & Screenshot

Prepare for presentation.

**Layout Guidelines:**

1. **Alignment**: Align elements horizontally/vertically when possible
2. **Spacing**: Even spacing between elements
3. **Hierarchy**: Supervisor at top, workers below
4. **Flow**: Left-to-right or top-to-bottom for relationships
5. **Labels**: Ensure all labels are visible and not overlapping

**Screenshot Checklist:**

- [ ] All element types visible and distinguishable
- [ ] All relationship types visible (solid blue, dashed gray, solid black)
- [ ] Labels readable
- [ ] No overlapping elements
- [ ] Clean background
- [ ] Appropriate zoom level

**Recommended Screenshot Settings:**
- Resolution: At least 1920x1080
- Format: PNG for clarity
- Include: Full diagram with some padding

---

## 🐛 Troubleshooting Guide

### Element Issues

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| Element not in palette | Not registered in preview | Check `swarm-diagram-preview.ts` |
| Element renders blank | Component not registered | Check `components.ts` |
| Popup doesn't open | Popup not registered | Check `popups.ts` |
| Wrong icon/color | Component using wrong values | Check component's strokeColor/fillColor |

### Relationship Issues

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| Can't draw relationship | supportedRelationships empty | Check element class has supportedRelationships |
| Wrong default type | Array order wrong | Check source element's supportedRelationships order |
| Popup shows wrong options | getAllowedRelationshipTypes wrong | Check switch statement in update component |
| Arrow not visible | Marker definition issue | Check SVG marker in component |
| Dashed line solid | strokeDasharray not set | Check ThemedPolyline props |

### Build Issues

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| Type errors | Casting issues | Use `as UMLRelationshipType[]` |
| Module not found | Wrong import path | Check relative path depth |
| Circular dependency | Import order | Reorder exports in index.ts |

---

## ✅ Final Verification Checklist

### Functionality

- [ ] All 5 element types can be created (Dispatcher, Solver, Evaluator, Supervisor, LanguageModel)
- [ ] Elements have distinct visual appearance (colors, icons)
- [ ] Swarm container works for grouping
- [ ] DelegationLink only from Dispatcher
- [ ] SupervisionLink only from Supervisor
- [ ] SwarmLink from any element
- [ ] Relationship type dropdown respects source constraints
- [ ] Diagram saves and loads correctly

### Visual Quality

- [ ] Colors match design specification
- [ ] Robot head icons render correctly
- [ ] Relationship arrows visible
- [ ] Dashed lines distinguishable from solid
- [ ] Labels readable at normal zoom

### Presentation Ready

- [ ] MOSAICO example diagram created
- [ ] Screenshot captured
- [ ] No visual glitches
- [ ] Professional appearance

---

## 📸 Expected Final Result

The completed MOSAICO diagram should demonstrate:

1. **Multi-agent architecture** with distinct roles
2. **Visual differentiation** through colors and icons
3. **Relationship semantics** through line styles and labels
4. **Containment** within Swarm boundary
5. **Real-world applicability** of SwarmDiagram notation

---

## 🎉 Success Criteria Met

When all the following are true, Phase M4 is complete:

| Criterion | Status |
|-----------|:------:|
| Build compiles without errors | ⬜ |
| All element types in palette | ⬜ |
| All element types visually distinct | ⬜ |
| Relationship type constraints work | ⬜ |
| MOSAICO diagram recreated | ⬜ |
| Diagram saves/loads correctly | ⬜ |
| Screenshot ready for presentation | ⬜ |

---

## 📝 Notes

- Focus on functionality over perfection
- Minor visual issues can be addressed later
- The goal is to prove the notation can express MOSAICO
- Document any limitations discovered for future work

---

*Document created: January 27, 2026*
