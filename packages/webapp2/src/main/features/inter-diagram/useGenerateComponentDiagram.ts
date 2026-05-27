import { useCallback } from 'react';
import type { UMLModel } from '@besser/wme';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { addDiagramThunk, switchDiagramTypeThunk, updateDiagramModelThunk } from '../../app/store/workspaceSlice';
import { bpmnModelToComponentModel } from './bpmn-to-component';
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

    await dispatch(addDiagramThunk({ diagramType: 'ComponentDiagram', title })).unwrap();
    await dispatch(switchDiagramTypeThunk({ diagramType: 'ComponentDiagram' })).unwrap();
    await dispatch(updateDiagramModelThunk({ model: result.model })).unwrap();

    return result;
  }, [dispatch, activeDiagram, activeDiagramType]);
}
