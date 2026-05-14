import React, { Component, ComponentClass } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button } from '../../../components/controls/button/button';
import { Divider } from '../../../components/controls/divider/divider';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { I18nContext } from '../../../components/i18n/i18n-context';
import { localized } from '../../../components/i18n/localized';
import { ModelState } from '../../../components/store/model-state';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { StylePane } from '../../../components/style-pane/style-pane';
import { BPMNAgenticLane } from './bpmn-agentic-lane';
import { BPMNAgentRole } from '../common/types';

interface OwnProps {
  element: BPMNAgenticLane;
}
type StateProps = {};
interface DispatchProps {
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
}
type Props = OwnProps & StateProps & DispatchProps & I18nContext;

const enhance = compose<ComponentClass<OwnProps>>(
  localized,
  connect<StateProps, DispatchProps, OwnProps, ModelState>(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
  }),
);

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

type State = { colorOpen: boolean };

class BPMNAgenticLaneUpdateComponent extends Component<Props, State> {
  state = { colorOpen: false };

  private toggleColor = () => this.setState((s) => ({ colorOpen: !s.colorOpen }));

  render() {
    const { element } = this.props;
    return (
      <div>
        <section>
          <Flex>
            <Textfield value={element.name} onChange={this.rename(element.id)} autoFocus />
            <ColorButton onClick={this.toggleColor} />
            <Button color="link" tabIndex={-1} onClick={this.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
          <StylePane
            open={this.state.colorOpen}
            element={element}
            onColorChange={this.props.update}
            lineColor
            textColor
            fillColor
          />
        </section>
        <section>
          <Divider />
          <Flex>
            <span>{this.props.translate('packages.BPMN.BPMNTrustScore')}</span>
            <Textfield value={String(element.trustScore)} onChange={this.changeTrustScore(element.id)} />
          </Flex>
        </section>
        <section>
          <Divider />
          <Dropdown value={element.role} onChange={this.changeRole(element.id)}>
            <Dropdown.Item value={'worker'}>{this.props.translate('packages.BPMN.BPMNAgentRoleWorker')}</Dropdown.Item>
            <Dropdown.Item value={'manager'}>
              {this.props.translate('packages.BPMN.BPMNAgentRoleManager')}
            </Dropdown.Item>
          </Dropdown>
        </section>
      </div>
    );
  }

  private rename = (id: string) => (value: string) => this.props.update(id, { name: value });

  private changeTrustScore = (id: string) => (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const clamped = Math.min(100, Math.max(0, Number.isFinite(parsed) ? parsed : 0));
    this.props.update<BPMNAgenticLane>(id, { trustScore: clamped });
  };

  private changeRole = (id: string) => (value: string) => {
    this.props.update<BPMNAgenticLane>(id, { role: value as BPMNAgentRole });
  };

  private delete = (id: string) => () => this.props.delete(id);
}

export const BPMNAgenticLaneUpdate = enhance(BPMNAgenticLaneUpdateComponent);
