import { DeepPartial } from 'redux';
import { Styles } from './components/theme/styles';
import { UMLDiagramType } from './packages/diagram-type';
import { UMLElementType } from './packages/uml-element-type';
import { UMLRelationshipType } from './packages/uml-relationship-type';
import { ApollonMode, Locale } from './services/editor/editor-types';
import { Direction } from './services/uml-element/uml-element-port';
import { IBoundary } from './utils/geometry/boundary';
import { IPath } from './utils/geometry/path';
import { BPMNGatewayType } from './packages/bpmn/bpmn-gateway/bpmn-gateway';
import { BPMNEndEventType } from './packages/bpmn/bpmn-end-event/bpmn-end-event';
import { BPMNStartEventType } from './packages/bpmn/bpmn-start-event/bpmn-start-event';
import { BPMNIntermediateEventType } from './packages/bpmn/bpmn-intermediate-event/bpmn-intermediate-event';
import { BPMNTaskType } from './packages/bpmn/bpmn-task/bpmn-task';
import { BPMNFlowType } from './packages/bpmn/bpmn-flow/bpmn-flow';
import { BPMNMarkerType } from './packages/bpmn/common/types';
import { BPMNAgentRole, BPMNGatewayRole, BPMNReflectionMode } from './packages/bpmn/common/types';

export { UMLDiagramType, UMLElementType, UMLRelationshipType, ApollonMode, Locale };
export type { Styles };

export type ApollonOptions = {
  type?: UMLDiagramType;
  mode?: ApollonMode;
  readonly?: boolean;
  enablePopups?: boolean;
  model?: UMLModel;
  theme?: DeepPartial<Styles>;
  locale?: Locale;
  copyPasteToClipboard?: boolean;
  colorEnabled?: boolean;
  scale?: number;
};

export type Selection = {
  elements: { [id: string]: boolean };
  relationships: { [id: string]: boolean };
};

export type UMLModel = {
  version: `3.${number}.${number}`;
  type: UMLDiagramType;
  size: { width: number; height: number };
  elements: { [id: string]: UMLElement };
  interactive: Selection;
  relationships: { [id: string]: UMLRelationship };
  assessments: { [id: string]: Assessment };
  referenceDiagramData?: any;
};

export type UMLModelElementType = UMLElementType | UMLRelationshipType | UMLDiagramType;

export type UMLModelElement = {
  id: string;
  name: string;
  type: UMLModelElementType;
  owner: string | null;
  bounds: IBoundary;
  highlight?: string;
  fillColor?: string;
  strokeColor?: string;
  textColor?: string;
  description?: string;
  icon?: string;
  uri?: string;
  assessmentNote?: string;
};

export interface AgentModelElement extends UMLModelElement {
  replyType: string;
  ragDatabaseName?: string;
  dbSelectionType?: string;
  dbCustomName?: string;
  dbQueryMode?: string;
  dbOperation?: string;
  dbSqlQuery?: string;
}

export type UMLElement = UMLModelElement & {
  type: UMLElementType;
};

export type UMLRelationship = UMLModelElement & {
  type: UMLRelationshipType;
  path: IPath;
  source: {
    element: string;
    direction: Direction;
  };
  target: {
    element: string;
    direction: Direction;
  };
  isManuallyLayouted?: boolean;
};

export type UMLClassifier = UMLElement & {
  attributes: string[];
  methods: string[];
};

export type Visibility = 'public' | 'private' | 'protected' | 'package';

export type MethodImplementationType = 'none' | 'code' | 'bal' | 'state_machine' | 'quantum_circuit';

export type DiagramReference = {
  id: string;
  name: string;
};

export type UMLClassifierMember = UMLElement & {
  code?: string;
  visibility?: Visibility;
  attributeType?: string;
  attributeOperator?: '<' | '<=' | '==' | '>=' | '>';
  implementationType?: MethodImplementationType;
  stateMachineId?: string;
  quantumCircuitId?: string;
  isOptional?: boolean;
  isDerived?: boolean;
  defaultValue?: any;
};

export interface IUMLObjectName extends UMLClassifier {
  classId?: string; // ID of the class from the library this object is based on
}

export interface IUMLObjectAttribute extends UMLElement {
  attributeId?: string; // ID of the attribute from the library class
}

export interface IUMLObjectLink extends UMLRelationship {
  associationId?: string; // ID of the association from the library this link is based on
}

export interface UMLState extends UMLElement {
  type: UMLElementType;
  bodies: string[];
  fallbackBodies: string[];
}

export interface AgentState extends UMLElement {
  type: UMLElementType;
  bodies: string[];
  fallbackBodies: string[];
  replyType: string;
}

export interface AgentIntent extends UMLElement {
  type: UMLElementType;
  bodies: string[];
  intent_description: string;
}

export interface AgentRagElement extends UMLElement {
  type: UMLElementType;
}

export interface UMLReply extends UMLElement {
  type: UMLElementType;
  bodies: string[];
}

export type UMLStateTransition = UMLRelationship & {
  params?: string | string[];
  guard?: string;
};

