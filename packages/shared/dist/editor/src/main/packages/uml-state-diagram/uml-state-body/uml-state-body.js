import { UMLStateMember } from '../uml-state/uml-state-member';
import { StateElementType } from '..';
export class UMLStateBody extends UMLStateMember {
    constructor() {
        super(...arguments);
        this.type = StateElementType.StateBody;
    }
}
//# sourceMappingURL=uml-state-body.js.map