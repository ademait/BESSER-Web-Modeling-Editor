import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { ILayer } from '../../../services/layouter/layer';
import * as Apollon from '../../../typings';

export interface ILanguageModel extends IUMLElement {
  provider: string;
  model: string;
  endpoint: string;
  temperature: number;
  maxTokens: number;
  apiKeySecret: string;
}

export class LanguageModel extends UMLElement implements ILanguageModel {
  static features: UMLElementFeatures = {
    ...UMLElement.features,
    resizable: true,
  };

  type: UMLElementType = SwarmElementType.LanguageModel;
  provider: string = 'OPENAI';
  model: string = 'gpt-4';
  endpoint: string = '';
  temperature: number = 0.7;
  maxTokens: number = 4096;
  apiKeySecret: string = '';

  constructor(values?: DeepPartial<ILanguageModel>) {
    super(values);
    this.name = values?.name ?? 'LanguageModel';
    this.provider = values?.provider ?? 'OPENAI';
    this.model = values?.model ?? 'gpt-4';
    this.endpoint = values?.endpoint ?? '';
    this.temperature = values?.temperature ?? 0.7;
    this.maxTokens = values?.maxTokens ?? 4096;
    this.apiKeySecret = values?.apiKeySecret ?? '';
    this.bounds = {
      x: 0,
      y: 0,
      width: 160,
      height: 70,
      ...values?.bounds,
    };
  }

  serialize(): Apollon.LanguageModel {
    return {
      ...super.serialize(),
      type: this.type as UMLElementType,
      provider: this.provider,
      model: this.model,
      endpoint: this.endpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      apiKeySecret: this.apiKeySecret,
    };
  }

  render(canvas: ILayer): ILayoutable[] {
    return [this];
  }
}