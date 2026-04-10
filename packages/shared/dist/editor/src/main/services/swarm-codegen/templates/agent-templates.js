export function generateAgentCode(agent) {
    return `${agent.variableName} = Agent(
    role="${agent.role}",
    goal="${agent.goal}",
    backstory="${agent.backstory}",
    llm="${agent.llm}",
    allow_delegation=${agent.allowDelegation ? 'True' : 'False'},
    verbose=${agent.verbose ? 'True' : 'False'}
)`;
}
export function generateAllAgentsCode(agents) {
    return agents
        .map(agent => generateAgentCode(agent))
        .join('\n\n');
}
//# sourceMappingURL=agent-templates.js.map