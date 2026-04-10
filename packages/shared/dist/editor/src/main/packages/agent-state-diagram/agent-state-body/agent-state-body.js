import { AgentStateMember } from '../agent-state/agent-state-member';
import { AgentElementType } from '..';
export class AgentStateBody extends AgentStateMember {
    constructor() {
        super(...arguments);
        this.type = AgentElementType.AgentStateBody;
    }
}
//# sourceMappingURL=agent-state-body.js.map