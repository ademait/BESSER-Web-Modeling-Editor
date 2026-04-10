import { AgentIntentMember } from '../agent-intent-object-component/agent-intent-member';
import { AgentElementType } from '..';
export class AgentIntentBody extends AgentIntentMember {
    constructor() {
        super(...arguments);
        this.type = AgentElementType.AgentIntentBody;
    }
}
//# sourceMappingURL=agent-intent-body.js.map