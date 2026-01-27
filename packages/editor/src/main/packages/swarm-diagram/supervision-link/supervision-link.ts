import { DeepPartial } from 'redux';
import { UMLRelationship, IUMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { UMLRelationshipType } from '../../uml-relationship-type';
import { SwarmRelationshipType } from '..';

export interface ISupervisionLink extends IUMLRelationship {
  supervisionLevel?: string;  // Optional: "direct", "indirect", "advisory"
}

/**
 * SupervisionLink - Represents oversight/monitoring relationship
 * 
 * Typically used for:
 * - Supervisor → Any agent (monitoring/coordinating)
 * - Manager → Team members
 * 
 * Visual: Dashed gray arrow
 */
export class SupervisionLink extends UMLRelationship implements ISupervisionLink {
  type = SwarmRelationshipType.SupervisionLink as UMLRelationshipType;
  
  // Default styling for supervision
  strokeColor: string = '#6b7280';  // Gray
  
  // Optional supervision metadata
  supervisionLevel?: string;

  constructor(values?: DeepPartial<ISupervisionLink>) {
    super(values);
    this.name = values?.name ?? 'supervises';
    this.strokeColor = values?.strokeColor ?? '#6b7280';
    this.supervisionLevel = values?.supervisionLevel;
  }
}