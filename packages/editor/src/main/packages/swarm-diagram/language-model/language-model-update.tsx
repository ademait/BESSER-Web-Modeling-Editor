import React, { Component, ComponentClass } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown'; // For enums
import { Button } from '../../../components/controls/button/button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Divider } from '../../../components/controls/divider/divider';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { LanguageModel, ILanguageModel } from './language-model';
import { ModelState } from '../../../components/store/model-state';

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

interface OwnProps {
  element: LanguageModel;
}

type StateProps = {};

interface DispatchProps {
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
}

type Props = OwnProps & StateProps & DispatchProps;

const enhance = compose<ComponentClass<OwnProps>>(
  connect<StateProps, DispatchProps, OwnProps, ModelState>(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
  }),
);

class LanguageModelUpdateComponent extends Component<Props> {
  private rename = (id: string) => (value: string) => {
    this.props.update<ILanguageModel>(id, { name: value });
  };

  private changeProvider = (id: string) => (value: string) => {
    this.props.update<ILanguageModel>(id, { provider: value });
  };

  private delete = (id: string) => () => {
    this.props.delete(id);
  };
  
  render() {
    const { element } = this.props;
    return (
      <div>
        <section>
          <Flex>
            <Textfield value={element.name} onChange={this.rename(element.id)} autoFocus />
            <Button color="link" tabIndex={-1} onClick={this.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
          <Divider />
        </section>
        <section>
          <Dropdown value={element.provider} onChange={this.changeProvider(element.id)}>
            <Dropdown.Item value="OPENAI">OpenAI</Dropdown.Item>
            <Dropdown.Item value="GOOGLE">Google</Dropdown.Item>
            <Dropdown.Item value="ANTHROPIC">Anthropic</Dropdown.Item>
            <Dropdown.Item value="OLLAMA">Ollama</Dropdown.Item>
            <Dropdown.Item value="CUSTOM">Custom</Dropdown.Item>
          </Dropdown>
        </section>
      </div>
    );
  }
}

export const LanguageModelUpdate = enhance(LanguageModelUpdateComponent);