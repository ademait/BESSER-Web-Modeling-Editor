import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { UMLRelationshipType } from '../../uml-relationship-type';
import { SwarmRelationshipType } from '..';

export class SwarmLink extends UMLRelationship {
  type = SwarmRelationshipType.SwarmLink as UMLRelationshipType;
}