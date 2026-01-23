import { ComposePreview } from '../compose-preview';
import { UMLElement } from '../../services/uml-element/uml-element';
import { ILayer } from '../../services/layouter/layer';
import { Swarm } from './swarm/swarm';
import { AgentGroup } from './agent-group/agent-group';
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

  // AgentGroup element for palette
  const agentGroup = new AgentGroup({ name: 'AgentGroup' });
  elements.push(agentGroup);

  // LanguageModel element for palette
  const languageModel = new LanguageModel({ name: 'LanguageModel' });
  elements.push(languageModel);

  return elements;
};