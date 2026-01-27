import { DeepPartial } from 'redux';
import { UMLRelationship, IUMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { UMLRelationshipType } from '../../uml-relationship-type';
import { SwarmRelationshipType } from '..';

export interface IDelegationLink extends IUMLRelationship {
  delegationType?: string;  // Optional: "task", "query", "action", etc.
}

/**
 * DelegationLink - Represents task delegation from one agent to another
 * 
 * Typically used for:
 * - Dispatcher → Solver (delegating tasks)
 * - Any agent → Another agent (forwarding work)
 * 
 * Visual: Solid blue arrow
 */
export class DelegationLink extends UMLRelationship implements IDelegationLink {
  type = SwarmRelationshipType.DelegationLink as UMLRelationshipType;
  
  // Default styling for delegation
  strokeColor: string = '#3b82f6';  // Blue
  
  // Optional delegation metadata
  delegationType?: string;

  constructor(values?: DeepPartial<IDelegationLink>) {
    super(values);
    this.name = values?.name ?? 'delegates';
    this.strokeColor = values?.strokeColor ?? '#3b82f6';
    this.delegationType = values?.delegationType;
  }
}