import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown'; // For enums
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { AgentGroup, IAgentGroup } from './agent-group';
import { ModelState } from '../../../components/store/model-state';

// Define framework options
const frameworkOptions = [
  { value: 'BESSER-BAF', label: 'BESSER-BAF' },
];

interface OwnProps {
  element: AgentGroup;
}

type StateProps = {};

interface DispatchProps {
  update: typeof UMLElementRepository.update;
}

type Props = OwnProps & StateProps & DispatchProps;

class AgentGroupUpdateComponent extends Component<Props> {
  private changeFramework = (id: string) => (framework: string) => {
      this.props.update<IAgentGroup>(id, { framework });
  };
  
  render() {
    const { element } = this.props;
    return (
      <div>
        <label>Name</label>
        <Textfield
          value={element.name}
          onChange={(name) => this.props.update<IAgentGroup>(element.id, { name })}
        />
        <Dropdown
          value={element.framework}
          onChange={this.changeFramework(element.id)}>
            <Dropdown.Item value="BESSER-BAF">BESSER-BAF</Dropdown.Item>
        </Dropdown>
        <label>Number of Agents</label>
        <Textfield
            value={String(element.numAgents)}
            onChange={(value) => this.props.update<IAgentGroup>(element.id, { numAgents: parseInt(value, 10) || 1 })}
            type="number"
        />
      </div>
    );
  }
}

export const AgentGroupUpdate = connect<StateProps, DispatchProps, OwnProps, ModelState>(
  null,
  { update: UMLElementRepository.update }
)(AgentGroupUpdateComponent);