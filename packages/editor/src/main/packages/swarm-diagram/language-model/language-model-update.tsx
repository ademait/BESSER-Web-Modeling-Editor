import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown'; // For enums
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { LanguageModel, ILanguageModel } from './language-model';
import { ModelState } from '../../../components/store/model-state';

interface OwnProps {
  element: LanguageModel;
}

type StateProps = {};

interface DispatchProps {
  update: typeof UMLElementRepository.update;
}

type Props = OwnProps & StateProps & DispatchProps;

class LanguageModelUpdateComponent extends Component<Props> {
  private rename = (id: string) => (name: string) => {
    this.props.update<ILanguageModel>(id, { name });
  };
  
  private changeProvider = (id: string) => (provider: string) => {
    this.props.update<ILanguageModel>(id, { provider });
  };
  
  render() {
    const { element } = this.props;
    return (
      <div>
        <label>Name</label>
        <Textfield
          value={element.name}
          onChange={(name) => this.props.update<ILanguageModel>(element.id, { name })}
        />
        <Dropdown
          value={element.provider}
          onChange={this.changeProvider(element.id)}>
            <Dropdown.Item value="OPENAI">OpenAI</Dropdown.Item>
            <Dropdown.Item value="GOOGLE">Google</Dropdown.Item>
            <Dropdown.Item value="ANTHROPIC">Anthropic</Dropdown.Item>
            <Dropdown.Item value="OLLAMA">Ollama</Dropdown.Item>
            <Dropdown.Item value="CUSTOM">Custom</Dropdown.Item>
        </Dropdown>
      </div>
    );
  }
}

export const LanguageModelUpdate = connect<StateProps, DispatchProps, OwnProps, ModelState>(
  null,
  { update: UMLElementRepository.update }
)(LanguageModelUpdateComponent);