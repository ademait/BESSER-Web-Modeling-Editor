import { DeepPartial } from 'redux';
import { UMLRelationship, IUMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { UMLRelationshipType } from '../../uml-relationship-type';
export interface IDelegationLink extends IUMLRelationship {
    delegationType?: string;
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
export declare class DelegationLink extends UMLRelationship implements IDelegationLink {
    type: UMLRelationshipType;
    strokeColor: string;
    delegationType?: string;
    constructor(values?: DeepPartial<IDelegationLink>);
}
