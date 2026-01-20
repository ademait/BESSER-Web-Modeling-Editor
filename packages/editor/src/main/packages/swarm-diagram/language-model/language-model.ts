import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { ILayer } from '../../../services/layouter/layer';

export interface ILanguageModel extends IUMLElement {
  provider: string;
  model: string;
}

export class LanguageModel extends UMLElement implements ILanguageModel {
  static features: UMLElementFeatures = {
    ...UMLElement.features,
    resizable: true,
  };

  type: UMLElementType = SwarmElementType.LanguageModel;
  provider: string = 'OpenAI';
  model: string = 'gpt-4';

  constructor(values?: DeepPartial<ILanguageModel>) {
    super(values);
    this.name = values?.name ?? 'LanguageModel';
    this.provider = values?.provider ?? 'OpenAI';
    this.model = values?.model ?? 'gpt-4';
    this.bounds = {
      x: 0,
      y: 0,
      width: 160,
      height: 70,
      ...values?.bounds,
    };
  }

  render(canvas: ILayer): ILayoutable[] {
    return [this];
  }
}