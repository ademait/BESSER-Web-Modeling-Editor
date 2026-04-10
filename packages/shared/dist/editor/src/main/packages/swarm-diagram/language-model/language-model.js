import { UMLElement } from '../../../services/uml-element/uml-element';
import { SwarmElementType } from '..';
export class LanguageModel extends UMLElement {
    constructor(values) {
        super(values);
        this.type = SwarmElementType.LanguageModel;
        this.provider = 'OPENAI';
        this.model = 'gpt-4';
        this.endpoint = '';
        this.temperature = 0.7;
        this.maxTokens = 4096;
        this.apiKeySecret = '';
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
    serialize() {
        return {
            ...super.serialize(),
            type: this.type,
            provider: this.provider,
            model: this.model,
            endpoint: this.endpoint,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            apiKeySecret: this.apiKeySecret,
        };
    }
    render(canvas) {
        if (this.bounds.width < LanguageModel.MIN_WIDTH) {
            this.bounds.width = LanguageModel.MIN_WIDTH;
        }
        if (this.bounds.height < LanguageModel.MIN_HEIGHT) {
            this.bounds.height = LanguageModel.MIN_HEIGHT;
        }
        return [this];
    }
}
LanguageModel.features = {
    ...UMLElement.features,
    resizable: true,
};
LanguageModel.MIN_WIDTH = 140;
LanguageModel.MIN_HEIGHT = 50;
//# sourceMappingURL=language-model.js.map