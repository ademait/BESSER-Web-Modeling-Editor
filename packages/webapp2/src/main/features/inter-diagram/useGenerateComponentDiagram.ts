import { useCallback } from 'react';
import type { UMLModel } from '@besser/wme';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import {
  addDiagramThunk,
  bumpEditorRevision,
  switchDiagramTypeThunk,
  updateDiagramModelThunk,
} from '../../app/store/workspaceSlice';
import type { DiagramLineage } from '../../shared/types/project';
import { bpmnModelToComponentModel } from './bpmn-to-component';
import { hashUmlModel } from './lineage-hash';
import type { DerivationResult } from './types';

/**
 * Generate a Component diagram from the active BPMN diagram.
 *
 * Compose the existing slice thunks: addDiagramThunk → switchDiagramTypeThunk
 * → updateDiagramModelThunk. The first creates an empty shell at a new
 * index, the second activates it (and bumps `editorRevision`), the
 * third stamps the derived model onto the now-active diagram.
 *
 * Generate-once (OQ-3) — each call produces a new diagram; no overwrite.
 */
export function useGenerateComponentDiagram(): () => Promise<DerivationResult> {
  const dispatch = useAppDispatch();
  const activeDiagram = useAppSelector((s) => s.workspace.activeDiagram);
  const activeDiagramType = useAppSelector((s) => s.workspace.activeDiagramType);

  return useCallback(async () => {
    if (activeDiagramType !== 'BPMN' || !activeDiagram?.model) {
      return { ok: false, reason: 'not-a-bpmn-diagram', warnings: [] };
    }

    const result = bpmnModelToComponentModel(activeDiagram.model as UMLModel);
    if (!result.ok) return result;

    const title = `${activeDiagram.title || 'BPMN'} — Components`;

    // 06-v1 — record lineage on the new diagram so the UI can show
    // "← Derived from <source title>" and detect staleness when the
    // source model changes.
    const derivedFrom: DiagramLineage = {
      sourceDiagramId: activeDiagram.id,
      sourceDiagramType: 'BPMN',
      derivationKind: 'bpmn-to-component',
      derivedAt: new Date().toISOString(),
      sourceModelHash: hashUmlModel(activeDiagram.model as UMLModel),
    };

    await dispatch(addDiagramThunk({ diagramType: 'ComponentDiagram', title, derivedFrom })).unwrap();
    await dispatch(switchDiagramTypeThunk({ diagramType: 'ComponentDiagram' })).unwrap();
    await dispatch(updateDiagramModelThunk({ model: result.model })).unwrap();
    // F-D2 (2026-05-27): updateDiagramModelThunk is intentionally
    // silent on editorRevision (so normal editing doesn't reinit the
    // editor on every keystroke). For a derivation we DO want the
    // editor to pick up the populated model immediately.
    dispatch(bumpEditorRevision());

    return result;
  }, [dispatch, activeDiagram, activeDiagramType]);
}
