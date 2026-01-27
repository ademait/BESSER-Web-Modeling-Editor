export const SwarmElementType = {
  Swarm: 'Swarm',
  AgentGroup: 'AgentGroup',
  Evaluator: 'Evaluator',
  Solver: 'Solver',
  Supervisor: 'Supervisor',
  Dispatcher: 'Dispatcher',
  LanguageModel: 'LanguageModel',
} as const;

export const SwarmRelationshipType = {
  SwarmLink: 'SwarmLink',
  DelegationLink: 'DelegationLink',
  SupervisionLink: 'SupervisionLink',
} as const;