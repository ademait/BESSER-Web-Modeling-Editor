export function generateTaskCode(task) {
    return `${task.variableName} = Task(
    description="${task.description}",
    expected_output="${task.expectedOutput}",
    agent=${task.agentVariableName}
)`;
}
export function generateAllTasksCode(tasks) {
    return tasks
        .map(task => generateTaskCode(task))
        .join('\n\n');
}
//# sourceMappingURL=task-templates.js.map