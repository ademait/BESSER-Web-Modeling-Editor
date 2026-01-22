import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown'; // For enums
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { Swarm, ISwarm } from './swarm';
import { ModelState } from '../../../components/store/model-state';

interface OwnProps {
  element: Swarm;
}

type StateProps = {};

interface DispatchProps {
  update: typeof UMLElementRepository.update;
}

type Props = OwnProps & StateProps & DispatchProps;

class SwarmUpdateComponent extends Component<Props> {
  private changeFramework = (id: string) => (framework: string) => {
    this.props.update<ISwarm>(id, { framework });
  };
  render() {
    const { element } = this.props;
    return (
      <div>
        <label>Name</label>
        <Textfield
          value={element.name}
          onChange={(name) => this.props.update<ISwarm>(element.id, { name })}
        />
        <Dropdown
          value={element.framework}
          onChange={this.changeFramework(element.id)}>
            <Dropdown.Item value="BESSER-BAF">BESSER-BAF</Dropdown.Item>
        </Dropdown>
      </div>
    );
  }
}

export const SwarmUpdate = connect<StateProps, DispatchProps, OwnProps, ModelState>(
  null,
  { update: UMLElementRepository.update }
)(SwarmUpdateComponent);