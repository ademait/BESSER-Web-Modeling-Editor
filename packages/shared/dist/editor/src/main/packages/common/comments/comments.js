import { CommentsElementType } from '.';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { GeneralRelationshipType } from '../../uml-relationship-type';
export class Comments extends UMLElement {
    constructor(values) {
        super(values && !values.bounds ? { ...values, bounds: { x: 0, y: 0, width: 160, height: 50 } } : values);
        this.type = CommentsElementType.Comments;
    }
    render(canvas) {
        return [this];
    }
}
Comments.supportedRelationships = [
    GeneralRelationshipType.Link
];
//# sourceMappingURL=comments.js.map