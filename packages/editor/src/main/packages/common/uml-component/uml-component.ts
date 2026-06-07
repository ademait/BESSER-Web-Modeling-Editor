import { IUMLContainer } from '../../../services/uml-container/uml-container';
import { UMLPackage } from '../uml-package/uml-package';

export interface IUMLComponent extends IUMLContainer {
  stereotype: string;
  displayStereotype: boolean;
  // 19 — cross-diagram stable ids of Classes this component realizes
  // (memo 17 § 5; BESSER `Component.realizes: List[str]`).
  realizes: string[];
  // 21 — cross-diagram ids of the BPMN diagram(s) whose process this agent
  // participates in (memo 17 § 5; BESSER `AgenticComponent.process_model_refs:
  // List[str]`, diagram-grained). Auto-set on agentic Components by the
  // BPMN→Component derivation; serialized only by UMLComponentComponent.
  processModelRefs: string[];
}

export abstract class UMLComponent extends UMLPackage implements IUMLComponent {
  stereotype = 'component';
  displayStereotype = true;
  realizes: string[] = [];
  processModelRefs: string[] = [];
}
