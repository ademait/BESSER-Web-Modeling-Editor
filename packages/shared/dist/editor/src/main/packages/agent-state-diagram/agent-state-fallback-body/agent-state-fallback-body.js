import { AgentStateMember } from '../agent-state/agent-state-member';
import { AgentElementType } from '..';
export class AgentStateFallbackBody extends AgentStateMember {
    constructor() {
        super(...arguments);
        this.type = AgentElementType.AgentStateFallbackBody;
    }
}
//# sourceMappingURL=agent-state-fallback-body.js.map