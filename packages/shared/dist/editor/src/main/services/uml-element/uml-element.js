import { UMLElementType } from '../../packages/uml-element-type';
import { assign } from '../../utils/fx/assign';
import { Point } from '../../utils/geometry/point';
import { uuid } from '../../utils/uuid';
import { Direction } from './uml-element-port';
export const getPortsForElement = (element) => {
    // Add null check
    if (!element || !element.bounds) {
        console.warn('getPortsForElement called with null or invalid element');
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
            [Direction.Bottomright]: new Point(0, 0),
            [Direction.Topleft]: new Point(0, 0),
            [Direction.Bottomleft]: new Point(0, 0),
            [Direction.Center]: new Point(-1000, -1000),
        };
    }
    return {
        [Direction.Up]: new Point(element.bounds.width / 2, 0),
        [Direction.Right]: new Point(element.bounds.width, element.bounds.height / 2),
        [Direction.Down]: new Point(element.bounds.width / 2, element.bounds.height),
        [Direction.Left]: new Point(0, element.bounds.height / 2),
        [Direction.Upright]: new Point(element.bounds.width, element.bounds.height / 4),
        [Direction.Downright]: new Point(element.bounds.width, (3 * element.bounds.height) / 4),
        [Direction.Upleft]: new Point(0, element.bounds.height / 4),
        [Direction.Downleft]: new Point(0, (3 * element.bounds.height) / 4),
        [Direction.Topright]: new Point((3 * element.bounds.width) / 4, 0),
        [Direction.Bottomright]: new Point((3 * element.bounds.width) / 4, element.bounds.height),
        [Direction.Topleft]: new Point(element.bounds.width / 4, 0),
        [Direction.Bottomleft]: new Point(element.bounds.width / 4, element.bounds.height),
        [Direction.Center]: new Point(-1000, -1000),
    };
};
/** Class implementation of `IUMLElement` to use inheritance at runtime */
export class UMLElement {
    constructor(values) {
        this.id = uuid();
        this.name = '';
        this.bounds = { x: 0, y: 0, width: 160, height: 100 };
        this.owner = null;
        this.resizeFrom = "bottomRight" /* ResizeFrom.BOTTOMRIGHT */;
        assign(this, values);
    }
    /**
     * Clones an instance of `UMLElement`
     *
     * @param override - Override existing properties.
     */
    clone(override) {
        const Constructor = this.constructor;
        const values = { ...this, ...override, id: uuid() };
        return new Constructor(values);
    }
    /** Serializes an `UMLElement` to an `Apollon.UMLElement` */
    serialize(children) {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            owner: this.owner,
            bounds: this.bounds,
            highlight: this.highlight,
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            textColor: this.textColor,
            description: this.description,
            uri: this.uri,
            icon: this.icon,
            assessmentNote: this.assessmentNote,
        };
    }
    /** Deserializes an `Apollon.UMLElement` to an `UMLElement` */
    deserialize(values, children) {
        this.id = values.id;
        this.name = values.name;
        this.type = values.type;
        this.owner = values.owner || null;
        this.bounds = { ...values.bounds };
        this.highlight = values.highlight;
        this.fillColor = values.fillColor;
        this.strokeColor = values.strokeColor;
        this.textColor = values.textColor;
        this.description = values.description;
        this.uri = values.uri;
        this.icon = values.icon;
        this.assessmentNote = values.assessmentNote;
    }
}
/** `UMLElement` type specific feature flags */
UMLElement.features = {
    connectable: true,
    droppable: false,
    hoverable: true,
    movable: true,
    resizable: true,
    selectable: true,
    updatable: true,
    alternativePortVisualization: false,
};
UMLElement.supportedRelationships = [];
/** Checks whether an `IUMLElement` is of type `UMLElementType` */
UMLElement.isUMLElement = (element) => element.type in UMLElementType;
//# sourceMappingURL=uml-element.js.map