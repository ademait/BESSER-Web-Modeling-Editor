import { useCallback } from 'react';
import type { UMLModel } from '@besser/wme';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import {
  addDiagramThunk,
  bumpEditorRevision,
  switchDiagramTypeThunk,
  updateDiagramModelThunk,
} from '../../app/store/workspaceSlice';
import { componentModelToDeploymentModel } from './component-to-deployment';
import type { DeploymentDerivationResult } from './types';

/**
 * Generate a Deployment diagram from the active Component diagram.
 *
 * Mirrors `useGenerateComponentDiagram` (02-): addDiagramThunk →
 * switchDiagramTypeThunk → updateDiagramModelThunk → bumpEditorRevision.
 * Generate-once (OQ-3 of 03-) — each call produces a new diagram.
 */
export function useGenerateDeploymentDiagram(): () => Promise<DeploymentDerivationResult> {
  const dispatch = useAppDispatch();
  const activeDiagram = useAppSelector((s) => s.workspace.activeDiagram);
  const activeDiagramType = useAppSelector((s) => s.workspace.activeDiagramType);

  return useCallback(async () => {
    if (activeDiagramType !== 'ComponentDiagram' || !activeDiagram?.model) {
      return { ok: false, reason: 'not-a-component-diagram', warnings: [] };
    }

    const result = componentModelToDeploymentModel(activeDiagram.model as UMLModel);
    if (!result.ok) return result;

    const title = `${activeDiagram.title || 'Components'} — Deployment`;

    await dispatch(addDiagramThunk({ diagramType: 'DeploymentDiagram', title })).unwrap();
    await dispatch(switchDiagramTypeThunk({ diagramType: 'DeploymentDiagram' })).unwrap();
    await dispatch(updateDiagramModelThunk({ model: result.model })).unwrap();
    // F-D2 (carry-over from 02-FU3): bump revision so the editor picks
    // up the populated model immediately. updateDiagramModelThunk is
    // intentionally silent on editorRevision for normal edits.
    dispatch(bumpEditorRevision());

    return result;
  }, [dispatch, activeDiagram, activeDiagramType]);
}