export type AgentStateTransition = UMLRelationship & {
  params?: string | string[];
  // Canonical shape: transitionType + predefined/custom nested objects
  transitionType?: 'predefined' | 'custom';
  predefined?: {
    predefinedType?: string;
    intentName?: string;
    fileType?: string;
    conditionValue?: string | { variable: string; operator: string; targetValue: string };
  };
  custom?: {
    event?:
      | 'None'
      | 'DummyEvent'
      | 'WildcardEvent'
      | 'ReceiveMessageEvent'
      | 'ReceiveTextEvent'
      | 'ReceiveJSONEvent'
      | 'ReceiveFileEvent';
    condition?: string[];
  };
  // Legacy flat properties — kept for backward compatibility with existing diagrams
  predefinedType?: string;
  event?:
    | 'None'
    | 'DummyEvent'
    | 'WildcardEvent'
    | 'ReceiveMessageEvent'
    | 'ReceiveTextEvent'
    | 'ReceiveJSONEvent'
    | 'ReceiveFileEvent';
  condition?: string | string[];
  intentName?: string;
  variable?: string;
  operator?: string;
  targetValue?: string;
  conditionValue?:
    | string
    | { variable: string; operator: string; targetValue: string }
    | { events: string[]; conditions: string[] };
  fileType?: string;
  customEvent?:
    | 'None'
    | 'DummyEvent'
    | 'WildcardEvent'
    | 'ReceiveMessageEvent'
    | 'ReceiveTextEvent'
    | 'ReceiveJSONEvent'
    | 'ReceiveFileEvent';
  customConditions?: string[];
};

export type UMLDeploymentNode = UMLElement & {
  stereotype: string;
  displayStereotype: boolean;
};

export type UMLDeploymentArtifact = UMLElement & {
  manifests?: string[];
  // 33 (6b-1) — UUID of the Agent diagram this artifact deploys, threaded
  // from the source agentic lane's `agentDiagramRef` via Component.agentModelRef.
  // BESSER reads this as `Artifact.agent_model_ref` (guide 08-/6b-2) to resolve
  // which BAF agent to bake into the artifact's build context.
  agentModelRef?: string;
};

export type UMLDeploymentComponent = UMLElement & {
  stereotype: string;
  displayStereotype: boolean;
};

export type UMLComponentSubsystem = UMLElement & {
  stereotype: string;
  displayStereotype: boolean;
};

export type UMLComponentComponent = UMLElement & {
  stereotype: string;
  displayStereotype: boolean;
  realizes?: string[];
  processModelRefs?: string[];
  // 33 (6b-1) — UUID of the Agent diagram this agent-Component is defined by,
  // copied from the source lane's `agentDiagramRef` during BPMN→Component
  // derivation. Waypoint on the way to the Deployment Artifact (full-via-Artifact,
  // memo 07 § 8).
  agentModelRef?: string;
};

export type UMLPetriNetPlace = UMLElement & {
  amountOfTokens: number;
  capacity: number | string;
};

// Agentic BPMN (04D): `isAgentic` / `role` / `reflectionMode` / `trustScore`
// live on the base swimlane and task — there are no separate agentic types.
// 08 (07-plan D2): `agentDiagramRef` is an optional cross-diagram link
// from an agentic lane to the BESSER Agent diagram that defines its agent.
export type BPMNSwimlane = UMLElement & {
  isAgentic: boolean;
  role: BPMNAgentRole;
  trustScore: number;
  multiplicity?: number;
  agentDiagramRef?: string;
};

export type BPMNTask = UMLElement & {
  taskType: BPMNTaskType;
  marker: BPMNMarkerType;
  isAgentic: boolean;
  reflectionMode: BPMNReflectionMode;
  trustScore: number;
  // 11 — cross-diagram link from an agentic task to the BESSER Agent
  // diagram that defines its internal behavior (retarget of 08 from lane).
  agentDiagramRef?: string;
  // 47 — cross-reflection reviewer: the ID of the agentic BPMN lane whose
  // agent reviews this task's output. Absent = placeholder peer="reviewer".
  reflectionReviewerLaneId?: string;
};

export type BPMNSubprocess = UMLElement & {
  isExpanded: boolean;
};

export type BPMNTransaction = UMLElement & {
  isExpanded: boolean;
};

export type BPMNCallActivity = UMLElement & {
  calledElement: string;
};

export type BPMNGateway = UMLElement & {
  gatewayType: BPMNGatewayType;
  isAgentic: boolean;
  gatewayRole: BPMNGatewayRole;
  trustScore: number;
  governanceDsl?: string;
};

export type BPMNStartEvent = UMLElement & {
  eventType: BPMNStartEventType;
};

export type BPMNIntermediateEvent = UMLElement & {
  eventType: BPMNIntermediateEventType;
};

export type BPMNEndEvent = UMLElement & {
  eventType: BPMNEndEventType;
};

export type BPMNFlow = UMLRelationship & {
  flowType: BPMNFlowType;
  isDefault?: boolean;
};

export type UMLReachabilityGraphMarking = UMLElement & {
  isInitialMarking: boolean;
};

export type UMLAssociation = UMLRelationship & {
  source: UMLRelationship['source'] & {
    multiplicity: string;
    role: string;
  };
  target: UMLRelationship['target'] & {
    multiplicity: string;
    role: string;
  };
};

export type UMLComponentDependency = UMLRelationship & {
  stereotype?: string;
};

export type UMLDeploymentAssociation = UMLRelationship & {
  stereotype?: string;
};

export type UMLCommunicationLink = UMLRelationship & {
  messages: {
    [id: string]: {
      id: string;
      name: string;
      direction: 'source' | 'target';
    };
  };
};

export type FeedbackCorrectionStatus = {
  description?: string;
  status: 'CORRECT' | 'INCORRECT' | 'NOT_VALIDATED';
};

export type Assessment = {
  modelElementId: string;
  elementType: UMLElementType | UMLRelationshipType;
  score: number;
  feedback?: string;
  dropInfo?: any;
  label?: string;
  labelColor?: string;
  correctionStatus?: FeedbackCorrectionStatus;
};

export type ExportOptions = {
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  keepOriginalSize?: boolean;
  include?: string[];
  exclude?: string[];
};

export type SVG = {
  svg: string;
  clip: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
