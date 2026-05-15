import React, { Component, ComponentClass } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button } from '../../../components/controls/button/button';
import { Divider } from '../../../components/controls/divider/divider';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { I18nContext } from '../../../components/i18n/i18n-context';
import { localized } from '../../../components/i18n/localized';
import { ModelState } from '../../../components/store/model-state';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { BPMNTask, BPMNTaskType } from './bpmn-task';
import { StylePane } from '../../../components/style-pane/style-pane';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { Switch } from '../../../components/controls/switch/switch';
import { BPMNCollaborationMode, BPMNMarkerType, BPMNReflectionMode, clampTrustScore } from '../common/types';
import { BpmnLoopMarkerIcon } from '../common/markers/bpmn-loop-marker-icon';
import { BPMNParallelMarkerIcon } from '../common/markers/bpmn-parallel-marker-icon';
import { BPMNSequentialMarkerIcon } from '../common/markers/bpmn-sequential-marker-icon';

interface OwnProps {
  element: BPMNTask;
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

class BPMNTaskUpdateComponent extends Component<Props, State> {
  state = { colorOpen: false };

  private toggleColor = () => {
    this.setState((state) => ({
      colorOpen: !state.colorOpen,
    }));
  };

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
          <section>
            <StylePane
              open={this.state.colorOpen}
              element={element}
              onColorChange={this.props.update}
              lineColor
              textColor
              fillColor
            />
          </section>
        </section>
        <section>
          <Divider />
          <Dropdown value={element.taskType} onChange={this.changeTaskType(element.id)}>
            <Dropdown.Item value={'default'}>{this.props.translate('packages.BPMN.BPMNTask')}</Dropdown.Item>
            <Dropdown.Item value={'user'}>{this.props.translate('packages.BPMN.BPMNUserTask')}</Dropdown.Item>
            <Dropdown.Item value={'service'}>{this.props.translate('packages.BPMN.BPMNServiceTask')}</Dropdown.Item>
            <Dropdown.Item value={'send'}>{this.props.translate('packages.BPMN.BPMNSendTask')}</Dropdown.Item>
            <Dropdown.Item value={'receive'}>{this.props.translate('packages.BPMN.BPMNReceiveTask')}</Dropdown.Item>
            <Dropdown.Item value={'manual'}>{this.props.translate('packages.BPMN.BPMNManualTask')}</Dropdown.Item>
            <Dropdown.Item value={'business-rule'}>
              {this.props.translate('packages.BPMN.BPMNBusinessRuleTask')}
            </Dropdown.Item>
            <Dropdown.Item value={'script'}>{this.props.translate('packages.BPMN.BPMNScriptTask')}</Dropdown.Item>
          </Dropdown>
        </section>
        <section>
          <Divider />
          <Switch value={element.marker as BPMNMarkerType} onChange={this.changeMarker(element.id)} color="primary">
            <Switch.Item value={'parallel multi instance'}>
              <BPMNParallelMarkerIcon stroke="currentColor" />
            </Switch.Item>
            <Switch.Item value={'sequential multi instance'}>
              <BPMNSequentialMarkerIcon stroke="currentColor" />
            </Switch.Item>
            <Switch.Item value={'loop'}>
              <BpmnLoopMarkerIcon stroke="currentColor" />
            </Switch.Item>
          </Switch>
        </section>
        {/* Agentic BPMN (04D): the "Agentic" toggle marks the task as agentic
            and reveals the reflection-mode / trust-score fields. */}
        <section>
          <Divider />
          <Switch value={element.isAgentic ? 'agentic' : ''} onChange={this.toggleAgentic(element.id)} color="primary">
            <Switch.Item value={'agentic'}>{this.props.translate('packages.BPMN.BPMNAgentic')}</Switch.Item>
          </Switch>
        </section>
        {element.isAgentic && (
          <>
            <section>
              <Divider />
              <Dropdown value={element.reflectionMode} onChange={this.changeReflectionMode(element.id)}>
                <Dropdown.Item value={'none'}>{this.props.translate('packages.BPMN.BPMNReflectionNone')}</Dropdown.Item>
                <Dropdown.Item value={'self'}>{this.props.translate('packages.BPMN.BPMNReflectionSelf')}</Dropdown.Item>
                <Dropdown.Item value={'cross'}>
                  {this.props.translate('packages.BPMN.BPMNReflectionCross')}
                </Dropdown.Item>
                <Dropdown.Item value={'human'}>
                  {this.props.translate('packages.BPMN.BPMNReflectionHuman')}
                </Dropdown.Item>
              </Dropdown>
            </section>
            <section>
              <Divider />
              <Flex>
                <span>{this.props.translate('packages.BPMN.BPMNTrustScore')}</span>
                <Textfield value={String(element.trustScore)} onChange={this.changeTrustScore(element.id)} />
              </Flex>
            </section>
            {/* Collaboration mode on AgenticTask — extends the paper (D-D1 of
                guide 04D1). Popup-only; no canvas glyph for now. */}
            <section>
              <Divider />
              <Dropdown value={element.collaborationMode} onChange={this.changeCollaborationMode(element.id)}>
                <Dropdown.Item value={'voting'}>{this.props.translate('packages.BPMN.BPMNCollabVoting')}</Dropdown.Item>
                <Dropdown.Item value={'role'}>{this.props.translate('packages.BPMN.BPMNCollabRole')}</Dropdown.Item>
                <Dropdown.Item value={'debate'}>{this.props.translate('packages.BPMN.BPMNCollabDebate')}</Dropdown.Item>
                <Dropdown.Item value={'competition'}>
                  {this.props.translate('packages.BPMN.BPMNCollabCompetition')}
                </Dropdown.Item>
              </Dropdown>
            </section>
          </>
        )}
      </div>
    );
  }

  /**
   * Rename the task
   * @param id The ID of the task that should be renamed
   */
  private rename = (id: string) => (value: string) => {
    this.props.update(id, { name: value });
  };

  /**
   * Change the type of the task
   * @param id The ID of the task whose type should be changed
   */
  private changeTaskType = (id: string) => (value: string) => {
    this.props.update<BPMNTask>(id, { taskType: value as BPMNTaskType });
  };

  /**
   * Change the marker of the task
   * @param id The ID of the task whose marker should be changed
   */
  private changeMarker = (id: string) => (value: string) => {
    if (this.props.element.marker === value) {
      this.props.update<BPMNTask>(id, { marker: 'none' as BPMNMarkerType });
      return;
    }

    this.props.update<BPMNTask>(id, { marker: value as BPMNMarkerType });
  };

  /**
   * Toggle whether the task is agentic (Agentic BPMN — 04D)
   * @param id The ID of the task to toggle
   */
  private toggleAgentic = (id: string) => (_value: string) => {
    this.props.update<BPMNTask>(id, { isAgentic: !this.props.element.isAgentic });
  };

  /**
   * Change the reflection mode of an agentic task
   * @param id The ID of the task whose reflection mode should be changed
   */
  private changeReflectionMode = (id: string) => (value: string) => {
    this.props.update<BPMNTask>(id, { reflectionMode: value as BPMNReflectionMode });
  };

  /**
   * Change the trust score of an agentic task (clamped to 0–100)
   * @param id The ID of the task whose trust score should be changed
   */
  private changeTrustScore = (id: string) => (value: string) => {
    const parsed = Number.parseInt(value, 10);
    this.props.update<BPMNTask>(id, { trustScore: clampTrustScore(Number.isFinite(parsed) ? parsed : 0) });
  };

  /**
   * Change the collaboration mode on an agentic task (04D1 — D-D1 extension).
   */
  private changeCollaborationMode = (id: string) => (value: string) => {
    this.props.update<BPMNTask>(id, { collaborationMode: value as BPMNCollaborationMode });
  };

  /**
   * Delete a task
   * @param id The ID of the task that should be deleted
   */
  private delete = (id: string) => () => {
    this.props.delete(id);
  };
}

export const BPMNTaskUpdate = enhance(BPMNTaskUpdateComponent);
