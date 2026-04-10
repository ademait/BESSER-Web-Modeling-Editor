import { DeepPartial } from 'redux';
import { UMLRelationship, IUMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { UMLRelationshipType } from '../../uml-relationship-type';
export interface ISupervisionLink extends IUMLRelationship {
    supervisionLevel?: string;
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
export declare class SupervisionLink extends UMLRelationship implements ISupervisionLink {
    type: UMLRelationshipType;
    strokeColor: string;
    supervisionLevel?: string;
    constructor(values?: DeepPartial<ISupervisionLink>);
}
