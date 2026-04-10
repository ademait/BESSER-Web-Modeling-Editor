import { Point } from '../../utils/geometry/point';
import { Direction } from '../uml-element/uml-element-port';
import { IUMLRelationship } from './uml-relationship';
export declare const RELATIONSHIP_TYPES_WITH_CENTER_PORT: string[];
/**
 * Checks if a relationship type is allowed to have a center port connection
 */
export declare function canHaveCenterPort(relationship: IUMLRelationship): boolean;
/**
 * Calculates the exact position of the central port of a relationship
 * This function is more precise than simply using the center of the bounding rectangle
 */
export declare function getRelationshipCenterPoint(relationship: IUMLRelationship): Point;
/**
 * Gets all ports for a relationship, with the central port correctly positioned
 */
export declare function getPortsForRelationship(relationship: IUMLRelationship): {
    [key in Direction]: Point;
};
