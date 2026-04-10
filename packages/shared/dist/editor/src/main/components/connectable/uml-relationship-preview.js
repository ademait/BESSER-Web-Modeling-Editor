import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Direction } from '../../services/uml-element/uml-element-port';
import { UMLElementRepository } from '../../services/uml-element/uml-element-repository';
import { Point } from '../../utils/geometry/point';
import { getPortsForElement } from '../../services/uml-element/uml-element';
import { styled } from '../theme/styles';
import { UMLRelationship } from '../../services/uml-relationship/uml-relationship';
// Add safe version of getPortsForElement function
const safeGetPortsForElement = (element) => {
    if (!element) {
        // Return default ports at origin if element is null
        return {
            [Direction.Up]: new Point(0, 0),
            [Direction.Right]: new Point(0, 0),
            [Direction.Down]: new Point(0, 0),
            [Direction.Left]: new Point(0, 0),
            [Direction.Upright]: new Point(0, 0),
            [Direction.Downright]: new Point(0, 0),
            [Direction.Upleft]: new Point(0, 0),
            [Direction.Downleft]: new Point(0, 0),
            [Direction.Topright]: new Point(0, 0),
            [Direction.Topleft]: new Point(0, 0),
            [Direction.Bottomright]: new Point(0, 0),
            [Direction.Bottomleft]: new Point(0, 0),
            [Direction.Center]: new Point(0, 0),
        };
    }
    return getPortsForElement(element);
};
const enhance = connect((state, props) => {
    const element = state.elements[props.port.element];
    // If element is null, return default ports
    if (!element) {
        return {
            ports: safeGetPortsForElement(null)
        };
    }
    const isRelationship = UMLRelationship.isUMLRelationship(element);
    // For relationships, use getPortsForRelationship
    if (isRelationship) {
        // Import and use the helper function
        const { getPortsForRelationship } = require('../../services/uml-relationship/uml-relationship-port');
        return {
            ports: getPortsForRelationship(element)
        };
    }
    // For regular elements, use standard ports
    return {
        ports: safeGetPortsForElement(element)
    };
}, {
    end: UMLElementRepository.endConnecting,
    getAbsolutePosition: UMLElementRepository.getAbsolutePosition,
});
const Polyline = styled.polyline `
  stroke: ${(props) => props.theme.color.primaryContrast};
  fill: 'none';
  pointer-events: 'none';
`;
class RelationshipPreview extends Component {
    render() {
        const { port, ports } = this.props;
        const { x, y } = this.props.getAbsolutePosition(port.element);
        const position = { ...ports[port.direction] };
        const source = new Point(x + position.x, y + position.y);
        const path = [source, this.props.target];
        const points = path.map((p) => `${p.x} ${p.y}`).join(', ');
        return React.createElement(Polyline, { points: points, "pointer-events": "none", stroke: "black", fill: "none", strokeDasharray: "5,5" });
    }
}
export const UMLRelationshipPreview = enhance(RelationshipPreview);
//# sourceMappingURL=uml-relationship-preview.js.map