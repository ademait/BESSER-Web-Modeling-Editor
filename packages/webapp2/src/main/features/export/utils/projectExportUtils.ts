import {
  BesserProject,
  ProjectDiagram,
  SupportedDiagramType,
  getActiveDiagram,
  diagramHasContent,
} from '../../../shared/types/project';
import { normalizeProjectName } from '../../../shared/utils/projectName';

export type ExportableProjectPayload = Omit<BesserProject, 'diagrams'> & {
  diagrams: Record<string, ProjectDiagram[]>;
};

export const buildExportableProjectPayload = (
  project: BesserProject,
  selectedDiagramTypes?: SupportedDiagramType[],
): ExportableProjectPayload => {
  const projectClone = structuredClone(project) as ExportableProjectPayload;
  projectClone.name = normalizeProjectName(projectClone.name || 'project');

  // Filter out empty diagrams from each type, then remove types with no content
  const filtered: Record<string, ProjectDiagram[]> = {};
  for (const [type, diagrams] of Object.entries(projectClone.diagrams)) {
    if (
      selectedDiagramTypes &&
      selectedDiagramTypes.length > 0 &&
      !selectedDiagramTypes.includes(type as SupportedDiagramType)
    ) {
      continue;
    }
    const arr = Array.isArray(diagrams) ? diagrams : [];
    const withContent = (arr as ProjectDiagram[]).filter(diagramHasContent);
    if (withContent.length > 0) {
      filtered[type] = withContent;
    }
  }

  projectClone.diagrams = filtered;

  return projectClone;
};

/**
 * Build a project payload for backend API endpoints.
 * Sends full diagram arrays (not flattened) so the backend has all diagrams.
 * The backend uses currentDiagramIndices to pick the active diagram per type.
 *
 * @param selectedDiagramTypes  Optional filter – only include these diagram types.
 */
export const buildProjectPayloadForBackend = (
  project: BesserProject,
  selectedDiagramTypes?: SupportedDiagramType[],
): Record<string, unknown> => {
  const payload = structuredClone(project);
  payload.name = normalizeProjectName(payload.name || 'project');

  // Filter out empty diagrams, then remove types with no content
  const diagrams: Record<string, ProjectDiagram[]> = {};
  for (const type of Object.keys(payload.diagrams)) {
    const arr = payload.diagrams[type];
    if (Array.isArray(arr)) {
      const withContent = arr.filter(diagramHasContent);
      if (withContent.length > 0) {
        diagrams[type] = withContent;
      }
    }
  }

  // Optionally filter to only the requested diagram types
  if (selectedDiagramTypes && selectedDiagramTypes.length > 0) {
    const filtered: Record<string, ProjectDiagram[]> = {};
    for (const type of selectedDiagramTypes) {
      if (diagrams[type]) {
        filtered[type] = diagrams[type];
      }
    }
    payload.diagrams = filtered;
  } else {
    payload.diagrams = diagrams;
  }

  // Strip WME-internal lineage sidecars (memo 17 §§ 3-4): `derivedFrom`
  // (per-diagram provenance) and `elementLineage` (derived→source element
  // map) have no B-UML referent — BESSER ignores them. They still
  // round-trip through buildExportableProjectPayload (the WME project-file
  // export), so the in-editor LineageSourceLink is unaffected; we only
  // drop them from the backend request body.
  for (const arr of Object.values(payload.diagrams)) {
    if (Array.isArray(arr)) {
      for (const diagram of arr as ProjectDiagram[]) {
        delete diagram.derivedFrom;
      }
    }
  }
  delete (payload as BesserProject).elementLineage;

  return payload;
};

/** @deprecated Use buildProjectPayloadForBackend instead. */
export const flattenProjectForBackend = buildProjectPayloadForBackend;
