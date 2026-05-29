import { ApollonEditor, UMLModel, diagramBridge } from '@besser/wme';
import React, { useEffect, useRef, useContext, useCallback } from 'react';

import { ApollonEditorContext } from './apollon-editor-context';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { isUMLModel, toUMLDiagramType } from '../../../shared/types/project';
import {
  updateDiagramModelThunk,
  selectActiveDiagram,
  selectEditorOptions,
  selectEditorRevision,
  selectStateMachineDiagrams,
  selectQuantumCircuitDiagrams,
  selectProject,
  switchDiagramTypeThunk,
  switchDiagramIndexThunk,
} from '../../../app/store/workspaceSlice';
import { notifyError } from '../../../shared/utils/notifyError';

export const ApollonEditorComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ApollonEditor | null>(null);
  const modelSubscriptionRef = useRef<number | null>(null);
  const debouncedSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setupRunRef = useRef(0);
  const lastHandledRevisionRef = useRef(0);
  const dispatch = useAppDispatch();
  const reduxDiagram = useAppSelector(selectActiveDiagram);
  const options = useAppSelector(selectEditorOptions);
  const editorRevision = useAppSelector(selectEditorRevision);
  const stateMachineDiagrams = useAppSelector(selectStateMachineDiagrams);
  const quantumCircuitDiagrams = useAppSelector(selectQuantumCircuitDiagrams);
  const project = useAppSelector(selectProject);
  const { setEditor } = useContext(ApollonEditorContext);
  // 06-v2 — element id to select after the next editor rebuild (set by
  // the lineage provider's onShowSource; consumed by the setup effect).
  const pendingSelectionRef = useRef<string | null>(null);

  // Stable refs so the setup effect can read current values without
  // needing them in its dependency array (avoids destroy/recreate loops).
  const reduxDiagramRef = useRef(reduxDiagram);
  reduxDiagramRef.current = reduxDiagram;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const destroyEditorDeferred = useCallback((editor: ApollonEditor) => {
    return new Promise<void>((resolve) => {
      // Defer destroy to avoid React unmount race warnings during render transitions.
      setTimeout(() => {
        try {
          editor.destroy();
        } catch (error) {
          console.warn('Error destroying editor:', error);
        } finally {
          resolve();
        }
      }, 0);
    });
  }, []);

  // Cleanup function
  const cleanupEditor = useCallback(async () => {
    // Clear any pending debounced save
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
      debouncedSaveRef.current = null;
    }
    const editor = editorRef.current;
    editorRef.current = null;
    if (!editor) return;
    // Unsubscribe from model changes before destroying
    if (modelSubscriptionRef.current !== null) {
      editor.unsubscribeFromModelChange(modelSubscriptionRef.current);
      modelSubscriptionRef.current = null;
    }
    await destroyEditorDeferred(editor);
  }, [destroyEditorDeferred]);

  useEffect(() => {
    const smDiagrams = stateMachineDiagrams ?? [];
    const qcDiagrams = quantumCircuitDiagrams ?? [];

    const stateMachines = smDiagrams.filter((d) => d.id && d.title).map((d) => ({ id: d.id, name: d.title }));

    const quantumCircuits = qcDiagrams.filter((d) => d.id && d.title).map((d) => ({ id: d.id, name: d.title }));

    diagramBridge.setStateMachineDiagrams(stateMachines);
    diagramBridge.setQuantumCircuitDiagrams(quantumCircuits);
  }, [stateMachineDiagrams, quantumCircuitDiagrams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setupRunRef.current += 1;
      cleanupEditor().catch(notifyError('Editor cleanup'));
      setEditor!(undefined);
    };
  }, [cleanupEditor, setEditor]);

  // Handle editor creation/recreation (initial load + diagram switches/templates).
  // Only runs when editorRevision actually changes (not on every Redux update).
  useEffect(() => {
    if (editorRevision === 0 || editorRevision === lastHandledRevisionRef.current) return;

    const setupEditor = async () => {
      if (!containerRef.current) return;

      lastHandledRevisionRef.current = editorRevision;
      const runId = ++setupRunRef.current;

      // Always destroy old editor before creating a new one
      await cleanupEditor();
      if (!containerRef.current || runId !== setupRunRef.current) return;

      const currentOptions = optionsRef.current;
      const currentDiagram = reduxDiagramRef.current;

      const nextEditor = new ApollonEditor(containerRef.current, currentOptions);
      editorRef.current = nextEditor;
      await nextEditor.nextRender;
      if (runId !== setupRunRef.current || editorRef.current !== nextEditor) {
        await destroyEditorDeferred(nextEditor);
        return;
      }

      // Load diagram model if available (only UML models)
      if (currentDiagram?.model && isUMLModel(currentDiagram.model)) {
        nextEditor.model = currentDiagram.model;
      }

      // 06-v2 — if a lineage click-through requested a source-element
      // selection, apply it now that the new editor is mounted and the
      // model is loaded.
      if (pendingSelectionRef.current) {
        const elementId = pendingSelectionRef.current;
        pendingSelectionRef.current = null;
        // Small delay so the editor's internal model state has fully
        // settled after the .model setter triggers recreateEditor.
        setTimeout(() => {
          try {
            nextEditor.select({ elements: { [elementId]: true }, relationships: { [elementId]: true } });
          } catch {
            /* element may not exist in the source — ignore */
          }
        }, 50);
      }

      // Subscribe to model changes (debounced to avoid excessive localStorage writes on every keystroke)
      modelSubscriptionRef.current = nextEditor.subscribeToModelChange((model: UMLModel) => {
        if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
        debouncedSaveRef.current = setTimeout(() => {
          dispatch(updateDiagramModelThunk({ model }));
        }, 300);
      });

      setEditor!(nextEditor);
    };

    setupEditor().catch(notifyError('Editor setup'));
  }, [editorRevision, cleanupEditor, destroyEditorDeferred, dispatch, setEditor]);

  // 06-v2 — register the lineage provider on the current editor whenever
  // the active diagram (or its lineage data) changes. Re-runs on
  // editorRevision too so each newly-mounted editor gets the provider.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!project || !reduxDiagram?.derivedFrom) {
      editor.setLineageProvider(null);
      return;
    }
    const lineage = reduxDiagram.derivedFrom;
    const sourceDiagrams = project.diagrams[lineage.sourceDiagramType] ?? [];
    const sourceIndex = sourceDiagrams.findIndex((d) => d.id === lineage.sourceDiagramId);
    if (sourceIndex < 0) {
      editor.setLineageProvider(null);
      return;
    }
    const sourceDiagram = sourceDiagrams[sourceIndex];
    const elementMapping = project.elementLineage?.[reduxDiagram.id] ?? {};

    // 06-v2 LT-5 follow-up — look up source element name + type so the
    // popup link can read "← Source: <name> (<type>)". Only UML diagrams
    // have an elements/relationships shape; for non-UML source models we
    // omit the fields and the link falls back to diagram-level wording.
    const sourceModel = isUMLModel(sourceDiagram.model) ? (sourceDiagram.model as UMLModel) : null;

    editor.setLineageProvider({
      resolveSource: (derivedId: string) => {
        const srcElId = elementMapping[derivedId];
        if (!srcElId) return null;
        const srcEl = sourceModel?.elements?.[srcElId] ?? sourceModel?.relationships?.[srcElId];
        return {
          sourceElementId: srcElId,
          sourceDiagramTitle: sourceDiagram.title,
          sourceDiagramType: lineage.sourceDiagramType,
          sourceElementName: srcEl?.name,
          sourceElementType: srcEl?.type,
        };
      },
      onShowSource: async (resolved) => {
        // Stash the element id so the next editor mount selects it.
        pendingSelectionRef.current = resolved.sourceElementId;
        // Convert SupportedDiagramType to UMLDiagramType wire value to
        // avoid the same coercion bug the DiagramTabs badge ran into
        // for BPMN (06-v1 post-LT4).
        const wireType = toUMLDiagramType(lineage.sourceDiagramType);
        try {
          await dispatch(switchDiagramTypeThunk({ diagramType: wireType ?? lineage.sourceDiagramType })).unwrap();
          await dispatch(
            switchDiagramIndexThunk({ diagramType: lineage.sourceDiagramType, index: sourceIndex }),
          ).unwrap();
        } catch (err) {
          console.error('[lineage] navigation to source failed:', err);
          pendingSelectionRef.current = null;
        }
      },
    });
  }, [dispatch, project, reduxDiagram, editorRevision]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col grow overflow-hidden w-full h-full min-h-0"
      style={{ backgroundColor: 'var(--apollon-background, #ffffff)' }}
    />
  );
};
