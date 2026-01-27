import { ComposePreview } from '../compose-preview';
import { UMLElement } from '../../services/uml-element/uml-element';
import { ILayer } from '../../services/layouter/layer';
import { Swarm } from './swarm/swarm';
import { Evaluator } from './agent-evaluator/evaluator';
import { Solver } from './agent-solver/solver';
import { Supervisor } from './agent-supervisor/supervisor';
import { Dispatcher } from './agent-dispatcher/dispatcher';
import { LanguageModel } from './language-model/language-model';

export const composeSwarmPreview: ComposePreview = (
  layer: ILayer,
  translate: (id: string) => string,
): UMLElement[] => {
  const elements: UMLElement[] = [];

  // Swarm element for palette
  const swarm = new Swarm({ name: 'Swarm' });
  swarm.bounds = {
    ...swarm.bounds,
    width: 250, 
    height: 200,
  };
  elements.push(swarm);

  // For now it is abstract. Base AgentGroup (generic)
  // const agentGroup = new AgentGroup({ name: 'AgentGroup' });
  // agentGroup.bounds = { ...agentGroup.bounds, width: 60, height: 80 };
  // elements.push(agentGroup);

  // Evaluator (orange)
  const evaluator = new Evaluator({ name: 'Evaluator' });
  evaluator.bounds = { ...evaluator.bounds, width: 60, height: 80 };
  elements.push(evaluator);

  // Solver (green)
  const solver = new Solver({ name: 'Solver' });
  solver.bounds = { ...solver.bounds, width: 60, height: 80 };
  elements.push(solver);

  // Supervisor (gray)
  const supervisor = new Supervisor({ name: 'Supervisor' });
  supervisor.bounds = { ...supervisor.bounds, width: 60, height: 80 };
  elements.push(supervisor);

  // Dispatcher (blue)
  const dispatcher = new Dispatcher({ name: 'Dispatcher' });
  dispatcher.bounds = { ...dispatcher.bounds, width: 60, height: 80 };
  elements.push(dispatcher);

  // LanguageModel element for palette
  const languageModel = new LanguageModel({ name: 'LanguageModel' });
  elements.push(languageModel);

  return elements;
};