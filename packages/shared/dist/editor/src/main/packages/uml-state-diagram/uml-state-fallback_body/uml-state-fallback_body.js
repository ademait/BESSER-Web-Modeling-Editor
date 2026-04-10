import { UMLStateMember } from '../uml-state/uml-state-member';
import { StateElementType } from '..';
export class UMLStateFallbackBody extends UMLStateMember {
    constructor() {
        super(...arguments);
        this.type = StateElementType.StateFallbackBody;
    }
}
//# sourceMappingURL=uml-state-fallback_body.js.map