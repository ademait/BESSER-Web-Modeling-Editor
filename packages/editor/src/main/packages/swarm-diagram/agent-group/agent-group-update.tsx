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
import { AgentGroup } from './agent-group';
import { ModelState } from '../../../components/store/model-state';

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

interface OwnProps {
  element: AgentGroup;
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

class AgentGroupUpdateComponent extends Component<Props> {
  private rename = (id: string) => (value: string) => {
    this.props.update(id, { name: value });
  };

  private changeFramework = (id: string) => (value: string) => {
    const updateData: any = { framework: value };
    this.props.update(id, updateData);
  };

  private changeNumAgents = (id: string) => (value: string) => {
    const updateData: any = { numAgents: parseInt(value, 10) || 1 };
    this.props.update(id, updateData);
  };

  private changePersona = (id: string) => (value: string) => {
    const updateData: any = { persona: value };
    this.props.update(id, updateData);
  };

  private changeRole = (id: string) => (value: string) => {
    const updateData: any = { role: value };
    this.props.update(id, updateData);
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
          <Dropdown value={element.framework} onChange={this.changeFramework(element.id)}>
            <Dropdown.Item value="BESSER-BAF">BESSER-BAF</Dropdown.Item>
          </Dropdown>
        </section>
        <section>
          <Textfield
            value={String(element.numAgents)}
            onChange={this.changeNumAgents(element.id)}
            type="number"
            placeholder="Number of Agents"
            min="1"
          />
        </section>
        <section>
          <Textfield
            value={element.persona}
            onChange={this.changePersona(element.id)}
            placeholder="Persona"
          />
        </section>
        <section>
          <Textfield
            value={element.role}
            onChange={this.changeRole(element.id)}
            placeholder="Role"
          />
        </section>
      </div>
    );
  }
}

export const AgentGroupUpdate = enhance(AgentGroupUpdateComponent);